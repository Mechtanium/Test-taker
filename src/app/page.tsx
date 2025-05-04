'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image'; // Import next/image
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Question {
  _id: string;
  query: string;
  test_id: string;
  type: string;
  dur_millis: number;
}

interface Answer {
  questionId: string;
  answer: string;
  timeTaken: number; // in milliseconds
}

// Helper function to shuffle an array
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

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1); // -1 means test hasn't started
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [answer, setAnswer] = useState<string>('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [studentEmail, setStudentEmail] = useState<string>('');
  const [matriculationNumber, setMatriculationNumber] = useState<string>('');
  const [testStarted, setTestStarted] = useState<boolean>(false);
  const [testFinished, setTestFinished] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Added loading state
  const [isAccepting, setIsAccepting] = useState<boolean>(false); // For fullscreen transition
  const [penaltyQuestions, setPenaltyQuestions] = useState<Question[]>([]); // Store penalty questions


  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const initialViewportHeightRef = useRef<number>(0);
  const { toast } = useToast();
  const answerTextareaRef = useRef<HTMLTextAreaElement>(null);

  const penaltyTriggeredRef = useRef(false); // Ref to track if penalty was triggered

  const handleAnswerEventPrevent = (e: React.ClipboardEvent<HTMLTextAreaElement>, action: string) => {
    e.preventDefault();
    toast({
      title: 'Action Disabled',
      description: `${action}ing is disabled for the answer box.`,
      variant: 'destructive',
      duration: 2000,
    });
  };

    // Function to scroll the textarea into view, especially for mobile keyboards
    const scrollInputIntoView = () => {
      // Add a small delay to allow the keyboard animation to start
      setTimeout(() => {
        answerTextareaRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest', // Scroll nearest edge into view
        });
      }, 150); // Increased delay slightly
    };


  const handlePenalty = useCallback((reason: string) => {
    if (penaltyTriggeredRef.current || !testStarted || testFinished) return; // Prevent multiple triggers or triggering before/after test

    penaltyTriggeredRef.current = true; // Mark penalty as triggered

    toast({
      title: 'Test Violation Detected',
      description: `${reason}. Your current answers will be submitted, and the test will end.`,
      variant: 'destructive',
      duration: 10000,
    });

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Submit answers immediately
    const finalAnswers = [...answers];
    // Include the current partially answered question if applicable
    if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
      const currentQuestionId = questions[currentQuestionIndex]._id;
      const timeTaken = Date.now() - startTimeRef.current;
      // Check if this question's answer is already recorded; if not, add the current state
      if (!finalAnswers.some(a => a.questionId === currentQuestionId)) {
        finalAnswers.push({ questionId: currentQuestionId, answer, timeTaken });
      }
    }

    console.log('Submitting penalized answers:', finalAnswers);
    // In a real app, send `finalAnswers` and student info to the backend here.
    // Example: postData('/submit-penalized-test', { studentEmail, matriculationNumber, answers: finalAnswers });

    setTestFinished(true); // Mark test as finished
    setCurrentQuestionIndex(-1); // Stop displaying questions
    setQuestions([]); // Clear questions
    setPenaltyQuestions([]); // Clear penalty questions

    // Attempt to exit fullscreen gracefully if possible
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error("Error exiting fullscreen:", err));
    }

  }, [answers, currentQuestionIndex, questions, answer, toast, testStarted, testFinished, studentEmail, matriculationNumber]); // Added studentEmail and matriculationNumber


  // Moved handleNextQuestion definition before the timer useEffect that uses it
  const handleNextQuestion = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Save current answer before moving
    if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
      const timeTaken = Date.now() - startTimeRef.current;
      const currentQuestionId = questions[currentQuestionIndex]._id;
      // Avoid duplicate entries if penalty already saved it or test finished auto-saved
      if (!answers.some(a => a.questionId === currentQuestionId)) {
        setAnswers((prev) => [...prev, { questionId: currentQuestionId, answer, timeTaken }]);
      }
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

        // Submit final answers here in a real app
        // Use the latest answers state by passing a function to setAnswers
        setAnswers(currentAnswers => {
          console.log('Test finished normally. Final answers:', currentAnswers);
          // Example: postData('/submit-test', { studentEmail, matriculationNumber, answers: currentAnswers });
          return currentAnswers; // Return the unchanged state
        });


        // Attempt to exit fullscreen gracefully if possible
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => console.error("Error exiting fullscreen:", err));
        }
      }
    }
    // Dependencies should reflect state read *inside* the useCallback
  }, [currentQuestionIndex, questions, answer, answers, penaltyQuestions, studentEmail, matriculationNumber]); // Added studentEmail, matriculationNumber


  // Effect for message listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Add origin check for security in a real application
      // if (event.origin !== "expected_origin") return;
      if (event.data && Array.isArray(event.data) && event.data.length > 0 && event.data[0]?.query) {
        const receivedQuestions: Question[] = event.data;
        setQuestions(shuffleArray([...receivedQuestions])); // Shuffle questions on receive
        setIsLoading(false); // Questions loaded
        console.log('Received questions:', receivedQuestions);
      } else if (event.data === 'TestLockReady') {
        // Parent window acknowledged readiness, you might not need to do anything here
        console.log('Parent window acknowledged TestLockReady.');
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('Message listener added.');

    // Inform parent window that the app is ready
    if (window.parent !== window) {
      window.parent.postMessage('TestLockReady', '*'); // '*' is insecure for production, specify origin
      console.log('Posted TestLockReady message.');
    } else {
      // For testing without an iframe parent
      console.warn('Not running in an iframe, simulating question loading.');
      setTimeout(() => {
        const dummyQuestions: Question[] = [
          { _id: 'q1', query: 'What is 2 + 2?', test_id: 't1', type: 'math', dur_millis: 15000 },
          { _id: 'q2', query: 'What is the capital of France?\n\nThis is a longer question to test scrolling behavior.\nIt continues on multiple lines.\nLine 4.\nLine 5.\nLine 6.\nLine 7.\nLine 8.\nLine 9.\nLine 10.', test_id: 't1', type: 'geo', dur_millis: 10000 },
          { _id: 'q3', query: 'Describe React hooks.', test_id: 't1', type: 'cs', dur_millis: 30000 },
        ];
        // Use handleMessage to process dummy data consistently
        handleMessage({ data: dummyQuestions } as MessageEvent);
      }, 1000);
    }


    return () => {
      window.removeEventListener('message', handleMessage);
      console.log('Message listener removed.');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run on mount
  }, []);

  // Security Listeners Setup Effect (Conditional)
  useEffect(() => {
    if (!testStarted || testFinished) return; // Only run if test is active

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Tab switched or window minimized.');
        handlePenalty('Tab switched or window minimized');
      }
    };

    const handleResize = () => {
      // Check for significant resize changes, ignoring keyboard popups/auto-rotate
      // Use screen dimensions as a fallback reference
      const currentHeight = window.innerHeight;
      const currentWidth = window.innerWidth;
      const screenHeight = screen.height;
      const screenWidth = screen.width;

      // Check if the window size is drastically different from the screen size (might indicate dev tools or unusual resize)
      // Allow some tolerance (e.g., 100px) for toolbars, etc.
      const isUnexpectedSize = Math.abs(currentHeight - screenHeight) > 150 || Math.abs(currentWidth - screenWidth) > 150;

      // More robust orientation check
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      const previousOrientation = initialViewportHeightRef.current > 0 ? (initialViewportHeightRef.current < window.innerWidth) : isLandscape; // Infer previous based on height/width comparison
      const orientationChanged = isLandscape !== previousOrientation;


      // Ignore resize if it's likely due to orientation change or virtual keyboard
      // A simple check: if height decreased significantly, it might be virtual keyboard (less reliable than before)
      const likelyKeyboard = initialViewportHeightRef.current > 0 && currentHeight < initialViewportHeightRef.current - 100; // Adjust threshold as needed


      if (initialViewportHeightRef.current > 0 && !orientationChanged && !likelyKeyboard && isUnexpectedSize) {
        console.log('Significant window resize detected.');
        // Temporarily disable resize penalty to avoid issues with keyboard
        // handlePenalty('Window resized');
        console.warn('Resize penalty temporarily disabled due to keyboard detection complexity.');
      } else {
         if (orientationChanged) {
          console.log('Orientation change detected, ignoring resize penalty.');
         }
         if (likelyKeyboard) {
           console.log('Possible virtual keyboard detected, ignoring resize penalty.');
            // When keyboard appears, try scrolling the input into view again
           scrollInputIntoView();
         }
        // Update reference height/width on orientation change or first valid resize
        initialViewportHeightRef.current = currentHeight;
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


    // Store initial height right after test starts and listeners are added
    initialViewportHeightRef.current = window.innerHeight;


    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange); // Safari
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange); // Firefox
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange); // IE/Edge
      console.log('Security listeners (visibility, resize, fullscreen) removed.');
    };
  }, [testStarted, testFinished, handlePenalty]);



  // Timer Effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (testStarted && currentQuestionIndex !== -1 && !testFinished) {
      startTimeRef.current = Date.now(); // Record start time for the question
      const duration = questions[currentQuestionIndex]?.dur_millis;
      if (duration > 0) {
        setTimeLeft(duration); // Set initial time in milliseconds

        intervalId = setInterval(() => {
          const elapsed = Date.now() - startTimeRef.current;
          const remaining = duration - elapsed;

          if (remaining <= 0) {
            if (intervalId) { // Check if timer still exists before clearing
              clearInterval(intervalId);
            }
            handleNextQuestion(); // Auto-advance when time is up
          } else {
            setTimeLeft(remaining);
          }
        }, 100); // Update timer frequently for smoother display
      } else {
        // Handle questions with no duration? Maybe infinite time?
        setTimeLeft(-1); // Indicate infinite time or handle as error
        console.warn(`Question ${currentQuestionIndex} has invalid duration: ${duration}`);
      }

      // Auto-focus textarea
      answerTextareaRef.current?.focus();
      // Scroll into view when question changes
      scrollInputIntoView();


    } else {
      // Clear timer if test not started, finished, or no question selected
      if (intervalId) {
        clearInterval(intervalId);
      }
    }

    // Cleanup function for the interval
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
    // Ensure effect re-runs when index changes or test starts/finishes
  }, [testStarted, currentQuestionIndex, testFinished, questions, handleNextQuestion]); // handleNextQuestion is now defined above


  const handleAccept = async () => {
    if (!studentEmail || !matriculationNumber) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both student email and matriculation number.',
        variant: 'destructive',
      });
      return;
    }
    setIsAccepting(true); // Show loading state on button
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen({ navigationUI: "hide" }); // Try hiding navigation UI
      } else if ((document.documentElement as any).mozRequestFullScreen) { /* Firefox */
        await (document.documentElement as any).mozRequestFullScreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        await (document.documentElement as any).webkitRequestFullscreen();
      } else if ((document.documentElement as any).msRequestFullscreen) { /* IE/Edge */
        await (document.documentElement as any).msRequestFullscreen();
      }
      // Delay starting the test slightly to ensure fullscreen transition completes
      // and to allow resize listener to capture initial fullscreen dimensions
      setTimeout(() => {
        setTestStarted(true);
        setCurrentQuestionIndex(0); // Start with the first question
        setIsAccepting(false); // Hide loading state
        console.log('Test started after fullscreen.');
      }, 500); // Adjust delay if needed

    } catch (err) {
      console.error("Fullscreen request failed:", err);
      toast({
        title: 'Fullscreen Required',
        description: 'Could not enter fullscreen mode. Please ensure your browser allows it.',
        variant: 'destructive',
      });
      setIsAccepting(false); // Hide loading state on failure
    }
  };


  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length - penaltyQuestions.length; // Base total excluding penalties initially
  const completedQuestions = currentQuestionIndex >= 0 ? currentQuestionIndex : 0;
  const questionProgressValue = totalQuestions > 0 ? (Math.min(completedQuestions, totalQuestions) / totalQuestions) * 100 : 0;


  const formatTime = (ms: number): string => {
    if (ms < 0) return "∞"; // For infinite time indicator
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pointillism md:flex-row">
      {/* Left Column (Info & Instructions) - 40% width */}
      <div className="w-full md:w-2/5 p-6 md:p-8 border-r border-border flex flex-col space-y-6 glass overflow-y-auto"> {/* Added overflow-y-auto */}
        {/* ANNAH.AI Logo SVG */}
        <div className="mb-4 flex-shrink-0"> {/* Added flex-shrink-0 */}
           <svg width="239.75555" height="41.612816" viewBox="0 0 239.75555 41.612816" xmlns="http://www.w3.org/2000/svg">
            {/* SVG paths from your provided code */}
             <path d="m 68.865047,0 c -0.397313,0 -1.024562,0.01766049 -1.56838,0.46095378 -0.271909,0.22164664 -0.493217,0.57573362 -0.556555,0.98805342 -0.06334,0.4123199 0.008,0.863544 0.199471,1.3792439 l 11.669572,31.4156539 1.923914,5.814632 c 3.08e-4,0.0011 0.0017,9.37e-4 0.0021,0.0021 0.20554,0.698488 0.742457,1.144903 1.255737,1.33997 0.514051,0.195359 1.016368,0.209192 1.365292,0.212907 h 0.0041 6.697265 0.0021 c 0.859671,-0.0034 1.528557,-0.369069 1.861385,-0.888835 0.332828,-0.519766 0.355284,-1.102064 0.191203,-1.580265 l -0.0021,-0.0036 L 78.523372,1.6681152 C 78.251177,0.90614899 77.706225,0.4247417 77.160148,0.21083984 76.614071,-0.00306201 76.087334,0 75.724577,0 Z m 82.605813,0.06924642 c -0.67703,0 -2.00774,0.1910673 -1.34101,1.98592528 l 5.44463,14.6564693 -16.67185,-0.02739 -5.34954,-14.9747966 c -0.43728,-1.22409204 -1.50261,-1.2531535 -2.21072,-1.2531535 h -6.85901 c -0.67703,0 -2.00774,0.19106728 -1.34101,1.9859253 l 11.67371,31.4259888 1.93477,5.847188 c 0.29882,1.02158 1.37245,1.096809 2.02985,1.103809 h 6.69364 c 1.41112,-0.006 1.66618,-1.050453 1.464,-1.639693 l -5.25033,-14.697811 4.53461,-0.07803 12.2623,0.143661 3.31866,8.933821 1.93477,5.847189 c 0.29882,1.02158 1.37245,1.096808 2.02985,1.103808 h 6.69364 c 1.41112,-0.006 1.66618,-1.050453 1.464,-1.639693 L 160.54059,1.3223999 c -0.43728,-1.224092 -1.50261,-1.25315348 -2.21072,-1.25315348 z M 110.20619,0.4563029 c -0.69364,0.005574 -1.96536,-0.0279328 -2.30942,1.4030151 L 94.512061,39.327832 c -0.16945,0.51387 0.227478,1.494382 1.562178,1.491382 h 6.032711 c 0.69462,0 2.10834,-0.160604 2.38073,-1.096574 l 1.94355,-5.873027 c 0.33249,-1.02318 1.31856,-1.191591 2.2872,-1.189591 h 10.90889 c 0.93641,-0.0056 1.82499,0.246622 2.06861,1.208712 l 1.93528,5.846671 c 0.29882,1.02158 1.37193,1.096809 2.02934,1.103809 h 6.69365 c 1.41112,-0.0056 1.66617,-1.050453 1.46399,-1.639693 L 120.43296,1.7099731 c -0.43729,-1.22409192 -1.50263,-1.2500702 -2.21072,-1.2536702 z m -13.711822,0.0728638 c -0.348918,0.003821 -0.851285,0.0174274 -1.365291,0.2129069 C 94.615843,0.93725945 94.078363,1.3815058 93.872823,2.0799764 L 91.947359,7.8982259 87.314567,20.367232 93.275444,37.015828 98.457039,22.013643 105.24991,2.9998169 v -0.00362 C 105.414,2.5179973 105.39153,1.9377674 105.0587,1.4180013 104.72587,0.89823533 104.05699,0.53256242 103.19732,0.52916667 h -6.699334 z m -66.579915,0.0956014 c -0.677041,0 -2.00773,0.19106525 -1.341003,1.98592533 l 11.673706,31.4265056 1.935282,5.846671 c 0.29882,1.02157 1.371924,1.096809 2.029334,1.103809 h 6.694165 c 1.411119,-0.0056 1.665658,-1.050453 1.463476,-1.639693 L 38.984184,1.8784383 C 38.546903,0.65434532 37.48209,0.62476807 36.773983,0.62476807 Z m 26.577189,0 c -0.657409,0.0072 -1.730509,0.0827454 -2.029333,1.10432533 L 52.527026,7.575765 47.971232,19.841166 53.254631,34.602539 57.857967,21.276737 64.649284,2.2644613 c 0.20219,-0.58924 -0.05236,-1.63411923 -1.463477,-1.63969323 z M 68.865047,1.2500529 h 6.85953 c 0.345353,0 0.705817,0.018147 0.978751,0.125057 0.272934,0.10691 0.479322,0.2504914 0.644406,0.712618 L 90.730379,39.552625 c 0.03763,0.111572 0.03403,0.3453 -0.06253,0.496093 -0.09673,0.151062 -0.261603,0.311883 -0.810287,0.31471 h -6.687447 -0.0078 c -0.306843,-0.0037 -0.666631,-0.03267 -0.926042,-0.131258 -0.261558,-0.0994 -0.407804,-0.201699 -0.501778,-0.522966 l -0.0041,-0.01188 -1.941484,-5.867343 -11.67784,-31.4373572 c -0.1418,-0.38173 -0.154069,-0.6256499 -0.134359,-0.7539591 0.01971,-0.1283093 0.04711,-0.1582956 0.109038,-0.2087728 0.123848,-0.1009544 0.499553,-0.179834 0.77928,-0.179834 z M 96.50212,1.7792196 h 0.0057 6.687446 c 0.54868,0.00283 0.71407,0.1615823 0.8108,0.3126424 0.0969,0.1513771 0.10066,0.3871255 0.0625,0.4981608 l -6.791314,19.0096922 -4.023527,11.650452 -4.60747,-12.875183 4.480863,-12.0623131 1.941484,-5.8694092 0.0036,-0.00982 c 0.09398,-0.3212931 0.240177,-0.4239941 0.501778,-0.5234823 0.25999,-0.098876 0.620846,-0.127079 0.928109,-0.1307413 z M 65.863163,4.5976522 60.681567,19.599837 53.8887,38.61108 l -0.0021,0.0041 c -0.16409,0.478209 -0.139561,1.060501 0.19327,1.580265 0.332831,0.519765 0.999651,0.884925 1.859318,0.888318 h 0.0021 6.699333 0.0041 c 0.348924,-0.0037 0.849173,-0.01755 1.363224,-0.212907 0.514052,-0.19536 1.052959,-0.641217 1.257805,-1.34152 l 1.925464,-5.814632 4.631241,-12.46849 z M 27.451554,7.009908 22.848218,20.336226 16.056901,39.347986 c -0.202188,0.58924 0.05237,1.634123 1.463477,1.639693 h 6.694165 c 0.65741,-0.007 1.730513,-0.08224 2.029333,-1.103809 l 1.935283,-5.846671 4.555794,-12.265401 z m 38.433313,1.3554729 4.607471,12.8731161 -4.480863,12.062313 -1.940967,5.867342 -0.0041,0.01137 c -0.09397,0.321268 -0.24022,0.42408 -0.501778,0.523482 -0.259948,0.09879 -0.620852,0.127172 -0.928109,0.130741 h -6.691065 -0.0021 c -0.548677,-0.0028 -0.714069,-0.163128 -0.810803,-0.314192 -0.09656,-0.150795 -0.100157,-0.384529 -0.06253,-0.496094 1.46e-4,-4.32e-4 -1.47e-4,-0.0016 0,-0.0021 L 61.86134,20.013765 Z m 48.172253,3.8281901 c 0.25905,0.0047 0.52161,0.159266 0.62684,0.472323 l 3.57342,10.78177 c 0.3055,0.95271 0.16762,1.801693 -1.19217,1.812293 h -5.86735 c -1.32502,0 -1.72676,-0.692065 -1.38234,-1.668115 l 3.63647,-10.970907 c 0.0909,-0.286954 0.34609,-0.432113 0.60513,-0.427364 z m 66.32618,18.838643 a 4.6999998,4.6999998 0 0 0 -4.69997,4.699972 4.6999998,4.6999998 0 0 0 4.69997,4.699971 4.6999998,4.6999998 0 0 0 4.69998,-4.699971 4.6999998,4.6999998 0 0 0 -4.69998,-4.699972 z" fill="currentColor" />
             <path d="m 202.81036,0.59892985 c -0.69364,0.005574 -1.96536,-0.0284496 -2.30942,1.40249835 L 187.11623,39.470459 c -0.16945,0.51387 0.22748,1.493865 1.56218,1.490865 h 6.0327 c 0.69462,0 2.10835,-0.160604 2.38074,-1.096574 l 1.94355,-5.873026 c 0.33249,-1.02318 1.31856,-1.191592 2.2872,-1.189592 h 10.90889 c 0.93641,-0.0056 1.82499,0.246632 2.06861,1.208712 l 1.93528,5.846671 c 0.29882,1.02158 1.37192,1.096809 2.02933,1.103809 h 6.69365 c 1.41112,-0.0056 1.66618,-1.050453 1.464,-1.639693 L 213.03713,1.8520833 C 212.59984,0.62799136 211.5345,0.60252985 210.82641,0.59892985 Z M 15.730823,0.62476807 C 15.037181,0.63034207 13.765973,0.5968352 13.42192,2.0277832 L 0.03669027,39.496297 c -0.169445,0.51387 0.22747057,1.494382 1.56217853,1.491382 h 6.0332235 c 0.69462,0 2.1078183,-0.160604 2.3802167,-1.096574 l 1.944067,-5.873026 c 0.332487,-1.02317 1.318559,-1.191592 2.287199,-1.189592 H 25.15247 c 0.936414,-0.0056 1.824989,0.246622 2.068607,1.208712 l 1.934766,5.846671 c 0.29882,1.02158 1.371923,1.096809 2.029334,1.103809 h 6.694165 c 1.411109,-0.0056 1.666181,-1.050453 1.463993,-1.639693 L 25.958105,1.8784383 C 25.520822,0.65434632 24.455478,0.62836807 23.747388,0.62476807 Z m 201.508627,0 c -0.67704,0 -2.00773,0.19106525 -1.341,1.98592533 l 11.67371,31.4265056 1.93528,5.846671 c 0.29882,1.02157 1.37193,1.096809 2.02933,1.103809 h 6.69417 c 1.41112,-0.0056 1.66565,-1.050453 1.46347,-1.639693 L 226.30918,1.8784383 C 225.8719,0.65434532 224.80709,0.62476807 224.09898,0.62476807 Z M 206.66129,12.335681 c 0.25904,0.0048 0.52161,0.159266 0.62683,0.472323 l 3.57343,10.781771 c 0.3055,0.95271 0.16761,1.801692 -1.19218,1.812292 h -5.86734 c -1.32502,0 -1.72625,-0.692065 -1.38183,-1.668115 l 3.63596,-10.970907 c 0.0909,-0.286954 0.34608,-0.432113 0.60513,-0.427364 z m -187.079023,0.02636 c 0.259046,0.0047 0.521612,0.159266 0.626835,0.472323 l 3.572909,10.781771 c 0.305495,0.95271 0.168127,1.801692 -1.191659,1.812292 h -5.867859 c -1.325014,0 -1.726255,-0.692075 -1.381827,-1.668115 L 18.976619,12.7894 c 0.09091,-0.286954 0.346603,-0.432113 0.605648,-0.427364 z" fill="hsl(var(--accent))" /> {/* Use accent color */}
          </svg>
        </div>

        <Card className="glass flex-shrink-0"> {/* Added flex-shrink-0 */}
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


        <Card className="flex-grow glass"> {/* This card can grow */}
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. Ensure you have entered your correct email and matriculation number.</p>
            <p>2. Click "Accept & Start Test" to enter fullscreen mode and begin.</p>
            <p>3. Answer each question within the time limit shown.</p>
            <p>4. The test will automatically proceed to the next question when the timer runs out or you submit.</p>
            <p>5. <strong>Do not exit fullscreen, switch tabs, resize the window significantly, or attempt to copy/paste outside of the answer box. Doing so will result in immediate test submission or penalties.</strong></p>
            <p>6. Use the "Submit Answer" button to move to the next question manually.</p>
          </CardContent>
        </Card>

        {!testStarted && !isLoading && !testFinished && (
          <Button
            onClick={handleAccept}
            disabled={isLoading || isAccepting}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3 flex-shrink-0" /* Added flex-shrink-0 */
          >
            {isAccepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isAccepting ? 'Entering Fullscreen...' : 'Accept & Start Test'}
          </Button>
        )}
        {isLoading && !testFinished && <p className="text-center flex-shrink-0">Loading test...</p>} {/* Added flex-shrink-0 */}

      </div>

      {/* Right Column (Questions & Timer) - 60% width */}
      {/* Added pb-[200px] md:pb-8 to add padding at the bottom, especially for mobile keyboard */}
      <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col pb-[250px] md:pb-8">
        {testStarted && !testFinished && currentQuestion ? (
          <div className="flex flex-col h-full fade-in space-y-4">

            {/* Progress Bar and Timer */}
            <div className="flex justify-between items-center mb-4 glass p-4 rounded-lg flex-shrink-0"> {/* Added flex-shrink-0 */}
              <div className='w-2/3'>
                <Progress value={questionProgressValue} className="w-full h-3 bg-muted" />
                <p className="text-sm text-muted-foreground mt-1">
                  Question {Math.min(completedQuestions + 1, totalQuestions)} of {totalQuestions}
                  {penaltyQuestions.length > 0 ? ` (+${penaltyQuestions.length} penalties)` : ''}
                </p>
              </div>
              <div className="text-2xl font-mono font-semibold text-accent">
                {formatTime(timeLeft)}
              </div>
            </div>


            {/* Question Area */}
            <Card className="flex-grow flex flex-col glass min-h-0"> {/* Added min-h-0 */}
              <CardHeader className="flex-shrink-0"> {/* Added flex-shrink-0 */}
                <CardTitle>Question {completedQuestions + 1}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col space-y-4 min-h-0"> {/* Added min-h-0 */}
                {/* Make question text scrollable if needed, but allow textarea to take priority */}
                <div className="p-4 border border-border rounded-md bg-white/50 dark:bg-black/20 overflow-auto max-h-[30vh] flex-shrink"> {/* Limit height and allow scroll */}
                  <p className="text-lg whitespace-pre-wrap break-words">{currentQuestion.query}</p>
                </div>
                <Textarea
                  ref={answerTextareaRef}
                  placeholder="Type your answer here..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onCopy={(e) => handleAnswerEventPrevent(e, 'Copy')}
                  onCut={(e) => handleAnswerEventPrevent(e, 'Cut')}
                  onPaste={(e) => handleAnswerEventPrevent(e, 'Paste')}
                  onFocus={scrollInputIntoView} // Added onFocus handler
                  className="min-h-[150px] text-base bg-white/80 dark:bg-black/30 flex-grow" // Changed to flex-grow
                  aria-label="Answer input area"
                />
              </CardContent>
            </Card>


            <Button
              onClick={handleNextQuestion}
              className="w-full md:w-auto self-end bg-accent text-accent-foreground hover:bg-accent/90 py-3 px-6 mt-4 flex-shrink-0" // Added flex-shrink-0
              disabled={currentQuestionIndex >= questions.length} // Disable if no more questions
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
                  : 'Please read the instructions and click "Accept & Start Test" when ready.'}
              </CardDescription>
              {isLoading && <Loader2 className="mt-4 h-8 w-8 animate-spin mx-auto text-muted-foreground" />}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

