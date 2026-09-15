import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  Brain,
  Flame,
  Loader2,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchProgressData } from "@/lib/api";
import type { QuizAttempt, Document } from "@/types";

interface ProgressData {
  attempts: QuizAttempt[];
  documents: Document[];
  flashcardMastery: { known: number; learning: number };
  streak: number;
  docMastery: { document: Document; mastery: number; avgScore: number; attemptCount: number }[];
}

export function Dashboard() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || (data.attempts.length === 0 && data.documents.length === 0)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-muted">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="font-heading text-xl font-semibold">No progress data yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload some notes and take a quiz to start tracking your study progress.
        </p>
        <Button asChild className="mt-4">
          <Link to="/upload">Upload Your First Notes</Link>
        </Button>
      </div>
    );
  }

  // Prepare chart data
  const scoreData = data.attempts.map((a, i) => ({
    name: `Attempt ${i + 1}`,
    score: Math.round((a.score / a.total_questions) * 100),
    date: new Date(a.attempted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  const flashcardData = [
    { name: "Known", value: data.flashcardMastery.known, fill: "hsl(var(--accent))" },
    { name: "Learning", value: data.flashcardMastery.learning, fill: "hsl(var(--destructive))" },
  ];

  const totalAttempts = data.attempts.length;
  const avgScore = totalAttempts > 0
    ? Math.round(data.attempts.reduce((s, a) => s + (a.score / a.total_questions) * 100, 0) / totalAttempts)
    : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-3xl font-bold">Progress Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Track your study streak, quiz performance, and flashcard mastery.</p>
      </motion.div>

      {/* Stats cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                  <Flame className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-heading">{data.streak}</p>
                  <p className="text-xs text-muted-foreground">Day streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-heading">{avgScore}%</p>
                  <p className="text-xs text-muted-foreground">Avg quiz score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-heading">{totalAttempts}</p>
                  <p className="text-xs text-muted-foreground">Quizzes taken</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Score over time */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Quiz Scores Over Time</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {scoreData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">No quiz attempts yet</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Flashcard mastery */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                <CardTitle className="text-base">Flashcard Mastery</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {data.flashcardMastery.known + data.flashcardMastery.learning > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={flashcardData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {flashcardData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">No flashcards yet</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Document mastery list */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Document Mastery</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.docMastery.map((dm) => (
                <Link
                  key={dm.document.id}
                  to={`/document/${dm.document.id}`}
                  className="flex items-center justify-between rounded-xl border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{dm.document.title}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{dm.document.tag}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {dm.attemptCount} {dm.attemptCount === 1 ? "quiz" : "quizzes"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{dm.mastery}%</p>
                    <p className="text-xs text-muted-foreground">mastery</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
