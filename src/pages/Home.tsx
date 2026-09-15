import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Brain,
  FileText,
  GraduationCap,
  Layers,
  Loader2,
  Sparkles,
  TrendingUp,
  Upload,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchDocuments } from "@/lib/api";
import type { Document } from "@/types";

export function Home() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments()
      .then(setDocuments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-12 text-center">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-transparent to-transparent dark:from-indigo-950/30" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <Badge variant="secondary" className="mb-4 gap-1.5">
            <Sparkles className="h-3 w-3" />
            AI-Powered Study Tool
          </Badge>
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Turn any notes into
            <br />
            <span className="gradient-text">quizzes, flashcards & explanations</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Upload a PDF or paste your lecture notes. StudyForge AI instantly generates
            interactive quizzes, flashcard decks, and plain-language explanations to help
            you ace your exams.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 text-base hover:opacity-90"
              onClick={() => navigate("/upload")}
            >
              <Upload className="h-5 w-5" />
              Upload Your Notes
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 gap-2 rounded-xl px-8 text-base"
              onClick={() => navigate("/dashboard")}
            >
              <TrendingUp className="h-5 w-5" />
              View Progress
            </Button>
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Upload, title: "1. Upload", desc: "Drop a PDF or paste your lecture notes into the text box." },
            { icon: Zap, title: "2. Generate", desc: "StudyForge instantly creates a quiz, flashcards, and a simplified explanation." },
            { icon: GraduationCap, title: "3. Study", desc: "Take the quiz, flip flashcards, read the summary, and track your progress." },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="h-full card-hover">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Document Library */}
      <section className="py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold">Your Study Library</h2>
          {documents.length > 0 && (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate("/upload")}>
              <Upload className="h-4 w-4" />
              Add New
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-heading text-lg font-semibold">No documents yet</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Upload your first set of notes and StudyForge will turn them into a complete study kit.
              </p>
              <Button className="mt-4 gap-2" onClick={() => navigate("/upload")}>
                <Upload className="h-4 w-4" />
                Upload Your First Notes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link to={`/document/${doc.id}`}>
                  <Card className="h-full card-hover cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <Badge variant="secondary" className="shrink-0">{doc.tag}</Badge>
                      </div>
                      <CardTitle className="mt-3 line-clamp-2 text-base">{doc.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-sm font-medium text-primary">
                        Open study kit
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Features banner */}
      <section className="py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Brain, title: "Smart Quizzes", desc: "Multiple-choice questions with instant feedback" },
            { icon: Layers, title: "Flashcards", desc: "Flip-card studying with known/learning tracking" },
            { icon: FileText, title: "Simplified Notes", desc: "Plain-language explanations of tough concepts" },
            { icon: TrendingUp, title: "Progress Tracking", desc: "Charts, streaks, and mastery scores" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">{f.title}</h4>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
