import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Check,
  ChevronLeft,
  Loader2,
  RotateCcw,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { saveQuizAttempt } from "@/lib/api";
import type { QuizQuestion } from "@/types";
import { cn } from "@/lib/utils";

interface QuizModeProps {
  doc: { id: string; quiz: { questions: QuizQuestion[] } | null };
}

export function QuizMode({ doc }: QuizModeProps) {
  const questions = doc.quiz?.questions || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);

  const question = questions[currentIdx];
  const isAnswered = selectedIdx !== null;
  const isCorrect = isAnswered && selectedIdx === question.correct_index;

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedIdx(idx);
    const newAnswers = [...answers];
    newAnswers[currentIdx] = idx;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedIdx(answers[currentIdx + 1]);
    } else {
      finishQuiz();
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setSelectedIdx(answers[currentIdx - 1]);
    }
  };

  const finishQuiz = async () => {
    const score = answers.reduce((acc: number, ans, i) => {
      return acc + (ans === questions[i].correct_index ? 1 : 0);
    }, 0);
    setShowResults(true);
    setSaving(true);
    try {
      await saveQuizAttempt(doc.id, score as number, questions.length);
    } catch {
    } finally {
      setSaving(false);
    }
    if (score / questions.length > 0.8) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  const retry = () => {
    setCurrentIdx(0);
    setSelectedIdx(null);
    setAnswers(Array(questions.length).fill(null));
    setShowResults(false);
  };

  if (showResults) {
    const score = answers.reduce((acc: number, ans, i) => {
      return acc + (ans === questions[i].correct_index ? 1 : 0);
    }, 0);
    const pct = Math.round((score / questions.length) * 100);
    const passed = pct > 80;

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-8 text-center">
              <div className={cn(
                "mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full",
                passed ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary",
              )}>
                <Trophy className="h-10 w-10" />
              </div>
              <h2 className="font-heading text-3xl font-bold">
                {pct}%{passed && " 🎉"}
              </h2>
              <p className="mt-1 text-muted-foreground">
                You scored {score} out of {questions.length} correct
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button onClick={retry} variant="outline" className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Retry Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Review answers */}
        <div className="space-y-3">
          <h3 className="font-heading text-lg font-semibold">Review</h3>
          {questions.map((q, i) => {
            const userAns = answers[i];
            const correct = userAns === q.correct_index;
            return (
              <Card key={i} className={cn("border-l-4", correct ? "border-l-accent" : "border-l-destructive")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                      correct ? "bg-accent" : "bg-destructive",
                    )}>
                      {correct ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{q.question}</p>
                      <p className="mt-1 text-xs text-accent">
                        Correct: {q.options[q.correct_index]}
                      </p>
                      {!correct && userAns !== null && (
                        <p className="text-xs text-destructive">
                          Your answer: {q.options[userAns]}
                        </p>
                      )}
                      {q.explanation && (
                        <p className="mt-1 text-xs text-muted-foreground">{q.explanation}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Question {currentIdx + 1} of {questions.length}
        </span>
        <Badge variant="secondary">
          Score: {answers.reduce((acc: number, ans, i) => acc + (ans === questions[i].correct_index ? 1 : 0), 0)}
        </Badge>
      </div>
      <Progress value={((currentIdx + 1) / questions.length) * 100} />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <h3 className="font-heading text-xl font-semibold">{question.question}</h3>
              <div className="mt-4 space-y-2">
                {question.options.map((option, idx) => {
                  const isSelected = selectedIdx === idx;
                  const showCorrect = isAnswered && idx === question.correct_index;
                  const showWrong = isAnswered && isSelected && idx !== question.correct_index;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      disabled={isAnswered}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm transition-all",
                        !isAnswered && "hover:border-primary/50 hover:bg-primary/5",
                        showCorrect && "border-accent bg-accent/10 text-accent",
                        showWrong && "border-destructive bg-destructive/10 text-destructive animate-shake",
                        isAnswered && !showCorrect && !showWrong && "opacity-50",
                      )}
                    >
                      <span className="font-medium">{option}</span>
                      {showCorrect && <Check className="h-5 w-5 shrink-0" />}
                      {showWrong && <X className="h-5 w-5 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4"
                >
                  <div className={cn(
                    "rounded-xl p-3 text-sm",
                    isCorrect ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive",
                  )}>
                    <p className="font-medium">
                      {isCorrect ? "Correct!" : "Not quite."}
                    </p>
                    {question.explanation && (
                      <p className="mt-1 text-muted-foreground">{question.explanation}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={currentIdx === 0}
                  className="gap-1.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!isAnswered || saving}
                  className="gap-1.5"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {currentIdx === questions.length - 1 ? "Finish" : "Next"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
