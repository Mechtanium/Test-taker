
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin } from 'lucide-react';
import AnnahAiLogo from '@/components/annah-ai-logo';
import LoginBar from '@/components/LoginBar';
import { myWixClient, removeTokensFromCookie } from '@/lib/wix-client';
import type { Member } from '@/lib/utils';
import { useAsyncHandler } from '@/hooks/useAsyncHandler';
import { cn } from '@/lib/utils';

interface QuestionOption {
  text: string;
}
interface Question {
  _id: string;
  query: string;
  test_id: string;
  type: "MCQ" | "G_OBJ" | "SHORT" | "PARAGRAPH";
  dur_millis: number;
  options?: QuestionOption[] | string[]; // Can be array of objects or strings after processing
}

interface Answer {
  questionId: string;
  questionType: Question['type'];
  answer: string;
  timeTaken: number;
}

interface TestInfo {
  _id: string;
  title: string;
  start: string; // HH:MM:SS.sss
  stop: string;  // HH:MM:SS.sss (late start)
  date: string;  // YYYY-MM-DD or full ISO
  instructions?: string;
  banner?: string;
  geolocation?: {
    latitude: number;
    longitude: number;
    description?: string;
  };
  attempts?: number; // Max number of attempts allowed
  course_id?: string;
}

type TestAvailabilityStatus = 'loading' | 'available' | 'unavailable_early' | 'unavailable_late' | 'unavailable_no_info';
type AttemptCheckStatus = 'idle' | 'loading' | 'checked' | 'exceeded' | 'error_checking_attempts';


const questionTypeOrder: Question['type'][] = ["MCQ", "G_OBJ", "SHORT", "PARAGRAPH"];
const SUBMISSION_API_PROXY_ENDPOINT = "/api/submit-assessment";
const TEST_DATA_API_PROXY_ENDPOINT = "/api/test-proxy";
const COUNT_ASSESSMENTS_API_PROXY_ENDPOINT = "/api/count-assessments";


function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

function sortAndGroupQuestions(questionsToSort: Question[]): Question[] {
  const groupedQuestions: { [key in Question['type']]?: Question[] } = {};
  questionTypeOrder.forEach(type => groupedQuestions[type] = []);

  questionsToSort.forEach(q => {
    const typeKey = questionTypeOrder.includes(q.type) ? q.type : 'PARAGRAPH'; // Default to PARAGRAPH if type is unknown
    if (groupedQuestions[typeKey]) {
      groupedQuestions[typeKey]!.push(q);
    } else {
      // This case should ideally not be reached if typeKey is always valid
      groupedQuestions['PARAGRAPH']!.push(q);
    }
  });

  let sortedAndShuffledQuestions: Question[] = [];
  questionTypeOrder.forEach(type => {
    if (groupedQuestions[type] && groupedQuestions[type]!.length > 0) {
      sortedAndShuffledQuestions = sortedAndShuffledQuestions.concat(shuffleArray(groupedQuestions[type]!));
    }
  });
  return sortedAndShuffledQuestions;
}

// Helper function to create Date objects
function createDateTime(dateString: string | undefined, timeString: string): Date | null {
  if (!timeString) return null;

  const today = new Date();
  const year = dateString ? new Date(dateString).getFullYear() : today.getFullYear();
  const month = dateString ? new Date(dateString).getMonth() : today.getMonth();
  const day = dateString ? new Date(dateString).getDate() : today.getDate();

  const [hours, minutes, secondsPart] = timeString.split(':');
  const seconds = secondsPart ? parseInt(secondsPart.split('.')[0], 10) : 0;

  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(parseInt(hours, 10)) || isNaN(parseInt(minutes, 10)) || isNaN(seconds)) {
    console.error("Invalid date/time input for createDateTime", { dateString, timeString });
    return null;
  }

  return new Date(year, month, day, parseInt(hours, 10), parseInt(minutes, 10), seconds);
}


