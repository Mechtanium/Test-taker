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
  _owner: string;
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
                  { _id: 'q1', _owner: 'test', query: 'What is 2 + 2?', test_id: 't1', type: 'math', dur_millis: 15000 },
                  { _id: 'q2', _owner: 'test', query: 'What is the capital of France?\n\nThis is a longer question to test scrolling behavior.\nIt continues on multiple lines.\nLine 4.\nLine 5.\nLine 6.\nLine 7.\nLine 8.\nLine 9.\nLine 10.', test_id: 't1', type: 'geo', dur_millis: 10000 },
                  { _id: 'q3', _owner: 'test', query: 'Describe React hooks.', test_id: 't1', type: 'cs', dur_millis: 30000 },
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
           // A simple check: if width decreased significantly but height increased, it might be virtual keyboard
           const likelyKeyboard = initialViewportHeightRef.current > 0 && currentHeight > initialViewportHeightRef.current && currentWidth < window.innerWidth;


           if (initialViewportHeightRef.current > 0 && !orientationChanged && !likelyKeyboard && isUnexpectedSize) {
                console.log('Significant window resize detected.');
                handlePenalty('Window resized');
           } else {
                if (orientationChanged) {
                    console.log('Orientation change detected, ignoring resize penalty.');
                }
                if (likelyKeyboard) {
                    console.log('Possible virtual keyboard detected, ignoring resize penalty.');
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

  // Timer Effect
  useEffect(() => {
    if (testStarted && currentQuestionIndex !== -1 && !testFinished) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      startTimeRef.current = Date.now(); // Record start time for the question
      const duration = questions[currentQuestionIndex]?.dur_millis;
      if (duration > 0) {
          setTimeLeft(duration); // Set initial time in milliseconds
           timerRef.current = setInterval(() => {
                const elapsed = Date.now() - startTimeRef.current;
                const remaining = duration - elapsed;

                if (remaining <= 0) {
                    if (timerRef.current) { // Check if timer still exists before clearing
                        clearInterval(timerRef.current);
                        timerRef.current = null;
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

    } else if (timerRef.current) {
        // Clear timer if test not started, finished, or no question selected
        clearInterval(timerRef.current);
        timerRef.current = null;
    }

    // Cleanup function for the interval
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
         timerRef.current = null; // Ensure ref is cleared on cleanup
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
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground pointillism">
      {/* Left Column (Info & Instructions) - 40% width */}
      <div className="w-full md:w-2/5 p-6 md:p-8 border-r border-border flex flex-col space-y-6 glass">
         {/* Replaced h1 with Image component */}
         <div className="mb-4">
           <Image
             src="https://picsum.photos/200/50" // Placeholder image URL
             alt="Test taker Logo" // Changed alt text
             width={200}
             height={50}
             data-ai-hint="logo abstract" // Hint for image search
             className="object-contain" // Adjust as needed
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
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3"
          >
             {isAccepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
             {isAccepting ? 'Entering Fullscreen...' : 'Accept & Start Test'}
          </Button>
        )}
         {isLoading && !testFinished && <p className="text-center">Loading test...</p>}

      </div>

      {/* Right Column (Questions & Timer) - 60% width */}
      <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col">
        {testStarted && !testFinished && currentQuestion ? (
          <div className="flex flex-col h-full fade-in space-y-4">

            {/* Progress Bar and Timer */}
            <div className="flex justify-between items-center mb-4 glass p-4 rounded-lg">
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
                 <CardHeader>
                     <CardTitle>Question {completedQuestions + 1}</CardTitle>
                 </CardHeader>
                 <CardContent className="flex-grow flex flex-col space-y-4 min-h-0"> {/* Added min-h-0 */}
                      <div className="p-4 border border-border rounded-md bg-white/50 dark:bg-black/20 flex-grow overflow-auto">
                         {/* Wrap long text to prevent overflow */}
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
                         className="min-h-[150px] text-base bg-white/80 dark:bg-black/30 flex-shrink-0" // Added flex-shrink-0
                         aria-label="Answer input area"
                      />
                 </CardContent>
             </Card>


            <Button
              onClick={handleNextQuestion}
              className="w-full md:w-auto self-end bg-accent text-accent-foreground hover:bg-accent/90 py-3 px-6 mt-4" // Added mt-4 for spacing
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
