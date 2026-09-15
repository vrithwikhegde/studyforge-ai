import { supabase } from "./supabase";
import type {
  Document,
  Quiz,
  FlashcardSet,
  Explanation,
  QuizAttempt,
  Difficulty,
  ExplanationLevel,
  QuizQuestion,
  Flashcard,
} from "@/types";

const FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL;

function getHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };
}

// ===== Documents =====

export async function fetchDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchDocument(id: string) {
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (docError) throw docError;
  if (!doc) return null;

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*")
    .eq("document_id", id)
    .maybeSingle();

  const { data: flashcards } = await supabase
    .from("flashcards")
    .select("*")
    .eq("document_id", id)
    .maybeSingle();

  const { data: explanation } = await supabase
    .from("explanations")
    .select("*")
    .eq("document_id", id)
    .maybeSingle();

  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("document_id", id)
    .order("attempted_at", { ascending: false });

  return {
    ...doc,
    quiz: quizzes,
    flashcards,
    explanation,
    attempts: attempts || [],
  };
}

export async function deleteDocument(id: string) {
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}

// ===== Generate Study Kit =====

export async function generateStudyKit(
  rawText: string,
  difficulty: Difficulty,
  title?: string,
) {
  const response = await fetch(`${FUNCTION_URL}/functions/v1/generate-study-kit`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ raw_text: rawText, difficulty, title }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Failed to generate study kit" }));
    throw new Error(err.error || "Failed to generate study kit");
  }

  return response.json();
}

// ===== Regenerate =====

export async function regenerateSection(
  documentId: string,
  section: "quiz" | "flashcards" | "explanation",
  options?: { difficulty?: Difficulty; level?: ExplanationLevel },
) {
  const response = await fetch(`${FUNCTION_URL}/functions/v1/generate-study-kit`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      regenerate: true,
      document_id: documentId,
      section,
      difficulty: options?.difficulty,
      level: options?.level,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Failed to regenerate" }));
    throw new Error(err.error || "Failed to regenerate");
  }

  return response.json();
}

// ===== Ask AI =====

export async function askAI(documentId: string, question: string): Promise<string> {
  const response = await fetch(`${FUNCTION_URL}/functions/v1/ask-ai`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ document_id: documentId, question }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Failed to get answer" }));
    throw new Error(err.error || "Failed to get answer");
  }

  const data = await response.json();
  return data.answer;
}

// ===== Quiz Attempts =====

export async function saveQuizAttempt(documentId: string, score: number, totalQuestions: number) {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .insert({ document_id: documentId, score, total_questions: totalQuestions })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAllAttempts(): Promise<QuizAttempt[]> {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("*")
    .order("attempted_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

// ===== Flashcards =====

export async function updateFlashcardStatus(
  flashcardSetId: string,
  cards: Flashcard[],
) {
  const { error } = await supabase
    .from("flashcards")
    .update({ cards })
    .eq("id", flashcardSetId);
  if (error) throw error;
}

// ===== Progress Data =====

export async function fetchProgressData() {
  const [documents, attempts, flashcardSets] = await Promise.all([
    fetchDocuments(),
    fetchAllAttempts(),
    supabase.from("flashcards").select("*"),
  ]);

  const fcData = flashcardSets.data || [];

  // Calculate flashcard mastery
  let totalKnown = 0;
  let totalLearning = 0;
  for (const fc of fcData) {
    for (const card of (fc.cards || []) as Flashcard[]) {
      if (card.status === "known") totalKnown++;
      else totalLearning++;
    }
  }

  // Calculate streak
  const studyDays = new Set<string>();
  for (const a of attempts) {
    studyDays.add(a.attempted_at.substring(0, 10));
  }
  const sortedDays = [...studyDays].sort().reverse();
  let streak = 0;
  if (sortedDays.length > 0) {
    const today = new Date();
    let checkDate = new Date(today);
    for (let i = 0; i < sortedDays.length; i++) {
      const dayStr = checkDate.toISOString().substring(0, 10);
      if (sortedDays.includes(dayStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Per-document mastery
  const docMastery = documents.map((doc) => {
    const docAttempts = attempts.filter((a) => a.document_id === doc.id);
    const fc = fcData.find((f) => f.document_id === doc.id);
    const cards = (fc?.cards || []) as Flashcard[];
    const known = cards.filter((c) => c.status === "known").length;
    const mastery = cards.length > 0 ? Math.round((known / cards.length) * 100) : 0;
    const avgScore = docAttempts.length > 0
      ? Math.round((docAttempts.reduce((s, a) => s + (a.score / a.total_questions) * 100, 0) / docAttempts.length))
      : 0;
    return { document: doc, mastery, avgScore, attemptCount: docAttempts.length };
  });

  return {
    attempts,
    documents,
    flashcardMastery: { known: totalKnown, learning: totalLearning },
    streak,
    docMastery,
  };
}
