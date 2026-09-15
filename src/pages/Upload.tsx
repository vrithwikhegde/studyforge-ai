import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertCircle,
  FileText,
  Loader2,
  Upload as UploadIcon,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { extractPdfText } from "@/lib/pdf";
import { generateStudyKit } from "@/lib/api";
import type { Difficulty } from "@/types";
import { cn } from "@/lib/utils";

const LOADING_MESSAGES = [
  "Reading document...",
  "Analyzing key concepts...",
  "Generating quiz questions...",
  "Creating flashcards...",
  "Writing simplified explanation...",
];

export function Upload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"pdf" | "text">("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Please select a PDF file");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleSubmit = async () => {
    setError(null);
    let rawText = "";

    try {
      if (mode === "pdf") {
        if (!file) {
          setError("Please select a PDF file");
          return;
        }
        setLoading(true);
        rawText = await extractPdfText(file);
        if (rawText.trim().length < 50) {
          setError("Could not extract enough text from this PDF. Try pasting the text manually.");
          setLoading(false);
          return;
        }
      } else {
        if (text.trim().length < 50) {
          setError("Please paste at least 50 characters of text");
          return;
        }
        rawText = text.trim();
        setLoading(true);
      }

      // Animate loading messages
      let step = 0;
      setLoadingStep(0);
      const interval = setInterval(() => {
        step = Math.min(step + 1, LOADING_MESSAGES.length - 1);
        setLoadingStep(step);
      }, 1500);

      const result = await generateStudyKit(rawText, difficulty);
      clearInterval(interval);

      if (result.document) {
        navigate(`/document/${result.document.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg"
        >
          <Zap className="h-10 w-10" />
        </motion.div>
        <h2 className="font-heading text-2xl font-bold">Generating Your Study Kit</h2>
        <p className="mt-2 text-muted-foreground">This usually takes a few seconds...</p>
        <div className="mt-8 w-full max-w-md space-y-3">
          {LOADING_MESSAGES.map((msg, i) => (
            <motion.div
              key={msg}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: i <= loadingStep ? 1 : 0.3, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3"
            >
              {i < loadingStep ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : i === loadingStep ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <div className="h-6 w-6 rounded-full border-2 border-muted" />
              )}
              <span className={cn("text-sm", i <= loadingStep ? "text-foreground" : "text-muted-foreground")}>
                {msg}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-3xl font-bold">Upload Your Study Material</h1>
        <p className="mt-2 text-muted-foreground">
          Upload a PDF or paste your notes. StudyForge will generate a complete study kit instantly.
        </p>
      </motion.div>

      {/* Mode toggle */}
      <div className="mt-8 flex gap-1 rounded-xl bg-muted p-1">
        <button
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
            mode === "pdf" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
          onClick={() => setMode("pdf")}
        >
          <FileText className="h-4 w-4" />
          Upload PDF
        </button>
        <button
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
            mode === "text" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
          onClick={() => setMode("text")}
        >
          <UploadIcon className="h-4 w-4" />
          Paste Text
        </button>
      </div>

      <Card className="mt-4">
        <CardContent className="p-6">
          {mode === "pdf" ? (
            <div>
              {file ? (
                <div className="flex items-center justify-between rounded-xl border bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 transition-colors",
                    dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                  )}
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                    <UploadIcon className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Drop your PDF here or click to browse</p>
                  <p className="mt-1 text-xs text-muted-foreground">PDF files only, up to 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your lecture notes, textbook excerpts, or any study material here..."
                className="min-h-[200px] w-full resize-none rounded-xl border bg-background p-4 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="mt-2 text-right text-xs text-muted-foreground">
                {text.length} characters
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Difficulty selector */}
      <div className="mt-6">
        <label className="mb-3 block text-sm font-medium">Difficulty Level</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: "easy", label: "Easy", desc: "5 questions" },
            { value: "medium", label: "Medium", desc: "7 questions" },
            { value: "hard", label: "Hard", desc: "10 questions" },
          ] as const).map((d) => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              className={cn(
                "rounded-xl border p-3 text-center transition-all",
                difficulty === d.value
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50",
              )}
            >
              <div className="text-sm font-semibold">{d.label}</div>
              <div className="text-xs text-muted-foreground">{d.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        size="lg"
        className="mt-6 w-full gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90"
        onClick={handleSubmit}
        disabled={loading || (mode === "pdf" ? !file : text.trim().length < 50)}
      >
        <Zap className="h-5 w-5" />
        Generate Study Kit
      </Button>
    </div>
  );
}
