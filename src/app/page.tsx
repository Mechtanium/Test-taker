
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Added for MCQ
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import AnnahAiLogo from '@/components/annah-ai-logo';

interface Question {
  _id: string;
  query: string;
  test_id: string;
  type: "MCQ" | "G_OBJ" | "SHORT" | "PARAGRAPH"; // More specific types
  dur_millis: number;
  options?: string[]; // For MCQ questions
  _owner?: string; // Keep existing fields if they are used by parent
}

interface Answer {
  questionId: string;
  answer: string;
  timeTaken: number; // in milliseconds
}

const questionTypeOrder: Question['type'][] = ["MCQ", "G_OBJ", "SHORT", "PARAGRAPH"];

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

// Helper function to sort questions by type and randomize within type
function sortAndGroupQuestions(questionsToSort: Question[]): Question[] {
  const groupedQuestions: { [key in Question['type']]?: Question[] } = {};
  questionTypeOrder.forEach(type => groupedQuestions[type] = []);

  questionsToSort.forEach(q => {
    // Ensure the type is one of the known types, otherwise default or handle
    const typeKey = questionTypeOrder.includes(q.type) ? q.type : 'PARAGRAPH';
    if (groupedQuestions[typeKey]) {
      groupedQuestions[typeKey]!.push(q);
    } else {
      // This case should ideally not happen if q.type is always valid
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
    // Check if the event target is part of the allowed inputs or an MCQ option
    let target = e.target as HTMLElement;
    let isAllowedInput = false;

    // For touch events, the target might be different, try to find the relevant input
    if (e.type.startsWith('touch') && (e as React.TouchEvent).changedTouches.length > 0) {
      const touchTarget = document.elementFromPoint(
        (e as React.TouchEvent).changedTouches[0].clientX,
        (e as React.TouchEvent).changedTouches[0].clientY
      );
      if (touchTarget) target = touchTarget as HTMLElement;
    }

    // Traverse up to see if it's inside an mcq option label or radio group item
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

    if (isAllowedInput && (e.type === 'paste' || action.toLowerCase() === 'paste')) {
      // If pasting into allowed input, we still want to show toast and prevent
      e.preventDefault();
      toast({
        title: 'Action Disabled',
        description: `Pasting is disabled.`,
        variant: 'destructive',
        duration: 2000,
      });
      return;
    }


    if (e.type === 'paste' || action.toLowerCase() === 'paste') {
      e.preventDefault();
      toast({
        title: 'Action Disabled',
        description: `Pasting is disabled.`,
        variant: 'destructive',
        duration: 2000,
      });
      return;
    }

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
      duration: 10000,
    });

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setAnswers(prevAnswers => {
      let finalAnswers = [...prevAnswers];
      if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
        const currentQuestionId = questions[currentQuestionIndex]._id;
        const timeTaken = Date.now() - startTimeRef.current;
        if (!finalAnswers.some(a => a.questionId === currentQuestionId)) {
          finalAnswers.push({ questionId: currentQuestionId, answer, timeTaken });
        }
      }
      console.log('Submitting penalized answers:', { studentEmail, matriculationNumber, answers: finalAnswers });
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'testSubmission',
          status: 'penalized',
          reason: reason,
          studentEmail,
          matriculationNumber,
          answers: finalAnswers
        }, '*');
        console.log('Posted penalized test submission to parent.');
      }
      return finalAnswers;
    });

    setTestFinished(true);
    setCurrentQuestionIndex(-1);
    setQuestions([]);
    setPenaltyQuestions([]);

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


  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.origin && event.origin !== 'https://sapiensng.wixstudio.com' && window.origin !== 'null') {
        // console.warn('Message received from unexpected origin:', event.origin);
        // return;
      }

      if (event.data?.type === 'questionsLoaded' && Array.isArray(event.data.questions)) {
        if (event.data.questions.length > 0 && event.data.questions[0]?.query) {
          processReceivedQuestions(event.data.questions as Question[]);
        } else if (event.data.questions.length === 0) {
          setQuestions([]);
          setIsLoading(false);
          console.log('Received empty questions list.');
          toast({
            title: 'No Questions',
            description: 'The test has no questions loaded.',
            variant: 'destructive'
          });
        }
      } else if (event.data === 'TestLockReady') {
        console.log('Parent window acknowledged TestLockReady.');
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('Message listener added.');

    if (window.parent !== window) {
      window.parent.postMessage('TestLockReady', '*');
      console.log('Posted TestLockReady message.');
    } else {
      console.warn('Not running in an iframe, simulating question loading.');
      setIsLoading(true);
      setTimeout(() => {
        const dummyQuestionsData: Question[] = [
          { _id: 'mcq1', query: 'What is the capital of Mars?', test_id: 't1', type: 'MCQ', dur_millis: 20000, options: ['Olympus Mons City', "Valles Marineris Town", "Gale Crater Village", "None of the above"], _owner: 'dummy' },
          { _id: 'gobj1', query: 'Identify the correct chemical formula for water.', test_id: 't1', type: 'G_OBJ', dur_millis: 18000, _owner: 'dummy' },
          { _id: 'short1', query: 'Define "photosynthesis" in one sentence.', test_id: 't1', type: 'SHORT', dur_millis: 25000, _owner: 'dummy' },
          { _id: 'p1', query: 'What is 2 + 2?', test_id: 't1', type: 'PARAGRAPH', dur_millis: 15000, _owner: 'dummy' },
          { _id: 'mcq2', query: 'Which planet is known as the Red Planet?', test_id: 't1', type: 'MCQ', dur_millis: 12000, options: ['Earth', 'Mars', 'Jupiter', 'Saturn'], _owner: 'dummy' },
          { _id: 'p2', query: 'What is the capital of France?\n\nThis is a longer question to test scrolling behavior.\nIt continues on multiple lines.\nLine 4.\nLine 5.\nLine 6.\nLine 7.\nLine 8.\nLine 9.\nLine 10.', test_id: 't1', type: 'PARAGRAPH', dur_millis: 10000, _owner: 'dummy' },
          { _id: 'short2', query: 'What is CPU short for?', test_id: 't1', type: 'SHORT', dur_millis: 10000, _owner: 'dummy' },
          { _id: 'p3', query: 'Describe React hooks.', test_id: 't1', type: 'PARAGRAPH', dur_millis: 30000, _owner: 'dummy' },
        ];
        // Simulate the message structure that handleMessage expects
        const simulatedEventData = { type: 'questionsLoaded', questions: dummyQuestionsData };
        handleMessage({ data: simulatedEventData } as MessageEvent);
        console.log('Simulated questions loaded via handleMessage.');
      }, 1000);
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
      const isUnexpectedSize = Math.abs(currentHeight - screenHeight) > 150 || Math.abs(currentWidth - screenWidth) > 150;
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      const previousOrientation = initialViewportHeightRef.current > 0 ? (initialViewportHeightRef.current < window.innerWidth) : isLandscape;
      const orientationChanged = isLandscape !== previousOrientation;
      const likelyKeyboard = initialViewportHeightRef.current > 0 && currentHeight < initialViewportHeightRef.current;

      if (initialViewportHeightRef.current > 0 && !orientationChanged && !likelyKeyboard && isUnexpectedSize) {
        console.log('Significant window resize detected.');
        handlePenalty('Window resized');
      } else {
        if (orientationChanged) {
          console.log('Orientation change detected, ignoring resize penalty.');
          initialViewportHeightRef.current = currentHeight;
        }
        if (likelyKeyboard) {
          console.log('Possible virtual keyboard detected, ignoring resize penalty.');
          answerTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  }, [testStarted, testFinished, handlePenalty]);


  const internalHandleNextQuestion = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
      const timeTaken = Date.now() - startTimeRef.current;
      const currentQuestionId = questions[currentQuestionIndex]._id;
      setAnswers((prevAnswers) => {
        const existingAnswerIndex = prevAnswers.findIndex(a => a.questionId === currentQuestionId);
        if (existingAnswerIndex === -1) {
          return [...prevAnswers, { questionId: currentQuestionId, answer, timeTaken }];
        } else {
          const updatedAnswers = [...prevAnswers];
          updatedAnswers[existingAnswerIndex] = { questionId: currentQuestionId, answer, timeTaken };
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

        setAnswers(currentAnswers => {
          console.log('Test finished normally. Final answers:', { studentEmail, matriculationNumber, answers: currentAnswers });
          if (window.parent !== window) {
            window.parent.postMessage({
              type: 'testSubmission',
              status: 'completed',
              studentEmail,
              matriculationNumber,
              answers: currentAnswers
            }, '*');
            console.log('Posted completed test submission to parent.');
          }
          return currentAnswers;
        });

        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => console.error("Error exiting fullscreen:", err));
        }
      }
    }
  }, [currentQuestionIndex, questions, answer, penaltyQuestions, studentEmail, matriculationNumber]);


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
            // Make sure handleNextQuestionRef.current is the latest version by not including it in deps
            // or by ensuring internalHandleNextQuestion has stable dependencies.
            // The current setup with handleNextQuestionRef.current being updated by its own useEffect should work.
            handleNextQuestionRef.current();
          } else {
            setTimeLeft(newRemainingTime);
          }
        }, 100);
      } else {
        setTimeLeft(-1);
        console.warn(`Question ${currentQuestionIndex} has invalid or zero duration: ${duration}`);
      }

      if (currentQ.type !== 'MCQ') { // Only focus textarea if not MCQ
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
    // IMPORTANT: Do NOT add `answer` to dependencies here, it will cause timer resets on each key stroke.
    // handleNextQuestionRef is a ref, so it's stable. questions changing will trigger re-evaluation.
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


  return (
    <div
      ref={containerRef}
      className="flex flex-col md:flex-row h-full w-full bg-background text-foreground pointillism transition-[padding-bottom] duration-300 ease-in-out md:pb-0"
    >
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
            disabled={isLoading || isAccepting || questions.length === 0}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3"
          >
            {isAccepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isAccepting ? 'Entering Fullscreen...' : (questions.length === 0 && !isLoading ? 'No Test Loaded' : 'Accept & Start Test')}
          </Button>
        )}
        {isLoading && !testFinished && <p className="text-center">Loading test...</p>}
      </div>

      <div ref={rightColumnRef} className="w-full md:w-3/5 p-6 md:p-8 flex flex-col h-full overflow-y-auto">
        {testStarted && !testFinished && currentQuestion ? (
          <div className="flex flex-col h-full fade-in space-y-4">
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
                  const questionsOfType = questions.filter(q => q.type === type && !penaltyQuestions.some(pq => pq._id === q._id));
                  const totalOfType = questionsOfType.length;
                  if (totalOfType === 0) return null;

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

            <Card className="flex-grow flex flex-col glass min-h-0">
              <CardHeader>
                <CardTitle>Question {completedQuestions + 1}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col space-y-4 min-h-0">
                <div
                  className="p-4 border border-border rounded-md bg-white/50 dark:bg-black/20 flex-grow overflow-auto"
                  onCopy={(e) => handleAnswerEventPrevent(e, 'Copy')}
                  onCut={(e) => handleAnswerEventPrevent(e, 'Cut')}
                  onPaste={(e) => handleAnswerEventPrevent(e, 'Paste')}
                  onDragStart={(e) => handleAnswerEventPrevent(e, 'Drag')}
                  onDrop={(e) => handleAnswerEventPrevent(e, 'Drop')}
                >
                  <p className="text-lg whitespace-pre-wrap break-words">{currentQuestion.query}</p>
                </div>

                {currentQuestion.type === 'MCQ' && currentQuestion.options ? (
                  <RadioGroup
                    value={answer}
                    onValueChange={setAnswer}
                    className="space-y-3 p-1"
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
                      if (containerRef.current && window.visualViewport && window.innerWidth < 768) {
                        const onVisualViewportChange = () => {
                          if (window.visualViewport) {
                            const keyboardOffset = Math.max(0, window.innerHeight - window.visualViewport.height + 200);
                            containerRef.current?.style.setProperty('--keyboard-offset', `${keyboardOffset}px`);
                            containerRef.current?.style.setProperty('padding-bottom', `${keyboardOffset}px`);
                            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        };
                        window.visualViewport.addEventListener('resize', onVisualViewportChange);
                        (answerTextareaRef.current as any)._cleanupVisualViewport = () => {
                          window.visualViewport?.removeEventListener('resize', onVisualViewportChange);
                        };
                        onVisualViewportChange();
                      } else if (window.innerWidth >= 768) {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    onBlur={() => {
                      if (containerRef.current && window.innerWidth < 768) {
                        containerRef.current?.style.setProperty('--keyboard-offset', `0px`);
                        containerRef.current?.style.setProperty('padding-bottom', `0px`);
                        if ((answerTextareaRef.current as any)._cleanupVisualViewport) {
                          (answerTextareaRef.current as any)._cleanupVisualViewport();
                          delete (answerTextareaRef.current as any)._cleanupVisualViewport;
                        }
                      }
                    }}
                    onCopy={(e) => handleAnswerEventPrevent(e, 'Copy')}
                    onCut={(e) => handleAnswerEventPrevent(e, 'Cut')}
                    onPaste={(e) => handleAnswerEventPrevent(e, 'Paste')}
                    onDragStart={(e) => handleAnswerEventPrevent(e, 'Drag')}
                    onDrop={(e) => handleAnswerEventPrevent(e, 'Drop')}
                    onTouchStart={(e: React.TouchEvent<HTMLTextAreaElement>) => {
                      // Attempt to detect long-press for context menu (paste)
                      const touchStartTime = Date.now();
                      (e.target as HTMLTextAreaElement).ontouchend = () => {
                        const touchEndTime = Date.now();
                        if (touchEndTime - touchStartTime > 500) { // 500ms might indicate long press
                          // Cannot directly prevent context menu paste reliably here
                          // The onPaste handler is the primary defense
                        }
                        (e.target as HTMLTextAreaElement).ontouchend = null;
                      };
                    }}
                    className="min-h-[150px] text-base bg-white/80 dark:bg-black/30 flex-shrink-0"
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
                  : (questions.length === 0 ? 'No test questions are currently loaded. Please wait or contact support.' : 'Please read the instructions and click "Accept & Start Test" when ready.')}
              </CardDescription>
              {isLoading && <Loader2 className="mt-4 h-8 w-8 animate-spin mx-auto text-muted-foreground" />}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

