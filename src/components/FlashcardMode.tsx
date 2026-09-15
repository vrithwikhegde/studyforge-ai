import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  RotateCcw,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { updateFlashcardStatus } from "@/lib/api";
import type { Flashcard } from "@/types";
import { cn } from "@/lib/utils";

interface FlashcardModeProps {
  doc: {
    id: string;
    flashcards: { id: string; cards: Flashcard[] } | null;
  };
}

export function FlashcardMode({ doc }: FlashcardModeProps) {
  const cards = doc.flashcards?.cards || [];
  const flashcardSetId = doc.flashcards?.id || "";
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [cardStates, setCardStates] = useState<Flashcard[]>(cards);
  const [narrating, setNarrating] = useState(false);

  const card = cardStates[currentIdx];

  const handleFlip = () => setFlipped(!flipped);

  const handleNav = (dir: "prev" | "next") => {
    setFlipped(false);
    if (dir === "prev" && currentIdx > 0) setCurrentIdx(currentIdx - 1);
    if (dir === "next" && currentIdx < cards.length - 1) setCurrentIdx(currentIdx + 1);
  };

  const handleStatus = (status: "known" | "learning") => {
    const newCards = [...cardStates];
    newCards[currentIdx] = { ...newCards[currentIdx], status };
    setCardStates(newCards);
    updateFlashcardStatus(flashcardSetId, newCards).catch(() => {});
  };

  const handleReset = () => {
    const reset = cardStates.map((c) => ({ ...c, status: "learning" as const }));
    setCardStates(reset);
    setCurrentIdx(0);
    setFlipped(false);
    updateFlashcardStatus(flashcardSetId, reset).catch(() => {});
  };

  const handleNarrate = () => {
    if (!("speechSynthesis" in window)) return;
    if (narrating) {
      window.speechSynthesis.cancel();
      setNarrating(false);
      return;
    }
    const text = flipped ? card.back : card.front;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setNarrating(false);
    setNarrating(true);
    window.speechSynthesis.speak(utterance);
  };

  const knownCount = cardStates.filter((c) => c.status === "known").length;

  if (!card) return null;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Card {currentIdx + 1} of {cards.length}
        </span>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-accent">{knownCount} known</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-destructive">{cards.length - knownCount} learning</span>
        </div>
      </div>
      <Progress value={((currentIdx + 1) / cards.length) * 100} />

      {/* Flashcard */}
      <div className="flex flex-col items-center">
        <div
          className="perspective-1000 w-full cursor-pointer"
          onClick={handleFlip}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, rotateY: 0 }}
              animate={{ opacity: 1, rotateY: flipped ? 180 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="preserve-3d relative min-h-[280px] w-full"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front */}
              <div
                className="backface-hidden absolute inset-0 flex items-center justify-center rounded-2xl border bg-card p-8 shadow-sm"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="text-center">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Question</p>
                  <p className="font-heading text-xl font-semibold">{card.front}</p>
                  <p className="mt-4 text-xs text-muted-foreground">Click to flip</p>
                </div>
              </div>
              {/* Back */}
              <div
                className="backface-hidden absolute inset-0 flex items-center justify-center rounded-2xl border bg-primary/5 p-8 shadow-sm"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <div className="text-center">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Answer</p>
                  <p className="text-lg leading-relaxed">{card.back}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Status badge */}
        {card.status === "known" && (
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-accent">
            <Check className="h-3 w-3" /> Marked as Known
          </div>
        )}
        {card.status === "learning" && (
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Flag className="h-3 w-3" /> Still Learning
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleNav("prev")}
          disabled={currentIdx === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNarrate}
          className="gap-1.5"
        >
          <Volume2 className={cn("h-4 w-4", narrating && "text-primary animate-pulse")} />
          {narrating ? "Stop" : "Listen"}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => handleNav("next")}
          disabled={currentIdx === cards.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Status buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 gap-2 border-accent/30 text-accent hover:bg-accent/10"
          onClick={() => handleStatus("known")}
        >
          <Check className="h-4 w-4" />
          Known
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={() => handleStatus("learning")}
        >
          <Flag className="h-4 w-4" />
          Still Learning
        </Button>
      </div>

      {/* Reset */}
      {knownCount > 0 && (
        <Button variant="ghost" size="sm" className="w-full gap-2" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" />
          Reset All Cards
        </Button>
      )}
    </div>
  );
}
