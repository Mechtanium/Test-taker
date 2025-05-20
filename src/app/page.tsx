
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
import { Loader2 } from 'lucide-react';
import AnnahAiLogo from '@/components/annah-ai-logo';
import LoginBar from '@/components/LoginBar';
import { myWixClient, removeTokensFromCookie } from '@/lib/wix-client';
import type { Member } from '@/lib/utils'; // Ensure this path and type are correct
import { useAsyncHandler } from '@/hooks/useAsyncHandler';

interface QuestionOption {
  text: string;
}
interface Question {
  _id: string;
  query: string;
  test_id: string;
  type: "MCQ" | "G_OBJ" | "SHORT" | "PARAGRAPH";
  dur_millis: number;
  options?: QuestionOption[] | string[];
}

interface Answer {
  questionId: string;
  questionType: Question['type'];
  answer: string;
  timeTaken: number; // in milliseconds
}

const questionTypeOrder: Question['type'][] = ["MCQ", "G_OBJ", "SHORT", "PARAGRAPH"];
const SUBMISSION_API_PROXY_ENDPOINT = "/api/submit-assessment"; // Updated to use proxy

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
    const typeKey = questionTypeOrder.includes(q.type) ? q.type : 'PARAGRAPH'; // Default unknown types to PARAGRAPH
    if (groupedQuestions[typeKey]) {
      groupedQuestions[typeKey]!.push(q);
    } else {
      // Fallback for very unexpected types, though handled by defaulting typeKey
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


export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1);
  const [_timeLeft, setTimeLeft] = useState<number>(0); // Prefixed with _ to avoid conflict if a setter is also named timeLeft
  const [answer, setAnswer] = useState<string>('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [studentEmail, setStudentEmail] = useState<string>('');
  const [matriculationNumber, setMatriculationNumber] = useState<string>('');
  const [testStarted, setTestStarted] = useState<boolean>(false);
  const [testFinished, setTestFinished] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // For test data loading
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const [penaltyQuestions, setPenaltyQuestions] = useState<Question[]>([]);
  
  const [wixMember, setWixMember] = useState<Member | null | undefined>(undefined);
  const [isWixAuthLoading, setIsWixAuthLoading] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const initialViewportHeightRef = useRef<number>(0);
  const { toast } = useToast();
  const answerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const penaltyTriggeredRef = useRef(false);
  const handleNextQuestionRef = useRef<() => void>(() => { }); // Initialize with a no-op function

  const handleAsync = useAsyncHandler();

  const fetchWixMember = useCallback(async () => {
    setIsWixAuthLoading(true);
    await handleAsync(async () => {
      if (myWixClient.auth.loggedIn()) {
        const currentMember = await myWixClient.members.getCurrentMember();
        console.log("Current Member struct", currentMember);
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
      const originalUriToReturnTo = window.location.href; // Current page
      
      const oauthData = myWixClient.auth.generateOAuthData(redirectUri, originalUriToReturnTo);
      localStorage.setItem('oauthRedirectData', JSON.stringify(oauthData));
      
      const { authUrl } = await myWixClient.auth.getAuthUrl(oauthData); // Pass full oauthData object
      window.location.href = authUrl;
    });
    // setIsWixAuthLoading(false); // Not strictly necessary as page will redirect
  }, [handleAsync]);

  const handleWixLogout = useCallback(async () => {
    setIsWixAuthLoading(true);
    await handleAsync(async () => {
      const { logoutUrl } = await myWixClient.auth.logout(window.location.href);
      removeTokensFromCookie();
      setWixMember(null); // Clear member state
      window.location.href = logoutUrl;
    });
    // setIsWixAuthLoading(false); // Not strictly necessary as page will redirect
  }, [handleAsync]);


  const handleAnswerEventPrevent = (e: React.ClipboardEvent<HTMLTextAreaElement | HTMLDivElement> | React.DragEvent<HTMLTextAreaElement | HTMLDivElement> | React.TouchEvent<HTMLTextAreaElement | HTMLDivElement>, action: string) => {
    let target = e.target as HTMLElement;
    let isAllowedInput = false; // Flag to check if the event target is an allowed input

    // For touch events, determine the actual element under the touch point
    if (e.type.startsWith('touch') && (e as React.TouchEvent).changedTouches.length > 0) {
      const touchTarget = document.elementFromPoint(
        (e as React.TouchEvent).changedTouches[0].clientX,
        (e as React.TouchEvent).changedTouches[0].clientY
      );
      if (touchTarget) target = touchTarget as HTMLElement;
    }
    
    // Traverse up to see if the event originated from an allowed input/textarea or radio group
    let parent = target;
    while (parent && parent !== document.body) {
      if (parent.tagName === 'TEXTAREA' || parent.tagName === 'INPUT' ||
        parent.getAttribute('role') === 'radio' || 
        (parent.tagName === 'LABEL' && parent.closest('[role="radiogroup"]'))) { // Check if label is for a radio
        isAllowedInput = true;
        break;
      }
      parent = parent.parentElement as HTMLElement;
    }

    if (isAllowedInput && (e.type === 'paste' || action.toLowerCase() === 'paste')) {
      e.preventDefault();
      toast({
        title: 'Action Disabled',
        description: `Pasting is disabled.`,
        variant: 'destructive',
        duration: 2000,
      });
      return; // Exit early if paste is on allowed input
    }
    
    // More general paste prevention if not on an allowed input
    if (!isAllowedInput && (e.type === 'paste' || action.toLowerCase() === 'paste')) {
      e.preventDefault();
      toast({
        title: 'Action Disabled',
        description: `Pasting is disabled here.`,
        variant: 'destructive',
        duration: 2000,
      });
      return;
    }

    // Prevent copy, cut, dragstart, drop globally if not handled above
    if (e.type === 'copy' || e.type === 'cut' || e.type === 'dragstart' || e.type === 'drop') {
      e.preventDefault();
      toast({
        title: 'Action Disabled',
        description: `${action}ing is disabled.`,
        variant: 'destructive',
        duration: 2000,
      });
    }
  };

  const submitTestResults = async (submissionStatus: 'completed' | 'penalized', reason?: string) => {
    // Ensure the current answer is captured if not already submitted (e.g., timer ran out)
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
        location: "Geo-location not implemented", // Placeholder as per requirements
        status: submissionStatus,
        type: "testSubmission",
        answers: finalAnswers,
        ...(reason && { penalty_reason: reason }) // Add reason if penalized
    };

    console.log('Submitting test data:', submissionData);

    // API POST submission via proxy
    try {
      await handleAsync(async () => {
        const response = await fetch(SUBMISSION_API_PROXY_ENDPOINT, { // Use the proxy
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(submissionData),
        });
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`API submission failed with status ${response.status}: ${errorData}`);
        }
        toast({ title: 'Submission Successful', description: 'Your test results have been submitted.' });
      });
    } catch (error) {
        console.error('Failed to submit test results via API:', error);
        toast({ title: 'Submission Error', description: `Could not submit results: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: 'destructive' });
    }

    // Parent window postMessage
    if (window.parent !== window) {
        window.parent.postMessage({ ...submissionData, type: 'testResults' }, '*'); // Ensure type differentiation
        console.log(`Posted ${submissionStatus} test submission to parent.`);
    }
  };


  const handlePenalty = useCallback((reason: string) => {
    if (penaltyTriggeredRef.current || !testStarted || testFinished) return;
    penaltyTriggeredRef.current = true;
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
    
    submitTestResults('penalized', reason);

    setTestFinished(true);
    setCurrentQuestionIndex(-1); 
    setQuestions([]); 
    setPenaltyQuestions([]); 

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error("Error exiting fullscreen:", err));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer, answers, currentQuestionIndex, questions, testStarted, testFinished, studentEmail, matriculationNumber, wixMember, handleAsync]); // `submitTestResults` is now implicitly included via handleAsync


  const processReceivedQuestions = useCallback((receivedQuestions: Question[]) => {
    const processed = sortAndGroupQuestions(receivedQuestions);
    setQuestions(processed);
    setIsLoading(false);
    console.log('Processed and sorted questions:', processed);
  }, []);


  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Allow messages from current origin (for development) or the specific Wix origin
      if (event.origin !== window.origin && event.origin !== 'https://sapiensng.wixstudio.com' && window.origin !== 'null') {
        // console.warn('Message received from unexpected origin:', event.origin);
        // return; // Commented out to allow any origin if origin is null (e.g. file:// or sandboxed iframes)
      }

      if (event.data?.type === 'questionsLoaded' && Array.isArray(event.data.questions)) {
         // Transform options for MCQs if they are objects with a 'text' property
         const transformedQuestionsFromMessage = event.data.questions.map((q: any) => {
            let newOptions: string[] | undefined = undefined;
            if (q.type === "MCQ" && Array.isArray(q.options)) {
              if (q.options.length > 0 && typeof q.options[0] === 'object' && q.options[0] !== null && 'text' in q.options[0]) {
                newOptions = q.options.map((opt: any) => opt.text as string);
              } else if (q.options.length > 0 && typeof q.options[0] === 'string') {
                // Already in string[] format
                newOptions = q.options as string[];
              } else {
                newOptions = []; // Default to empty array if options format is unexpected
              }
            }
            return { ...q, options: newOptions };
          });

        if (transformedQuestionsFromMessage.length > 0 && transformedQuestionsFromMessage[0]?.query) { // Check if first question has query
          processReceivedQuestions(transformedQuestionsFromMessage as Question[]);
        } else if (transformedQuestionsFromMessage.length === 0) {
          setQuestions([]);
          setIsLoading(false); // Stop loading if empty questions received
          console.log('Received empty questions list from parent.');
          toast({
            title: 'No Questions',
            description: 'The test has no questions loaded from the parent.',
            variant: 'destructive'
          });
        }
      } else if (event.data === 'TestLockReady') {
        console.log('Parent window acknowledged TestLockReady.');
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('Message listener added.');

    // Fetching logic for standalone mode (not in iframe)
    if (window.parent === window) { 
      console.log('Not in iframe, attempting to fetch questions from URL.');
      setIsLoading(true);
      const queryParams = new URLSearchParams(window.location.search);
      const testId = queryParams.get('q'); // Ensure 'q' is the correct param name

      if (testId) {
        const apiUrl = `/api/test-proxy?test=${testId}`; // Use the proxy
        console.log(`Fetching data from: ${apiUrl}`);
        fetch(apiUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            console.log('Fetched data via proxy:', data);
            if (data && data.questions && Array.isArray(data.questions)) {
              // Transform options for MCQs if they are objects with a 'text' property
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

              if (transformedQuestions.length > 0 && transformedQuestions[0]?.query) { // Check if first question has query
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
              setQuestions([]); // Clear questions if data format is invalid
              console.error('Invalid data format or no questions array from proxy:', data);
              toast({ title: 'Invalid Data', description: 'Failed to parse questions from the server response via proxy.', variant: 'destructive'});
              setIsLoading(false);
            }
          })
          .catch(error => {
            console.error('Failed to fetch test data via proxy:', error);
            toast({ title: 'Fetch Error', description: `Could not load test: ${error.message}`, variant: 'destructive'});
            setQuestions([]);
            setIsLoading(false);
          });
      } else {
        console.log('No test ID (q parameter) found in URL.');
        toast({
          title: 'Missing Test ID',
          description: 'Please provide a test ID in the URL (e.g., ?q=your_test_id).',
          variant: 'destructive'
        });
        setQuestions([]);
        setIsLoading(false);
      }
    } else { // Running in iframe
        window.parent.postMessage('TestLockReady', '*'); // Notify parent it's ready
        console.log('Posted TestLockReady message.');
    }


    return () => {
      window.removeEventListener('message', handleMessage);
      console.log('Message listener removed.');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processReceivedQuestions, toast]); // Removed `handleMessage` from deps, it's stable if `processReceivedQuestions` is stable

  useEffect(() => {
    if (!testStarted || testFinished) return;
    
    const currentQForEffect = questions[currentQuestionIndex]; // Define here for effect scope
  
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
      const isUnexpectedSize = Math.abs(currentHeight - screenHeight) > 200 || Math.abs(currentWidth - screenWidth) > 150; // Adjust thresholds as needed
  
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      const previousOrientation = initialViewportHeightRef.current > 0 ? (initialViewportHeightRef.current < window.innerWidth) : isLandscape; // Heuristic for previous orientation
      const orientationChanged = isLandscape !== previousOrientation;
      const likelyKeyboard = initialViewportHeightRef.current > 0 && currentHeight < initialViewportHeightRef.current;
  
      // Apply penalty only if resize is significant, not due to orientation change or keyboard
      if (initialViewportHeightRef.current > 0 && !orientationChanged && !likelyKeyboard && isUnexpectedSize) {
        console.log('Significant window resize detected.');
        handlePenalty('Window resized');
      } else {
        // Update ref for next resize event if orientation changed
        if (orientationChanged) {
          console.log('Orientation change detected, ignoring resize penalty.');
          initialViewportHeightRef.current = currentHeight; // Update baseline height
        }
        // If keyboard likely appeared, try to scroll active input into view
        if (likelyKeyboard) {
          console.log('Possible virtual keyboard detected, ignoring resize penalty.');
          if (currentQForEffect?.type !== 'MCQ' && answerTextareaRef.current) { // Use currentQForEffect
            answerTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else if (currentQForEffect?.type === 'MCQ' && rightColumnRef.current) { // Use currentQForEffect
             rightColumnRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // Safari
    document.addEventListener('mozfullscreenchange', handleFullscreenChange); // Firefox
    document.addEventListener('MSFullscreenChange', handleFullscreenChange); // IE/Edge
    console.log('Security listeners (visibility, resize, fullscreen) added.');
  
    if(testStarted) { // Set initial height only once when test starts and is in fullscreen
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
  }, [testStarted, testFinished, handlePenalty, questions, currentQuestionIndex]); // Added questions and currentQuestionIndex


  const internalHandleNextQuestion = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
      const timeTaken = Date.now() - startTimeRef.current;
      const currentQuestionId = questions[currentQuestionIndex]._id;
      const currentQuestionType = questions[currentQuestionIndex].type; // Get type here

      setAnswers((prevAnswers) => {
        const existingAnswerIndex = prevAnswers.findIndex(a => a.questionId === currentQuestionId);
        if (existingAnswerIndex === -1) {
          // Ensure questionType is always included
          const newAnswer: Answer = { questionId: currentQuestionId, questionType: currentQuestionType, answer, timeTaken };
          return [...prevAnswers, newAnswer];
        } else {
          // Update existing answer, ensuring questionType is correct
          const updatedAnswers = [...prevAnswers];
          updatedAnswers[existingAnswerIndex] = { questionId: currentQuestionId, questionType: currentQuestionType, answer, timeTaken };
          return updatedAnswers;
        }
      });
    }

    setAnswer(''); // Clear answer field for next question

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
    } else {
      // Check for penalty questions
      if (penaltyQuestions.length > 0) {
        const nextPenalty = penaltyQuestions[0];
        setQuestions(prev => [...prev, nextPenalty]); // Add penalty question to the main list
        setPenaltyQuestions(prev => prev.slice(1)); // Remove from penalty queue
        setCurrentQuestionIndex(nextIndex); // Move to the newly added penalty question
      } else {
        // No more questions or penalties
        setTestFinished(true);
        setCurrentQuestionIndex(-1); // Indicate no active question
        submitTestResults('completed'); // Submit results

        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => console.error("Error exiting fullscreen:", err));
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, questions, answer, penaltyQuestions, studentEmail, matriculationNumber, wixMember, answers, handleAsync]); // `submitTestResults` is now part of the dependency chain via handleAsync


  useEffect(() => {
    handleNextQuestionRef.current = internalHandleNextQuestion;
  }, [internalHandleNextQuestion]);

  useEffect(() => {
    if (testStarted && currentQuestionIndex !== -1 && !testFinished && questions.length > 0 && currentQuestionIndex < questions.length) {
      if (timerRef.current) { // Clear existing timer if any
        clearInterval(timerRef.current);
      }

      startTimeRef.current = Date.now(); // Reset start time for the new question
      const currentQ = questions[currentQuestionIndex];
      const duration = currentQ?.dur_millis; // Use optional chaining

      if (typeof duration === 'number' && duration > 0) {
        setTimeLeft(duration); // Set initial time for the question

        timerRef.current = setInterval(() => {
          const elapsed = Date.now() - startTimeRef.current;
          const newRemainingTime = duration - elapsed;

          if (newRemainingTime <= 0) {
            if (timerRef.current) { // Check again before clearing and calling next
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            handleNextQuestionRef.current(); // Use the ref to call the latest version
          } else {
            setTimeLeft(newRemainingTime); // Update displayed time
          }
        }, 100); // Update timer every 100ms for smoother display
      } else {
        // Handle questions with no duration (e.g., display indefinitely or use a default)
        setTimeLeft(-1); // Indicate infinite time or an issue
        console.warn(`Question ${currentQuestionIndex} has invalid or zero duration: ${duration}`);
      }

      // Auto-focus textarea for non-MCQ questions
      if (currentQ.type !== 'MCQ') {
        answerTextareaRef.current?.focus();
      }

    } else if (timerRef.current) { // If test is not active, clear any existing timer
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [testStarted, currentQuestionIndex, testFinished, questions]); // Removed answer from dependencies to prevent timer reset on typing


  const handleAccept = async () => {
    if (!studentEmail || !matriculationNumber) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both student email and matriculation number.',
        variant: 'destructive',
      });
      return;
    }
    if (!wixMember) { // Check if Wix member is logged in
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
      } else if ((document.documentElement as any).mozRequestFullScreen) { // Firefox
        await (document.documentElement as any).mozRequestFullScreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) { // Chrome, Safari, Opera
        await (document.documentElement as any).webkitRequestFullscreen();
      } else if ((document.documentElement as any).msRequestFullscreen) { // IE/Edge
        await (document.documentElement as any).msRequestFullscreen();
      }
      // Delay setting testStarted to allow fullscreen transition and setup security listeners properly
      setTimeout(() => {
        setTestStarted(true);
        setCurrentQuestionIndex(0); // Start with the first question
        setIsAccepting(false);
        console.log('Test started after fullscreen.');
        initialViewportHeightRef.current = window.innerHeight; // Set baseline height for resize checks
      }, 500); // 0.5 second delay

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
  const totalMainQuestions = questions.filter(q => !penaltyQuestions.some(pq => pq._id === q._id)).length; // Exclude penalty questions from main count
  const completedQuestions = currentQuestionIndex >= 0 ? currentQuestionIndex : 0; // currentQuestionIndex can be -1

  const formatTime = (ms: number): string => {
    if (ms < 0) return "∞"; // For questions with no time limit or error
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const [keyboardOffset, setKeyboardOffset] = useState(0);
  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    const handleVisualViewportResize = () => {
        // Calculate the difference between window height and visual viewport height
        const newOffset = Math.max(0, window.innerHeight - visualViewport.height);
        // Only apply significant offset if keyboard is likely up (e.g. > 150px)
        // Add more padding (e.g., 200px more) to ensure textarea is well above keyboard
        setKeyboardOffset(newOffset > 150 ? newOffset + 200 : 0);

        // Attempt to scroll the active element into view if it's the textarea or in the right column
        if (newOffset > 150 && (document.activeElement === answerTextareaRef.current || rightColumnRef.current?.contains(document.activeElement))) {
          setTimeout(() => { // Delay to allow layout to adjust
            document.activeElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100); 
        }
    };
    visualViewport.addEventListener('resize', handleVisualViewportResize);
    handleVisualViewportResize(); // Initial check

    return () => visualViewport.removeEventListener('resize', handleVisualViewportResize);
  }, []);


  return (
    <div
      ref={containerRef}
      className="flex flex-col md:flex-row h-full w-full bg-background text-foreground pointillism transition-all duration-300 ease-in-out"
      style={{ paddingBottom: `${keyboardOffset}px`}} // Apply dynamic padding at the bottom
      onCopy={(e) => handleAnswerEventPrevent(e, 'Copy')}
      onCut={(e) => handleAnswerEventPrevent(e, 'Cut')}
      onPaste={(e) => handleAnswerEventPrevent(e, 'Paste')}
      onDragStart={(e) => handleAnswerEventPrevent(e, 'Drag')}
      onDrop={(e) => handleAnswerEventPrevent(e, 'Drop')}
    >
      <div className="w-full md:w-2/5 p-6 md:p-8 border-r border-border flex flex-col space-y-6 glass overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
            <div>
                <AnnahAiLogo className="w-[180px] h-auto" /> {/* Adjusted size slightly */}
                <p className="text-xs italic text-muted-foreground mt-1">Powered by...</p>
            </div>
            <LoginBar 
                member={wixMember} 
                onLogin={handleWixLogin} 
                onLogout={handleWixLogout}
                isLoading={isWixAuthLoading}
            />
        </div>


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
                disabled={testStarted || isAccepting || testFinished}
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
                disabled={testStarted || isAccepting || testFinished}
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

        {!testStarted && !isLoading && !testFinished && (
          <Button
            onClick={handleAccept}
            disabled={isLoading || isAccepting || questions.length === 0 || !wixMember || isWixAuthLoading} 
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3"
          >
            {isAccepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isAccepting ? 'Entering Fullscreen...' : 
             !wixMember && !isWixAuthLoading ? 'Please Login to Start' :
             (questions.length === 0 && !isLoading ? 'No Test Loaded' : 'Accept & Start Test')}
          </Button>
        )}
        {isLoading && !testFinished && <p className="text-center">Loading test...</p>}
        {isWixAuthLoading && !testStarted && <p className="text-center text-sm text-muted-foreground">Authenticating with Wix...</p>}
      </div>

      <div ref={rightColumnRef} className="w-full md:w-3/5 p-6 md:p-8 flex flex-col h-full overflow-y-auto">
        {testStarted && !testFinished && currentQuestion ? (
          <div className="flex flex-col h-full fade-in space-y-4">
            {/* Progress Section */}
            <div className="mb-4 glass p-4 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <p className="text-lg font-semibold text-foreground">
                  Question {Math.min(completedQuestions + 1, totalMainQuestions)} of {totalMainQuestions}
                  {penaltyQuestions.length > 0 ? ` (+${penaltyQuestions.length} penalties)` : ''}
                </p>
                <div className="text-2xl font-mono font-semibold text-accent">
                  {formatTime(_timeLeft)}
                </div>
              </div>
              <div className="space-y-2">
                {questionTypeOrder.map(type => {
                  // Filter out penalty questions from this specific type count for main progress
                  const questionsOfType = questions.filter(q => q.type === type && !penaltyQuestions.some(pq => pq._id === q._id));
                  const totalOfType = questionsOfType.length;
                  if (totalOfType === 0) return null; // Don't render progress for types not present

                  // Count answered questions of this type, excluding penalty questions
                  const answeredOfType = answers.filter(ans => {
                    const q = questions.find(q_ => q_._id === ans.questionId); // Changed q to q_ to avoid conflict
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

            {/* Question Display Card */}
            <Card className="flex-grow flex flex-col glass min-h-0"> {/* Ensure card can shrink and grow */}
              <CardHeader>
                <CardTitle>Question {completedQuestions + 1}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col space-y-4 min-h-0"> {/* Allow content to take space and scroll if needed */}
                <div
                  className="p-4 border border-border rounded-md bg-white/50 dark:bg-black/20 flex-grow overflow-auto" // Allow this part to scroll if query is long
                >
                  <p className="text-lg whitespace-pre-wrap break-words">{currentQuestion.query}</p>
                </div>

                {/* Answer Input: MCQ or Textarea */}
                {currentQuestion.type === 'MCQ' && Array.isArray(currentQuestion.options) ? (
                  <RadioGroup
                    value={answer}
                    onValueChange={setAnswer}
                    className="space-y-3 p-1" // Added padding for better spacing
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
                        // Improved scroll into view logic for mobile
                        if (window.visualViewport && window.innerWidth < 768) { // Check for mobile-like screen width
                             const targetRect = e.target.getBoundingClientRect();
                             const viewportHeight = window.visualViewport?.height || window.innerHeight;
                             // If the bottom of the textarea is close to or below the visible viewport bottom
                             if (targetRect.bottom > viewportHeight - 50) { // 50px buffer
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
                      // Logic to detect long press for paste context menu on mobile
                      const touchStartTime = Date.now();
                      const targetElement = e.target as HTMLTextAreaElement; // Cast target
                      const touchendHandler = () => {
                        const touchEndTime = Date.now();
                        if (touchEndTime - touchStartTime > 500) { // 500ms for long press
                          // If a long press is detected, the system context menu might appear.
                          // The onPaste handler will be triggered by the browser's context menu paste action.
                          // No explicit toast here to avoid double toasting if onPaste also triggers.
                        }
                        targetElement.removeEventListener('touchend', touchendHandler); // Clean up
                      };
                      targetElement.addEventListener('touchend', touchendHandler);
                    }}
                    className="min-h-[150px] text-base bg-white/80 dark:bg-black/30 flex-shrink-0" // flex-shrink-0 prevents it from shrinking too much
                    aria-label="Answer input area"
                  />
                )}
              </CardContent>
            </Card>

            <Button
              onClick={handleNextQuestionRef.current}
              className="w-full md:w-auto self-end bg-accent text-accent-foreground hover:bg-accent/90 py-3 px-6 mt-4"
              disabled={currentQuestionIndex >= questions.length && penaltyQuestions.length === 0} // Disable if no more questions or penalties
            >
              {currentQuestionIndex < questions.length - 1 || penaltyQuestions.length > 0 ? 'Submit Answer & Next' : 'Submit Final Answer'}
            </Button>
          </div>
        ) : testFinished ? (
          <Card className="m-auto p-8 text-center glass">
            <CardHeader>
              <CardTitle className="text-2xl">Test Finished</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {penaltyTriggeredRef.current
                  ? 'Your answers have been submitted due to a test violation.'
                  : 'Your answers have been submitted successfully.'}
              </CardDescription>
              <p className="mt-4">You may now close this window.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="m-auto p-8 text-center glass">
            <CardHeader>
              <CardTitle className="text-2xl">Waiting to Start</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {isLoading
                  ? 'Loading test questions...'
                  : (wixMember === undefined ? 'Checking login status...' :
                    !wixMember ? 'Please log in using the button above to proceed.' :
                    (questions.length === 0 ? 'No test questions are currently loaded. Please wait or contact support if this persists.' : 'Please read the instructions and click "Accept & Start Test" when ready.'))}
              </CardDescription>
              {(isLoading || (wixMember === undefined && !isWixAuthLoading)) && <Loader2 className="mt-4 h-8 w-8 animate-spin mx-auto text-muted-foreground" />}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
