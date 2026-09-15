import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  FileText,
  HelpCircle,
  Layers,
  Loader2,
  MessageCircle,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchDocument, deleteDocument } from "@/lib/api";
import type { Document, Quiz, FlashcardSet, Explanation, QuizAttempt } from "@/types";
import { QuizMode } from "@/components/QuizMode";
import { FlashcardMode } from "@/components/FlashcardMode";
import { ExplanationView } from "@/components/ExplanationView";
import { AskAI } from "@/components/AskAI";

interface DocData {
  id: string;
  title: string;
  tag: string;
  raw_text: string;
  difficulty: string;
  created_at: string;
  quiz: Quiz | null;
  flashcards: FlashcardSet | null;
  explanation: Explanation | null;
  attempts: QuizAttempt[];
}

export function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchDocument(id)
      .then((data) => setDoc(data as DocData | null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    if (confirm("Delete this document and all its study materials?")) {
      await deleteDocument(id);
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-muted-foreground">Document not found.</p>
        <Button asChild className="mt-4">
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Library
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{doc.tag}</Badge>
              <Badge variant="outline" className="capitalize">{doc.difficulty}</Badge>
            </div>
            <h1 className="mt-2 font-heading text-3xl font-bold">{doc.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {new Date(doc.created_at).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric",
              })}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDelete} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue="quiz" className="mt-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quiz" className="gap-1.5">
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Quiz</span>
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="gap-1.5">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Flashcards</span>
          </TabsTrigger>
          <TabsTrigger value="explanation" className="gap-1.5">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Explanation</span>
          </TabsTrigger>
          <TabsTrigger value="ask" className="gap-1.5">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quiz">
          {doc.quiz && doc.quiz.questions.length > 0 ? (
            <QuizMode doc={doc} />
          ) : (
            <EmptyTab icon={HelpCircle} label="No quiz available" />
          )}
        </TabsContent>

        <TabsContent value="flashcards">
          {doc.flashcards && doc.flashcards.cards.length > 0 ? (
            <FlashcardMode doc={doc} />
          ) : (
            <EmptyTab icon={Layers} label="No flashcards available" />
          )}
        </TabsContent>

        <TabsContent value="explanation">
          {doc.explanation ? (
            <ExplanationView doc={doc} />
          ) : (
            <EmptyTab icon={FileText} label="No explanation available" />
          )}
        </TabsContent>

        <TabsContent value="ask">
          <AskAI doc={doc} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyTab({ icon: Icon, label }: { icon: typeof Brain; label: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Icon className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