export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1);
  const [_timeLeft, setTimeLeft] = useState<number>(0);
  const [answer, setAnswer] = useState<string>('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [studentEmail, setStudentEmail] = useState<string>('');
  const [matriculationNumber, setMatriculationNumber] = useState<string>('');
  const [testStarted, setTestStarted] = useState<boolean>(false);
  const [testFinished, setTestFinished] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const [penaltyQuestions, setPenaltyQuestions] = useState<Question[]>([]);

  const [wixMember, setWixMember] = useState<Member | null | undefined>(undefined);
  const [isWixAuthLoading, setIsWixAuthLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionStatusMessage, setSubmissionStatusMessage] = useState<string>('');
  const [testInfo, setTestInfo] = useState<TestInfo | null>(null);
  const [testAvailabilityStatus, setTestAvailabilityStatus] = useState<TestAvailabilityStatus>('loading');
  const [userAttemptsCount, setUserAttemptsCount] = useState<number | null>(null);
  const [attemptCheckStatus, setAttemptCheckStatus] = useState<AttemptCheckStatus>('idle');


  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const initialViewportHeightRef = useRef<number>(0);
  const { toast } = useToast();
  const answerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const penaltyTriggeredRef = useRef(false);
  const handleNextQuestionRef = useRef<() => void>(() => { });

  const handleAsync = useAsyncHandler();

  const fetchWixMember = useCallback(async () => {
    setIsWixAuthLoading(true);
    await handleAsync(async () => {
      if (myWixClient.auth.loggedIn()) {
        const currentMember = await myWixClient.members.getCurrentMember();
        setWixMember(currentMember.member || null);
      } else {
        setWixMember(null);
      }
    });
    setIsWixAuthLoading(false);
  }, [handleAsync]);

  useEffect(() => {
    fetchWixMember();
  }, [fetchWixMember]);

  const handleWixLogin = useCallback(async () => {
    setIsWixAuthLoading(true);
    await handleAsync(async () => {
      const redirectUri = `${window.location.origin}/login-callback`;
      const originalUriToReturnTo = window.location.href; 

      const oauthData = myWixClient.auth.generateOAuthData(redirectUri, originalUriToReturnTo);
      localStorage.setItem('oauthRedirectData', JSON.stringify(oauthData)); 

      const { authUrl } = await myWixClient.auth.getAuthUrl(oauthData); 
      window.location.href = authUrl;
    });
    setIsWixAuthLoading(false);
  }, [handleAsync]);

  const handleWixLogout = useCallback(async () => {
    setIsWixAuthLoading(true);
    await handleAsync(async () => {
      const { logoutUrl } = await myWixClient.auth.logout(window.location.href);
      removeTokensFromCookie();
      setWixMember(null);
      window.location.href = logoutUrl;
    });
    setIsWixAuthLoading(false); 
  }, [handleAsync]);


  const handleAnswerEventPrevent = (e: React.ClipboardEvent<HTMLTextAreaElement | HTMLDivElement> | React.DragEvent<HTMLTextAreaElement | HTMLDivElement> | React.TouchEvent<HTMLTextAreaElement | HTMLDivElement>, action: string) => {
    let target = e.target as HTMLElement;
    let isAllowedInput = false;

    if (e.type.startsWith('touch') && (e as React.TouchEvent).changedTouches.length > 0) {
      const touchTarget = document.elementFromPoint(
        (e as React.TouchEvent).changedTouches[0].clientX,
        (e as React.TouchEvent).changedTouches[0].clientY
      );
      if (touchTarget) target = touchTarget as HTMLElement;
    }

    let parent = target;
    while (parent && parent !== document.body) {
      if (parent.tagName === 'TEXTAREA' || parent.tagName === 'INPUT' ||
        parent.getAttribute('role') === 'radio' ||
        (parent.tagName === 'LABEL' && parent.closest('[role="radiogroup"]'))) {
        isAllowedInput = true;
        break;
      }
      parent = parent.parentElement as HTMLElement;
    }
    
    const isPasteOnAnswerTextarea = target.tagName === 'TEXTAREA' && target.getAttribute('aria-label') === 'Answer input area' && action.toLowerCase() === 'paste';

    if (isPasteOnAnswerTextarea) {
      e.preventDefault();
      toast({
        title: 'Action Disabled',
        description: `Pasting is disabled for the answer box.`,
        variant: 'destructive',
        duration: 2000,
      });
      return;
    }

    if (!isAllowedInput && (e.type === 'copy' || e.type === 'cut' || e.type === 'dragstart' || e.type === 'drop')) {
      e.preventDefault();
      toast({
        title: 'Action Disabled',
        description: `${action}ing is disabled here.`,
        variant: 'destructive',
        duration: 2000,
      });
    }
  };

  const submitTestResults = useCallback(async (submissionStatusType: 'completed' | 'penalized', reason?: string) => {
    setIsSubmitting(true);
    setSubmissionStatusMessage('Submitting answers...');
    penaltyTriggeredRef.current = (submissionStatusType === 'penalized');

    const currentQuestionId = (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) ? questions[currentQuestionIndex]._id : null;
    const currentQuestionType = (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) ? questions[currentQuestionIndex].type : undefined;
    const timeTakenForCurrent = Date.now() - startTimeRef.current;

    let finalAnswers = [...answers];
    if (currentQuestionId && currentQuestionType && !finalAnswers.some(a => a.questionId === currentQuestionId)) {
      finalAnswers.push({ questionId: currentQuestionId, questionType: currentQuestionType, answer, timeTaken: timeTakenForCurrent });
    }

    const queryParams = new URLSearchParams(window.location.search);
    const testIdFromUrl = queryParams.get('q');

    const submissionData = {
      _owner: wixMember?._id || "ANONYMOUS_USER",
      matriculationNumber,
      studentEmail,
      test_id: testIdFromUrl,
      location: "Geo-location not implemented",
      status: submissionStatusType,
      type: "testSubmission",
      answers: finalAnswers,
      ...(reason && { penalty_reason: reason })
    };

    console.log('Submitting test data:', submissionData);

    const maxRetries = 7;
    const initialDelay = 1000; 

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(SUBMISSION_API_PROXY_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submissionData),
        });

        if (response.ok) {
          const responseData = await response.json();
          console.log('Submission successful via API proxy:', responseData);
          setSubmissionStatusMessage('Submission Successful! Your test results have been submitted.');
          toast({ title: 'Submission Successful', description: 'Your test results have been submitted.' });
          setIsSubmitting(false);

          if (window.parent !== window) {
            window.parent.postMessage({ ...submissionData, type: 'testResults', details: responseData, status: submissionStatusType }, '*');
            console.log(`Posted ${submissionStatusType} test submission to parent.`);
          }
          return; 
        }
        const errorData = await response.text();
        throw new Error(`API submission failed with status ${response.status}: ${errorData}`);

      } catch (error) {
        console.error(`Submission attempt ${attempt + 1} failed:`, error);
        if (attempt === maxRetries - 1) {
          setSubmissionStatusMessage(`Submission Failed. Could not submit results after ${maxRetries} attempts. ${error instanceof Error ? error.message : 'Unknown error'}`);
          toast({ title: 'Submission Error', description: `Could not submit results after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: 'destructive', duration: 10000 });
          setIsSubmitting(false);
          if (window.parent !== window) {
            window.parent.postMessage({ ...submissionData, type: 'testSubmissionError', error: error instanceof Error ? error.message : 'Unknown error', status: submissionStatusType }, '*');
          }
          return; 
        }
        const delay = initialDelay * Math.pow(2, attempt); 
        setSubmissionStatusMessage(`Submission attempt ${attempt + 1} failed. Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, [answers, currentQuestionIndex, questions, answer, wixMember, studentEmail, matriculationNumber, toast]); 


  const handlePenalty = useCallback((reason: string) => {
    if (penaltyTriggeredRef.current || !testStarted || testFinished) return;

    toast({
      title: 'Test Violation Detected',
      description: `${reason}. Your current answers will be submitted, and the test will end.`,
      variant: 'destructive',
      duration: 10000,
    });

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setTestFinished(true);
    setCurrentQuestionIndex(-1); 

    submitTestResults('penalized', reason);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error("Error exiting fullscreen:", err));
    }
  }, [testStarted, testFinished, toast, submitTestResults]);


  const processReceivedQuestions = useCallback((receivedQuestions: Question[]) => {
    const processed = sortAndGroupQuestions(receivedQuestions);
    setQuestions(processed);
    setIsLoading(false); 
  }, []);

  useEffect(() => {
    if (testInfo) { 
      const currentTime = new Date();

      if (!testInfo.start) {
        console.log("Test start time is not available. Assuming test is available.");
        setTestAvailabilityStatus('available');
        return;
      }

      const testStartDateTime = createDateTime(testInfo.date, testInfo.start);

      if (!testStartDateTime) {
        console.error("Could not parse test start date/time. Assuming test is unavailable.");
        setTestAvailabilityStatus('unavailable_no_info'); 
        return;
      }

      if (testInfo.stop) { 
        const testStopDateTime = createDateTime(testInfo.date, testInfo.stop);
        if (!testStopDateTime) {
          console.error("Could not parse test stop date/time. Checking only against start time.");
          if (currentTime < testStartDateTime) {
            setTestAvailabilityStatus('unavailable_early');
          } else {
            setTestAvailabilityStatus('available');
          }
          return;
        }

        if (currentTime < testStartDateTime) {
          setTestAvailabilityStatus('unavailable_early');
        } else if (currentTime > testStopDateTime) {
          setTestAvailabilityStatus('unavailable_late');
        } else {
          setTestAvailabilityStatus('available');
        }
      } else { 
        if (currentTime < testStartDateTime) {
          setTestAvailabilityStatus('unavailable_early');
        } else {
          setTestAvailabilityStatus('available');
        }
      }
    } else if (!testInfo && !isLoading) { 
      setTestAvailabilityStatus('unavailable_no_info');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testInfo]); 


  useEffect(() => {
    if (testAvailabilityStatus === 'available' && testInfo && wixMember && testInfo.attempts && testInfo.attempts > 0) {
      setAttemptCheckStatus('loading');
      const fetchAttempts = async () => {
        try {
          const response = await fetch(`${COUNT_ASSESSMENTS_API_PROXY_ENDPOINT}?test=${testInfo._id}&_owner=${wixMember._id}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch attempts: ${response.status}`);
          }
          const data = await response.json();
          const currentAttempts = data.count; // Assuming API returns { count: number }
          setUserAttemptsCount(currentAttempts);
          if (currentAttempts >= (testInfo.attempts ?? Infinity)) {
            setAttemptCheckStatus('exceeded');
          } else {
            setAttemptCheckStatus('checked');
          }
        } catch (error) {
          console.error("Error fetching user attempts:", error);
          toast({ title: "Error", description: "Could not verify previous attempts. Please try refreshing.", variant: "destructive" });
          setAttemptCheckStatus('error_checking_attempts');
        }
      };
      fetchAttempts();
    } else if (testInfo && (!testInfo.attempts || testInfo.attempts <= 0)) {
      // If no attempt limit is set or it's not positive, consider attempts check as passed
      setAttemptCheckStatus('checked');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testAvailabilityStatus, testInfo, wixMember, toast]);


  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'questionsLoaded') {
        const receivedData = event.data;
        if (Array.isArray(receivedData.questions)) {
          const transformedQuestionsFromMessage = receivedData.questions.map((q: any) => {
            let newOptions: string[] | undefined = undefined;
            if (q.type === "MCQ" && Array.isArray(q.options)) {
              if (q.options.length > 0 && typeof q.options[0] === 'object' && q.options[0] !== null && 'text' in q.options[0]) {
                newOptions = q.options.map((opt: any) => opt.text as string);
              } else if (q.options.length > 0 && typeof q.options[0] === 'string') {
                newOptions = q.options as string[];
              } else {
                newOptions = []; 
              }
            }
            return { ...q, options: newOptions };
          });

          if (transformedQuestionsFromMessage.length > 0 && transformedQuestionsFromMessage[0]?.query) {
            processReceivedQuestions(transformedQuestionsFromMessage as Question[]);
          } else if (transformedQuestionsFromMessage.length === 0) {
            setQuestions([]);
            setIsLoading(false);
            console.log('Received empty questions list from parent.');
            toast({
              title: 'No Questions',
              description: 'The test has no questions loaded from the parent.',
              variant: 'destructive'
            });
          }
        }
        if (receivedData.test_info) {
          setTestInfo(receivedData.test_info as TestInfo);
        }
      } else if (event.data === 'TestLockReady') {
        console.log('Parent window acknowledged TestLockReady.');
      }
    };

    window.addEventListener('message', handleMessage);

    if (window.parent === window) {
      console.log('Not in iframe, attempting to fetch questions from URL via proxy.');
      setIsLoading(true);
      setTestAvailabilityStatus('loading'); 
      setAttemptCheckStatus('idle'); // Reset attempt check status on new test load
      const queryParams = new URLSearchParams(window.location.search);
      const testId = queryParams.get('q');

      if (testId) {
        const apiUrl = `${TEST_DATA_API_PROXY_ENDPOINT}?test=${testId}`;
        console.log(`Fetching data from: ${apiUrl}`);
        fetch(apiUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            if (data && data.test_info) {
              setTestInfo(data.test_info as TestInfo);
            } else {
              setTestInfo(null); 
              toast({ title: 'Missing Test Info', description: 'Test information could not be loaded.', variant: 'destructive' });
            }
            if (data && data.questions && Array.isArray(data.questions)) {
              const transformedQuestions = data.questions.map((q: any) => {
                let newOptions: string[] | undefined = undefined;
                if (q.type === "MCQ" && Array.isArray(q.options)) {
                  if (q.options.length > 0 && typeof q.options[0] === 'object' && q.options[0] !== null && 'text' in q.options[0]) {
                    newOptions = q.options.map((opt: any) => opt.text as string);
                  } else if (q.options.length > 0 && typeof q.options[0] === 'string') {
                    newOptions = q.options as string[];
                  } else {
                    newOptions = [];
                  }
                }
                return { ...q, options: newOptions };
              });

              if (transformedQuestions.length > 0 && transformedQuestions[0]?.query) {
                processReceivedQuestions(transformedQuestions as Question[]);
              } else if (transformedQuestions.length === 0) {
                setQuestions([]);
                console.log('Fetched empty questions list via proxy.');
                toast({
                  title: 'No Questions',
                  description: 'The test has no questions loaded from the source.',
                  variant: 'destructive'
                });
                setIsLoading(false);
              }
            } else {
              setQuestions([]); 
              console.error('Invalid data format or no questions array from proxy:', data);
              toast({ title: 'Invalid Data', description: 'Failed to parse questions from the server response via proxy.', variant: 'destructive' });
              setIsLoading(false); 
            }
          })
          .catch(error => {
            console.error('Failed to fetch test data via proxy:', error);
            toast({ title: 'Fetch Error', description: `Could not load test: ${error.message}`, variant: 'destructive' });
            setQuestions([]); 
            setTestInfo(null); 
            setIsLoading(false); 
            setTestAvailabilityStatus('unavailable_no_info'); // Set explicit status on fetch error
            setAttemptCheckStatus('error_checking_attempts'); // Also flag attempt check
          });
      } else {
        console.log('No test ID (q parameter) found in URL.');
        toast({
          title: 'Missing Test ID',
          description: 'Please provide a test ID in the URL (e.g., ?q=your_test_id).',
          variant: 'destructive'
        });
        setQuestions([]);
        setTestInfo(null);
        setIsLoading(false);
        setTestAvailabilityStatus('unavailable_no_info');
        setAttemptCheckStatus('idle');
      }
    } else {
      window.parent.postMessage('TestLockReady', '*');
      console.log('Posted TestLockReady message.');
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      console.log('Message listener removed.');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [processReceivedQuestions, toast]); 

  useEffect(() => {
    if (!testStarted || testFinished) return;

    const currentQForEffect = questions[currentQuestionIndex]; 

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Tab switched or window minimized.');
        handlePenalty('Tab switched or window minimized');
      }
    };

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const currentWidth = window.innerWidth;
      const screenHeight = screen.height;
      const screenWidth = screen.width;
      const isUnexpectedSize = Math.abs(currentHeight - screenHeight) > 200 || Math.abs(currentWidth - screenWidth) > 150;

      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      const previousOrientation = initialViewportHeightRef.current > 0 ? (initialViewportHeightRef.current < window.innerWidth) : isLandscape;
      const orientationChanged = isLandscape !== previousOrientation;
      const likelyKeyboard = initialViewportHeightRef.current > 0 && currentHeight < initialViewportHeightRef.current * 0.85; 

      if (initialViewportHeightRef.current > 0 && !orientationChanged && !likelyKeyboard && isUnexpectedSize) {
        console.log('Significant window resize detected.');
        handlePenalty('Window resized');
      } else {
        if (orientationChanged) {
          console.log('Orientation change detected, ignoring resize penalty.');
          initialViewportHeightRef.current = currentHeight; 
        }
        if (likelyKeyboard && currentQForEffect) {
          console.log('Possible virtual keyboard detected, ignoring resize penalty.');
          if (currentQForEffect.type !== 'MCQ' && answerTextareaRef.current) {
            answerTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else if (currentQForEffect.type === 'MCQ' && rightColumnRef.current) {
            rightColumnRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        console.log('Exited fullscreen mode.');
        handlePenalty('Exited fullscreen mode');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange); 
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);    
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);      
    console.log('Security listeners (visibility, resize, fullscreen) added.');

    if (testStarted && initialViewportHeightRef.current === 0) {
      initialViewportHeightRef.current = window.innerHeight;
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      console.log('Security listeners (visibility, resize, fullscreen) removed.');
    };
  }, [testStarted, testFinished, handlePenalty, questions, currentQuestionIndex]); 

  const internalHandleNextQuestion = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
      const timeTaken = Date.now() - startTimeRef.current;
      const currentQuestionId = questions[currentQuestionIndex]._id;
      const currentQuestionType = questions[currentQuestionIndex].type;

      setAnswers((prevAnswers) => {
        const existingAnswerIndex = prevAnswers.findIndex(a => a.questionId === currentQuestionId);
        if (existingAnswerIndex === -1) { 
          const newAnswer: Answer = { questionId: currentQuestionId, questionType: currentQuestionType, answer, timeTaken };
          return [...prevAnswers, newAnswer];
        } else { 
          const updatedAnswers = [...prevAnswers];
          updatedAnswers[existingAnswerIndex] = { questionId: currentQuestionId, questionType: currentQuestionType, answer, timeTaken };
          return updatedAnswers;
        }
      });
    }

    setAnswer(''); 

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
    } else {
      if (penaltyQuestions.length > 0) {
        const nextPenalty = penaltyQuestions[0];
        setQuestions(prev => [...prev, nextPenalty]); 
        setPenaltyQuestions(prev => prev.slice(1)); 
        setCurrentQuestionIndex(nextIndex); 
      } else {
        setTestFinished(true);
        setCurrentQuestionIndex(-1); 
        submitTestResults('completed'); 

        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => console.error("Error exiting fullscreen:", err));
        }
      }
    }
  }, [currentQuestionIndex, questions, answer, penaltyQuestions, submitTestResults, answers]); 


  useEffect(() => {
    handleNextQuestionRef.current = internalHandleNextQuestion;
  }, [internalHandleNextQuestion]);

  useEffect(() => {
    if (testStarted && currentQuestionIndex !== -1 && !testFinished && questions.length > 0 && currentQuestionIndex < questions.length) {
      if (timerRef.current) { 
        clearInterval(timerRef.current);
      }

      startTimeRef.current = Date.now();
      const currentQ = questions[currentQuestionIndex];
      const duration = currentQ?.dur_millis;

      if (typeof duration === 'number' && duration > 0) {
        setTimeLeft(duration); 

        timerRef.current = setInterval(() => {
          const elapsed = Date.now() - startTimeRef.current;
          const newRemainingTime = duration - elapsed;

          if (newRemainingTime <= 0) {
            if (timerRef.current) { 
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            handleNextQuestionRef.current(); 
          } else {
            setTimeLeft(newRemainingTime);
          }
        }, 100); 
      } else {
        setTimeLeft(-1); 
        console.warn(`Question ${currentQuestionIndex} has invalid or zero duration: ${duration}`);
      }

      if (currentQ && currentQ.type !== 'MCQ') {
        answerTextareaRef.current?.focus();
      }

    } else if (timerRef.current) { 
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => { 
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [testStarted, currentQuestionIndex, testFinished, questions]); 


  const handleAccept = async () => {
    if (!studentEmail || !matriculationNumber) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both student email and matriculation number.',
        variant: 'destructive',
      });
      return;
    }
    if (!wixMember) {
      toast({
        title: 'Login Required',
        description: 'Please log in using Wix to start the test.',
        variant: 'destructive',
      });
      return;
    }
    setIsAccepting(true);
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      } else if ((document.documentElement as any).mozRequestFullScreen) { 
        await (document.documentElement as any).mozRequestFullScreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) { 
        await (document.documentElement as any).webkitRequestFullscreen();
      } else if ((document.documentElement as any).msRequestFullscreen) { 
        await (document.documentElement as any).msRequestFullscreen();
      }
      setTimeout(() => {
        setTestStarted(true);
        setCurrentQuestionIndex(0); 
        setIsAccepting(false);
        console.log('Test started after fullscreen.');
        initialViewportHeightRef.current = window.innerHeight; 
      }, 500); 

    } catch (err) {
      console.error("Fullscreen request failed:", err);
      toast({
        title: 'Fullscreen Required',
        description: 'Could not enter fullscreen mode. Please ensure your browser allows it.',
        variant: 'destructive',
      });
      setIsAccepting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const totalMainQuestions = questions.filter(q => !penaltyQuestions.some(pq => pq._id === q._id)).length;
  const completedQuestions = currentQuestionIndex >= 0 ? currentQuestionIndex : 0; 

  const formatTime = (ms: number): string => {
    if (ms < 0) return "∞"; 
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  let waitingCardMessage = 'Please read the instructions and click "Accept & Start Test" when ready.';
  if (isLoading || testAvailabilityStatus === 'loading' || attemptCheckStatus === 'loading') {
    waitingCardMessage = testAvailabilityStatus === 'loading' ? 'Loading test questions and checking availability...' : 'Verifying previous attempts...';
  } else if (isWixAuthLoading) {
    waitingCardMessage = 'Checking login status...';
  } else if (!wixMember) {
    waitingCardMessage = 'Please log in using the button above to proceed.';
  } else if (questions.length === 0 && !isLoading) { 
    waitingCardMessage = 'No test questions are currently loaded. Please wait or contact support if this persists.';
  }


  return (
    <div
      ref={containerRef}
      className="flex flex-col md:flex-row h-full w-full bg-background text-foreground pointillism transition-all duration-300 ease-in-out"
      onCopy={(e) => handleAnswerEventPrevent(e, 'Copy')}
      onCut={(e) => handleAnswerEventPrevent(e, 'Cut')}
      onPaste={(e) => handleAnswerEventPrevent(e, 'Paste')}
      onDragStart={(e) => handleAnswerEventPrevent(e, 'Drag')}
      onDrop={(e) => handleAnswerEventPrevent(e, 'Drop')}
    >
      <div
        className={cn(
          "p-4 md:p-6 border-r border-border flex flex-col space-y-6 glass overflow-y-auto",
          testStarted ? "hidden md:flex md:w-2/5" : "w-full md:w-2/5" 
        )}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <AnnahAiLogo className="w-[180px] h-auto" />
            <p className="text-xs italic text-muted-foreground mt-1">Powered by...</p>
          </div>
          <LoginBar
            member={wixMember}
            onLogin={handleWixLogin}
            onLogout={handleWixLogout}
            isLoading={isWixAuthLoading}
          />
        </div>

        {testInfo && !testStarted && ( 
          <Card className="mb-0 glass">
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-xl">{testInfo.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-4">
              <div className="flex justify-between items-center text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Start Time</p>
                  <p className="font-semibold text-accent">{testInfo.start?.substring(0, 5)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground text-right">Late Start</p>
                  <p className="font-semibold text-destructive">{testInfo.stop?.substring(0, 5)}</p>
                </div>
              </div>
              {testInfo.geolocation && (
                <a
                  href={`https://www.google.com/maps?q=${testInfo.geolocation.latitude},${testInfo.geolocation.longitude}${testInfo.geolocation.description ? `+(${encodeURIComponent(testInfo.geolocation.description)})` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-xs text-foreground hover:text-accent transition-colors"
                >
                  <MapPin className="h-4 w-4" />
                  <span>View test location</span>
                </a>
              )}
            </CardContent>
          </Card>
        )}


        <Card className="glass">
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="studentEmail">Student Email</Label>
              <Input
                id="studentEmail"
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                disabled={testStarted || isAccepting || testFinished || isSubmitting}
                className="bg-white/80 dark:bg-black/30"
              />
            </div>
            <div>
              <Label htmlFor="matriculationNumber">Matriculation Number</Label>
              <Input
                id="matriculationNumber"
                type="text"
                value={matriculationNumber}
                onChange={(e) => setMatriculationNumber(e.target.value)}
                disabled={testStarted || isAccepting || testFinished || isSubmitting}
                className="bg-white/80 dark:bg-black/30"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="flex-grow glass"> 
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ol style={{ listStyleType: 'decimal', paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>Ensure you are logged in and have entered your correct email and matriculation number.</li>
              <li style={{ marginBottom: '0.5rem' }}>Click "Accept & Start Test" to enter fullscreen mode and begin.</li>
              <li style={{ marginBottom: '0.5rem' }}>Answer each question within the time limit shown.</li>
              <li style={{ marginBottom: '0.5rem' }}>The test will automatically proceed to the next question when the timer runs out or you submit.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Do not exit fullscreen, switch tabs, resize the window significantly, or attempt to copy/paste/drag. Doing so will result in immediate test submission or penalties.</strong></li>
              <li style={{ marginBottom: '0.5rem' }}>Use the "Submit Answer" button to move to the next question manually.</li>
            </ol>
          </CardContent>
        </Card>

        {!testStarted && !testFinished && !isSubmitting && (
          <Button
            onClick={handleAccept}
            disabled={
              isLoading || 
              isAccepting || 
              questions.length === 0 || 
              !wixMember || 
              isWixAuthLoading || 
              testAvailabilityStatus !== 'available' ||
              attemptCheckStatus === 'loading' ||
              attemptCheckStatus === 'exceeded' ||
              attemptCheckStatus === 'error_checking_attempts'
            }
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3"
          >
            {isAccepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isAccepting ? 'Entering Fullscreen...' :
              !wixMember && !isWixAuthLoading ? 'Please Login to Start' :
                (questions.length === 0 && !isLoading ? 'No Test Loaded' :
                  (testAvailabilityStatus !== 'available' ? 'Test Not Currently Available' :
                    (attemptCheckStatus === 'loading' ? 'Checking attempts...' : 
                      (attemptCheckStatus === 'exceeded' ? 'Attempts Limit Reached' : 
                        (attemptCheckStatus === 'error_checking_attempts' ? 'Error Checking Attempts' : 'Accept & Start Test')
                      )
                    )
                  )
                )
            }
          </Button>
        )}
        {isLoading && !testFinished && <p className="text-center">Loading test...</p>}
        {isWixAuthLoading && !testStarted && <p className="text-center text-sm text-muted-foreground">Authenticating with Wix...</p>}
      </div>

      <div ref={rightColumnRef} className="w-full md:w-3/5 p-2 sm:p-4 md:p-6 flex flex-col overflow-y-auto">
        {testStarted && !testFinished && !isSubmitting && currentQuestion ? (
          <div className="flex flex-col space-y-4 fade-in"> 
            <div className="mb-4 glass p-4 rounded-lg">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-3">
                <p className="text-lg font-semibold text-foreground mb-2 sm:mb-0">
                  Question {Math.min(completedQuestions + 1, totalMainQuestions)}
                  {penaltyQuestions.length > 0 ? ` (+${penaltyQuestions.length} penalties)` : ''}
                </p>
                <div className="text-2xl font-mono font-semibold text-accent">
                  {formatTime(_timeLeft)}
                </div>
              </div>
              <div className="space-y-2">
                {questionTypeOrder.map(type => {
                  const questionsOfType = questions.filter(q => q.type === type && !penaltyQuestions.some(pq => pq._id === q._id));
                  const totalOfType = questionsOfType.length;
                  if (totalOfType === 0) return null; 

                  const answeredOfType = answers.filter(ans => {
                    const q = questions.find(q_ => q_._id === ans.questionId);
                    return q?.type === type && !penaltyQuestions.some(pq => pq._id === q._id);
                  }).length;

                  const progressVal = totalOfType > 0 ? (answeredOfType / totalOfType) * 100 : 0;

                  return (
                    <div key={type}>
                      <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                        <span>{type}</span>
                        <span>{answeredOfType}/{totalOfType}</span>
                      </div>
                      <Progress value={progressVal} className="w-full h-2 bg-muted" />
                    </div>
                  );
                })}
              </div>
            </div>

            <Card className="flex flex-col glass"> 
              <CardHeader>
                <CardTitle>Question {completedQuestions + 1}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col space-y-4"> 
                <div
                  className="p-4 border border-border rounded-md bg-white/50 dark:bg-black/20 overflow-auto min-h-[8.75rem] max-h-[17.5rem]" 
                >
                  <p className="text-lg whitespace-pre-wrap break-words">{currentQuestion.query}</p>
                </div>

                {currentQuestion.type === 'MCQ' && Array.isArray(currentQuestion.options) ? (
                  <RadioGroup
                    value={answer}
                    onValueChange={setAnswer}
                    className="space-y-3 p-1"
                  >
                    {(currentQuestion.options as string[]).map((optionText, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 rounded-md border border-input bg-white/80 dark:bg-black/30 hover:bg-accent/10">
                        <RadioGroupItem value={optionText} id={`option-${currentQuestion._id}-${index}`} className="border-primary text-primary" />
                        <Label htmlFor={`option-${currentQuestion._id}-${index}`} className="font-normal text-base text-foreground cursor-pointer flex-1">
                          {optionText}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <Textarea
                    ref={answerTextareaRef}
                    placeholder="Type your answer here..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onFocus={(e) => {
                      if (window.visualViewport && window.innerWidth < 768) { 
                        const targetRect = e.target.getBoundingClientRect();
                        const viewportHeight = window.visualViewport?.height || window.innerHeight;
                        if (targetRect.bottom > viewportHeight - 50) { 
                          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }
                    }}
                    onCopy={(e) => handleAnswerEventPrevent(e, 'Copy')}
                    onCut={(e) => handleAnswerEventPrevent(e, 'Cut')}
                    onPaste={(e) => handleAnswerEventPrevent(e, 'Paste')}
                    onDragStart={(e) => handleAnswerEventPrevent(e, 'Drag')}
                    onDrop={(e) => handleAnswerEventPrevent(e, 'Drop')}
                    onTouchStart={(e: React.TouchEvent<HTMLTextAreaElement>) => {
                      const touchStartTime = Date.now();
                      const targetElement = e.target as HTMLTextAreaElement;
                      const touchendHandler = () => {
                        const touchEndTime = Date.now();
                        if (touchEndTime - touchStartTime > 500) { 
                        }
                        targetElement.removeEventListener('touchend', touchendHandler);
                      };
                      targetElement.addEventListener('touchend', touchendHandler);
                    }}
                    className="min-h-[150px] text-base bg-white/80 dark:bg-black/30"
                    aria-label="Answer input area"
                  />
                )}
              </CardContent>
            </Card>

            <Button
              onClick={handleNextQuestionRef.current}
              className="w-full md:w-auto self-end bg-accent text-accent-foreground hover:bg-accent/90 py-3 px-6 mt-4"
              disabled={currentQuestionIndex >= questions.length && penaltyQuestions.length === 0} 
            >
              {currentQuestionIndex < questions.length - 1 || penaltyQuestions.length > 0 ? 'Submit Answer & Next' : 'Submit Final Answer'}
            </Button>
          </div>
        ) : isSubmitting ? (
          <Card className="m-auto p-8 text-center glass">
            <CardHeader>
              <CardTitle className="text-2xl">Submitting Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-accent" />
              <CardDescription>{submissionStatusMessage || 'Processing your answers...'}</CardDescription>
            </CardContent>
          </Card>
        ) : testFinished ? (
          <Card className="m-auto p-8 text-center glass">
            <CardHeader>
              <CardTitle className="text-2xl">Test Finished</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {submissionStatusMessage || (penaltyTriggeredRef.current
                  ? 'Your answers have been submitted due to a test violation.'
                  : 'Your answers have been submitted successfully.')}
              </CardDescription>
              <p className="mt-4">You may now close this window.</p>
            </CardContent>
          </Card>
        ) : testAvailabilityStatus === 'unavailable_early' ? (
          <Card className="m-auto p-8 text-center glass">
            <CardHeader>
              <CardTitle className="text-2xl">Test Unavailable</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                The test is scheduled to start at {testInfo?.start ? testInfo.start.substring(0, 5) : 'a later time'}. Please check back then.
              </CardDescription>
            </CardContent>
          </Card>
        ) : testAvailabilityStatus === 'unavailable_late' ? (
          <Card className="m-auto p-8 text-center glass">
            <CardHeader>
              <CardTitle className="text-2xl">Test Unavailable</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                The time window for this test (until {testInfo?.stop ? testInfo.stop.substring(0, 5) : 'the cut-off time'}) has passed.
              </CardDescription>
            </CardContent>
          </Card>
        ) : testAvailabilityStatus === 'unavailable_no_info' && !isLoading ? (
          <Card className="m-auto p-8 text-center glass">
            <CardHeader>
              <CardTitle className="text-2xl">Test Information Unavailable</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Could not load test schedule information. Please try again later or check the test ID.
              </CardDescription>
            </CardContent>
          </Card>
        ) : attemptCheckStatus === 'exceeded' ? (
           <Card className="m-auto p-8 text-center glass">
            <CardHeader>
              <CardTitle className="text-2xl">Attempts Limit Reached</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                You have used all available attempts for this test.
              </CardDescription>
            </CardContent>
          </Card>
        ) : attemptCheckStatus === 'error_checking_attempts' ? (
          <Card className="m-auto p-8 text-center glass">
            <CardHeader>
              <CardTitle className="text-2xl">Error Verifying Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Could not verify your previous attempts. Please refresh the page.
              </CardDescription>
            </CardContent>
          </Card>
        ) : ( 
          <Card className="m-auto p-8 text-center glass">
            <CardHeader>
              <CardTitle className="text-2xl">Waiting to Start</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {waitingCardMessage}
              </CardDescription>
              {(isLoading || isWixAuthLoading || testAvailabilityStatus === 'loading' || attemptCheckStatus === 'loading') &&
                <Loader2 className="mt-4 h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              }
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
