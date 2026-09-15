import { useState } from "react";
import { motion } from "framer-motion";
import { Baby, GraduationCap, Loader2, RefreshCw, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { regenerateSection } from "@/lib/api";
import type { ExplanationLevel } from "@/types";
import { cn } from "@/lib/utils";

interface ExplanationViewProps {
  doc: {
    id: string;
    explanation: { id: string; simplified_text: string; level: string } | null;
  };
}

const LEVELS: { value: ExplanationLevel; label: string; icon: typeof Baby }[] = [
  { value: "eli5", label: "ELI5", icon: Baby },
  { value: "standard", label: "Standard", icon: User },
  { value: "professor", label: "Professor", icon: GraduationCap },
];

export function ExplanationView({ doc }: ExplanationViewProps) {
  const [text, setText] = useState(doc.explanation?.simplified_text || "");
  const [level, setLevel] = useState<ExplanationLevel>((doc.explanation?.level as ExplanationLevel) || "standard");
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async (newLevel: ExplanationLevel) => {
    setRegenerating(true);
    try {
      const result = await regenerateSection(doc.id, "explanation", { level: newLevel });
      if (result.explanation) {
        setText(result.explanation.simplified_text);
        setLevel(newLevel);
      }
    } catch {
    } finally {
      setRegenerating(false);
    }
  };

  // Bold key terms in text
  const renderText = (content: string) => {
    return content.split("\n").map((paragraph, i) => {
      if (paragraph.trim().length === 0) return <div key={i} className="h-4" />;
      return (
        <p key={i} className="mb-4 leading-relaxed">
          {paragraph}
        </p>
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* Level toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => handleRegenerate(l.value)}
              disabled={regenerating}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                level === l.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <l.icon className="h-3.5 w-3.5" />
              {l.label}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRegenerate(level)}
          disabled={regenerating}
          className="gap-1.5"
        >
          {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Regenerate
        </Button>
      </div>

      {/* Explanation content */}
      <motion.div
        key={text}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="p-6 sm:p-8">
            {regenerating ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${100 - i * 10}%` }} />
                ))}
              </div>
            ) : (
              <div className="text-base">
                {renderText(text)}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
