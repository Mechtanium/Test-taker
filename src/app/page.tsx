
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
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

interface Question {
  _id: string;
  query: string;
  test_id: string;
  type: "MCQ" | "G_OBJ" | "SHORT" | "PARAGRAPH";
  dur_millis: number;
  options?: string[]; // For MCQ questions, will store text of options
}

interface Answer {
  questionId: string;
  answer: string;
  timeTaken: number; // in milliseconds
}

const questionTypeOrder: Question['type'][] = ["MCQ", "G_OBJ", "SHORT", "PARAGRAPH"];

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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const initialViewportHeightRef = useRef<number>(0);
  const { toast } = useToast();
  const answerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const penaltyTriggeredRef = useRef(false);
  const handleNextQuestionRef = useRef<() => void>(() => { });


  const handleAnswerEventPrevent = (e: React.ClipboardEvent<HTMLTextAreaElement | HTMLDivElement> | React.DragEvent<HTMLTextAreaElement | HTMLDivElement> | React.TouchEvent<HTMLTextAreaElement | HTMLDivElement>, action: string) => {
    let target = e.target as HTMLElement;
    let isAllowedInput = false; // Flag to check if the event target is an allowed input field

    // For touch events, try to get the actual element under the touch point
    if (e.type.startsWith('touch') && (e as React.TouchEvent).changedTouches.length > 0) {
      const touchTarget = document.elementFromPoint(
        (e as React.TouchEvent).changedTouches[0].clientX,
        (e as React.TouchEvent).changedTouches[0].clientY
      );
      if (touchTarget) target = touchTarget as HTMLElement;
    }
    
    // Traverse up to see if the target is inside a TEXTAREA, INPUT, or a radio button label/item
    let parent = target;
    while (parent && parent !== document.body) {
      if (parent.tagName === 'TEXTAREA' || parent.tagName === 'INPUT' ||
        parent.getAttribute('role') === 'radio' || // for RadioGroupItem
        (parent.tagName === 'LABEL' && parent.closest('[role="radiogroup"]'))) { // for Label of RadioGroupItem
        isAllowedInput = true;
        break;
      }
      parent = parent.parentElement as HTMLElement;
    }

    // If it's an allowed input and the action is paste, prevent and toast
    if (isAllowedInput && (e.type === 'paste' || action.toLowerCase() === 'paste')) {
      e.preventDefault();
      toast({
        title: 'Action Disabled',
        description: `Pasting is disabled.`,
        variant: 'destructive',
        duration: 2000,
      });
      return; // Stop further processing for this specific case
    }

    // If it's not an allowed input, prevent copy, cut, paste, drag, drop for the main content area
    if (!isAllowedInput && (e.type === 'paste' || action.toLowerCase() === 'paste')) {
      // This case handles pasting outside allowed inputs, if the onPaste is on the global div
      e.preventDefault();
      toast({
        title: 'Action Disabled',
        description: `Pasting is disabled here.`,
        variant: 'destructive',
        duration: 2000,
      });
      return;
    }

    // Prevent general copy/cut/drag/drop for non-input areas or if specifically on main content area
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


  const handlePenalty = useCallback((reason: string) => {
    if (penaltyTriggeredRef.current || !testStarted || testFinished) return;
    penaltyTriggeredRef.current = true;
    toast({
      title: 'Test Violation Detected',
      description: `${reason}. Your current answers will be submitted, and the test will end.`,
      variant: 'destructive',
      duration: 10000, // Longer duration for important penalty message
    });

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Ensure latest answer is captured if penalty occurs mid-question
    setAnswers(prevAnswers => {
      let finalAnswers = [...prevAnswers];
      if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
        const currentQuestionId = questions[currentQuestionIndex]._id;
        const timeTaken = Date.now() - startTimeRef.current;
        // Add or update the current question's answer
        if (!finalAnswers.some(a => a.questionId === currentQuestionId)) {
          finalAnswers.push({ questionId: currentQuestionId, answer, timeTaken });
        }
      }
      console.log('Submitting penalized answers:', { studentEmail, matriculationNumber, answers: finalAnswers });
      // Post message to parent for penalized submission
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'testSubmission',
          status: 'penalized',
          reason: reason,
          studentEmail,
          matriculationNumber,
          answers: finalAnswers // Send the captured answers
        }, '*'); // Use specific origin in production
        console.log('Posted penalized test submission to parent.');
      }
      return finalAnswers;
    });

    setTestFinished(true);
    setCurrentQuestionIndex(-1); // No active question
    setQuestions([]); // Clear questions
    setPenaltyQuestions([]); // Clear penalty questions

    // Attempt to exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error("Error exiting fullscreen:", err));
    }
  }, [currentQuestionIndex, questions, answer, toast, testStarted, testFinished, studentEmail, matriculationNumber]);


  const processReceivedQuestions = useCallback((receivedQuestions: Question[]) => {
    const processed = sortAndGroupQuestions(receivedQuestions);
    setQuestions(processed);
    setIsLoading(false);
    console.log('Processed and sorted questions:', processed);
  }, []);


  // Effect for message listener and initial data fetch
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Allow messages from the same origin or specific trusted origins for iframe communication
      // For local development with file://, event.origin can be 'null'
      if (event.origin !== window.origin && event.origin !== 'https://sapiensng.wixstudio.com' && window.origin !== 'null') {
        // console.warn('Message received from unexpected origin:', event.origin);
        // return; // Consider if strict origin check is needed or if 'null' should be allowed for local testing
      }

      if (event.data?.type === 'questionsLoaded' && Array.isArray(event.data.questions)) {
         // Transform options if they are objects with a 'text' property
         const transformedQuestionsFromMessage = event.data.questions.map((q: any) => {
            let newOptions = q.options;
            if (q.type === "MCQ" && Array.isArray(q.options) && q.options.length > 0 && typeof q.options[0] === 'object' && q.options[0] !== null && 'text' in q.options[0]) {
              newOptions = q.options.map((opt: any) => opt.text);
            }
            return { ...q, options: newOptions };
          });

        if (transformedQuestionsFromMessage.length > 0 && transformedQuestionsFromMessage[0]?.query) {
          processReceivedQuestions(transformedQuestionsFromMessage as Question[]);
        } else if (transformedQuestionsFromMessage.length === 0) {
          setQuestions([]);
          setIsLoading(false); // Ensure loading is stopped
          console.log('Received empty questions list from parent.');
          toast({
            title: 'No Questions',
            description: 'The test has no questions loaded from the parent.',
            variant: 'destructive'
          });
        }
      } else if (event.data === 'TestLockReady') {
        // Parent acknowledged TestLock is ready, no further action needed here for now
        console.log('Parent window acknowledged TestLockReady.');
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('Message listener added.');

    // If not in an iframe, try to fetch data from URL
    if (window.parent === window) { // Not in an iframe
      console.log('Not in iframe, attempting to fetch questions from URL.');
      setIsLoading(true);
      const queryParams = new URLSearchParams(window.location.search);
      const testId = queryParams.get('q'); // Get test ID from 'q' parameter

      if (testId) {
        const apiUrl = `https://sapiensng.wixsite.com/annah-ai/_functions-dev/test?test=${testId}`;
        console.log(`Fetching data from: ${apiUrl}`);
        fetch(apiUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            console.log('Fetched data:', data);
            if (data && data.questions && Array.isArray(data.questions)) {
              // Transform options if they are objects with a 'text' property
              const transformedQuestions = data.questions.map((q: any) => {
                let newOptions = q.options;
                if (q.type === "MCQ" && Array.isArray(q.options) && q.options.length > 0 && typeof q.options[0] === 'object' && q.options[0] !== null && 'text' in q.options[0]) {
                  newOptions = q.options.map((opt: any) => opt.text);
                } else if (q.type === "MCQ" && (!Array.isArray(newOptions) || (newOptions.length > 0 && typeof newOptions[0] !== 'string'))) {
                  // If MCQ but options are not string[] or transformable object array, set to empty or warn
                  console.warn(`MCQ question ${q._id} has malformed options. Defaulting to empty.`, q.options);
                  newOptions = [];
                }
                return { ...q, options: newOptions };
              });

              if (transformedQuestions.length > 0 && transformedQuestions[0]?.query) {
                 processReceivedQuestions(transformedQuestions as Question[]);
              } else if (transformedQuestions.length === 0) {
                 setQuestions([]);
                 // processReceivedQuestions will set isLoading to false
                 console.log('Fetched empty questions list.');
                 toast({
                    title: 'No Questions',
                    description: 'The test has no questions loaded from the source.',
                    variant: 'destructive'
                 });
                 setIsLoading(false); // Ensure loading is set to false if no questions
              }
            } else {
              setQuestions([]);
              console.error('Invalid data format or no questions array:', data);
              toast({ title: 'Invalid Data', description: 'Failed to parse questions from the server response.', variant: 'destructive'});
              setIsLoading(false);
            }
          })
          .catch(error => {
            console.error('Failed to fetch test data:', error);
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
    } else { // Running in an iframe
        window.parent.postMessage('TestLockReady', '*'); // Post message to parent indicating readiness
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
  }, [processReceivedQuestions, toast]); // processReceivedQuestions and toast are stable dependencies

  // Security Listeners Setup Effect (Conditional)
  useEffect(() => {
    if (!testStarted || testFinished) return;

    const currentQ = questions[currentQuestionIndex]; // Derive currentQuestion inside the effect

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
      // Increased threshold for resize detection, especially for height
      const isUnexpectedSize = Math.abs(currentHeight - screenHeight) > 200 || Math.abs(currentWidth - screenWidth) > 150;

      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      const previousOrientation = initialViewportHeightRef.current > 0 ? (initialViewportHeightRef.current < window.innerWidth) : isLandscape; // Compare height with width for orientation
      const orientationChanged = isLandscape !== previousOrientation;
      const likelyKeyboard = initialViewportHeightRef.current > 0 && currentHeight < initialViewportHeightRef.current;

      if (initialViewportHeightRef.current > 0 && !orientationChanged && !likelyKeyboard && isUnexpectedSize) {
        console.log('Significant window resize detected.');
        handlePenalty('Window resized');
      } else {
        // Handle orientation change or keyboard popup without penalty
        if (orientationChanged) {
          console.log('Orientation change detected, ignoring resize penalty.');
          initialViewportHeightRef.current = currentHeight; // Update ref on orientation change
        }
        if (likelyKeyboard) {
          console.log('Possible virtual keyboard detected, ignoring resize penalty.');
          // Scroll textarea into view if it's the current focus, or if an MCQ is active, scroll its container
          if (currentQ?.type !== 'MCQ' && answerTextareaRef.current) {
            answerTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else if (currentQ?.type === 'MCQ' && rightColumnRef.current) {
             // Attempt to scroll the right column (question area) to keep MCQ options visible
             // This might need adjustment based on exact layout
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
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    console.log('Security listeners (visibility, resize, fullscreen) added.');

    // Set initial viewport height only after test starts and listeners are active
    initialViewportHeightRef.current = window.innerHeight;

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      console.log('Security listeners (visibility, resize, fullscreen) removed.');
    };
  }, [testStarted, testFinished, handlePenalty, questions, currentQuestionIndex]); // Depend on questions and currentQuestionIndex


  // Moved internalHandleNextQuestion definition
  const internalHandleNextQuestion = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Save current answer before moving
    if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
      const timeTaken = Date.now() - startTimeRef.current;
      const currentQuestionId = questions[currentQuestionIndex]._id;
      setAnswers((prevAnswers) => {
        // Check if an answer for this question already exists
        const existingAnswerIndex = prevAnswers.findIndex(a => a.questionId === currentQuestionId);
        if (existingAnswerIndex === -1) {
          // If not, add new answer
          return [...prevAnswers, { questionId: currentQuestionId, answer, timeTaken }];
        } else {
          // If exists (e.g. user re-submits or penalty path saved it), update it
          // This part might need refinement based on desired behavior for re-submission
          const updatedAnswers = [...prevAnswers];
          updatedAnswers[existingAnswerIndex] = { questionId: currentQuestionId, answer, timeTaken };
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

        // Final answers submission logic (using callback to ensure latest state)
        setAnswers(currentAnswers => {
          console.log('Test finished normally. Final answers:', { studentEmail, matriculationNumber, answers: currentAnswers });
          // Post message to parent for completed submission
          if (window.parent !== window) {
            window.parent.postMessage({
              type: 'testSubmission',
              status: 'completed',
              studentEmail,
              matriculationNumber,
              answers: currentAnswers
            }, '*'); // Use specific origin in production
            console.log('Posted completed test submission to parent.');
          }
          return currentAnswers; // Return the final answers state
        });

        // Attempt to exit fullscreen gracefully
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => console.error("Error exiting fullscreen:", err));
        }
      }
    }
  }, [currentQuestionIndex, questions, answer, penaltyQuestions, studentEmail, matriculationNumber]);


  // Effect to update the ref for handleNextQuestion
  useEffect(() => {
    handleNextQuestionRef.current = internalHandleNextQuestion;
  }, [internalHandleNextQuestion]);

  // Timer Effect
  useEffect(() => {
    if (testStarted && currentQuestionIndex !== -1 && !testFinished && questions.length > 0 && currentQuestionIndex < questions.length) {
      if (timerRef.current) { // Clear any existing timer before starting a new one
        clearInterval(timerRef.current);
      }

      startTimeRef.current = Date.now(); // Record start time for the current question
      const currentQ = questions[currentQuestionIndex];
      const duration = currentQ?.dur_millis; // Get duration from the current question

      if (typeof duration === 'number' && duration > 0) {
        setTimeLeft(duration); // Set initial time left for the question

        timerRef.current = setInterval(() => {
          const elapsed = Date.now() - startTimeRef.current;
          const newRemainingTime = duration - elapsed;

          if (newRemainingTime <= 0) {
            if (timerRef.current) { // Ensure timer exists before clearing
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            handleNextQuestionRef.current(); // Auto-advance when time is up
          } else {
            setTimeLeft(newRemainingTime); // Update remaining time
          }
        }, 100); // Timer updates every 100ms
      } else {
        // Handle questions with no duration (e.g., display indefinitely or error)
        setTimeLeft(-1); // Indicate indefinite time or an issue
        console.warn(`Question ${currentQuestionIndex} has invalid or zero duration: ${duration}`);
      }

      // Auto-focus textarea for non-MCQ questions
      if (currentQ.type !== 'MCQ') {
        answerTextareaRef.current?.focus();
      }

    } else if (timerRef.current) { // If test not started, finished, or no question, clear timer
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Cleanup function for the timer effect
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [testStarted, currentQuestionIndex, testFinished, questions]); // Dependencies for the timer effect


  const handleAccept = async () => {
    if (!studentEmail || !matriculationNumber) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both student email and matriculation number.',
        variant: 'destructive',
      });
      return;
    }
    setIsAccepting(true);
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      } else if ((document.documentElement as any).mozRequestFullScreen) { /* Firefox */
        await (document.documentElement as any).mozRequestFullScreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        await (document.documentElement as any).webkitRequestFullscreen();
      } else if ((document.documentElement as any).msRequestFullscreen) { /* IE/Edge */
        await (document.documentElement as any).msRequestFullscreen();
      }
      // Delay starting the test slightly to ensure fullscreen transition completes
      setTimeout(() => {
        setTestStarted(true);
        setCurrentQuestionIndex(0); // Start with the first question
        setIsAccepting(false);
        console.log('Test started after fullscreen.');
        initialViewportHeightRef.current = window.innerHeight; // Capture initial height after fullscreen
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


  // Derived state for current question
  const currentQuestion = questions[currentQuestionIndex];
  const totalMainQuestions = questions.filter(q => !penaltyQuestions.some(pq => pq._id === q._id)).length;
  const completedQuestions = currentQuestionIndex >= 0 ? currentQuestionIndex : 0; // Number of questions attempted or passed

  const formatTime = (ms: number): string => {
    if (ms < 0) return "∞"; // For questions with no time limit
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Dynamic padding adjustment for keyboard
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    const handleVisualViewportResize = () => {
        // Calculate the difference between window height and visual viewport height
        const newOffset = Math.max(0, window.innerHeight - visualViewport.height);
        // Apply extra padding only if the keyboard is significantly out (e.g., > 150px)
        // and add a buffer (e.g., 200px) to ensure content is well above the keyboard
        setKeyboardOffset(newOffset > 150 ? newOffset + 200 : 0);

         // If keyboard is significantly out and an input field is active, try to scroll it into view
        if (newOffset > 150 && (document.activeElement === answerTextareaRef.current || rightColumnRef.current?.contains(document.activeElement))) {
          setTimeout(() => { // Delay ensures layout has updated based on padding
            document.activeElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100); // Small delay
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
      style={{ paddingBottom: `${keyboardOffset}px`}} // Apply dynamic padding here
      // Add global event handlers for copy/paste/drag on the main container
      onCopy={(e) => handleAnswerEventPrevent(e, 'Copy')}
      onCut={(e) => handleAnswerEventPrevent(e, 'Cut')}
      onPaste={(e) => handleAnswerEventPrevent(e, 'Paste')}
      onDragStart={(e) => handleAnswerEventPrevent(e, 'Drag')}
      onDrop={(e) => handleAnswerEventPrevent(e, 'Drop')}
    >
      {/* Left Column: Student Info & Instructions */}
      <div className="w-full md:w-2/5 p-6 md:p-8 border-r border-border flex flex-col space-y-6 glass overflow-y-auto">
        <div className="mb-4">
          <AnnahAiLogo className="w-[200px] h-auto" />
          <p className="text-xs italic text-muted-foreground mt-1">Powered by...</p>
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
              <li style={{ marginBottom: '0.5rem' }}>Ensure you have entered your correct email and matriculation number.</li>
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
            disabled={isLoading || isAccepting || questions.length === 0} // Disable if no questions
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3"
          >
            {isAccepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isAccepting ? 'Entering Fullscreen...' : (questions.length === 0 && !isLoading ? 'No Test Loaded' : 'Accept & Start Test')}
          </Button>
        )}
        {isLoading && !testFinished && <p className="text-center">Loading test...</p>}
      </div>

      {/* Right Column: Questions & Answers */}
      <div ref={rightColumnRef} className="w-full md:w-3/5 p-6 md:p-8 flex flex-col h-full overflow-y-auto">
        {testStarted && !testFinished && currentQuestion ? (
          <div className="flex flex-col h-full fade-in space-y-4">
            {/* Progress and Timer Section */}
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
              {/* Per-type progress bars */}
              <div className="space-y-2">
                {questionTypeOrder.map(type => {
                  // Filter main questions (non-penalty) of the current type
                  const questionsOfType = questions.filter(q => q.type === type && !penaltyQuestions.some(pq => pq._id === q._id));
                  const totalOfType = questionsOfType.length;
                  if (totalOfType === 0) return null; // Don't show progress if no questions of this type

                  // Count answered questions of this type from main questions
                  const answeredOfType = answers.filter(ans => {
                    const q = questions.find(q => q._id === ans.questionId);
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
            <Card className="flex-grow flex flex-col glass min-h-0"> {/* Ensure card can shrink/grow */}
              <CardHeader>
                <CardTitle>Question {completedQuestions + 1}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col space-y-4 min-h-0"> {/* Ensure content can shrink/grow */}
                <div
                  className="p-4 border border-border rounded-md bg-white/50 dark:bg-black/20 flex-grow overflow-auto"
                  // These event handlers are now on the main container; remove if not needed here specifically
                  // onCopy={(e) => handleAnswerEventPrevent(e, 'Copy')}
                  // onCut={(e) => handleAnswerEventPrevent(e, 'Cut')}
                  // onPaste={(e) => handleAnswerEventPrevent(e, 'Paste')}
                  // onDragStart={(e) => handleAnswerEventPrevent(e, 'Drag')}
                  // onDrop={(e) => handleAnswerEventPrevent(e, 'Drop')}
                >
                  <p className="text-lg whitespace-pre-wrap break-words">{currentQuestion.query}</p>
                </div>

                {/* Answer Input Area: MCQ or Textarea */}
                {currentQuestion.type === 'MCQ' && currentQuestion.options ? (
                  <RadioGroup
                    value={answer}
                    onValueChange={setAnswer}
                    className="space-y-3 p-1" // Add some padding around radio group
                  >
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 rounded-md border border-input bg-white/80 dark:bg-black/30 hover:bg-accent/10">
                        <RadioGroupItem value={option} id={`option-${currentQuestion._id}-${index}`} className="border-primary text-primary" />
                        <Label htmlFor={`option-${currentQuestion._id}-${index}`} className="font-normal text-base text-foreground cursor-pointer flex-1">
                          {option}
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
                        // Existing focus logic, ensure it scrolls correctly with dynamic padding
                        if (window.visualViewport && window.innerWidth < 768) { // Only for mobile
                             // Check if the target is significantly obscured by the keyboard
                             const targetRect = e.target.getBoundingClientRect();
                             const viewportHeight = window.visualViewport?.height || window.innerHeight;
                             if (targetRect.bottom > viewportHeight - 50) { // 50px buffer
                                 e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                             }
                        }
                    }}
                    // Specific copy/paste/drag handlers for the textarea
                    onCopy={(e) => handleAnswerEventPrevent(e, 'Copy')}
                    onCut={(e) => handleAnswerEventPrevent(e, 'Cut')}
                    onPaste={(e) => handleAnswerEventPrevent(e, 'Paste')}
                    onDragStart={(e) => handleAnswerEventPrevent(e, 'Drag')}
                    onDrop={(e) => handleAnswerEventPrevent(e, 'Drop')}
                    onTouchStart={(e: React.TouchEvent<HTMLTextAreaElement>) => {
                      // Logic to detect long press for paste attempt on touch devices
                      const touchStartTime = Date.now();
                      (e.target as HTMLTextAreaElement).ontouchend = () => {
                        const touchEndTime = Date.now();
                        if (touchEndTime - touchStartTime > 500) { // 500ms threshold for long press
                           // The onPaste handler will prevent default if it's a paste action
                           // This specific check for long-press paste might be redundant if onPaste covers it
                           // but can be a fallback.
                        }
                        (e.target as HTMLTextAreaElement).ontouchend = null; // Clean up
                      };
                    }}
                    className="min-h-[150px] text-base bg-white/80 dark:bg-black/30 flex-shrink-0" // Ensure textarea does not grow indefinitely
                    aria-label="Answer input area"
                  />
                )}
              </CardContent>
            </Card>

            <Button
              onClick={handleNextQuestionRef.current}
              className="w-full md:w-auto self-end bg-accent text-accent-foreground hover:bg-accent/90 py-3 px-6 mt-4"
              disabled={currentQuestionIndex >= questions.length && penaltyQuestions.length === 0} // Disable if it's truly the last question
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
          // Fallback: Waiting to Start / Loading
          <Card className="m-auto p-8 text-center glass">
            <CardHeader>
              <CardTitle className="text-2xl">Waiting to Start</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {isLoading
                  ? 'Loading test questions...'
                  : (questions.length === 0 ? 'No test questions are currently loaded. Please wait or contact support if this persists.' : 'Please read the instructions and click "Accept & Start Test" when ready.')}
              </CardDescription>
              {isLoading && <Loader2 className="mt-4 h-8 w-8 animate-spin mx-auto text-muted-foreground" />}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

