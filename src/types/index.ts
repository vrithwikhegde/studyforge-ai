export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
  status: "known" | "learning";
}

export interface Document {
  id: string;
  title: string;
  tag: string;
  raw_text: string;
  difficulty: "easy" | "medium" | "hard";
  created_at: string;
}

export interface Quiz {
  id: string;
  document_id: string;
  questions: QuizQuestion[];
  created_at: string;
}

export interface FlashcardSet {
  id: string;
  document_id: string;
  cards: Flashcard[];
  created_at: string;
}

export interface Explanation {
  id: string;
  document_id: string;
  simplified_text: string;
  level: "eli5" | "standard" | "professor";
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  document_id: string;
  score: number;
  total_questions: number;
  attempted_at: string;
}

export interface DocumentWithDetails extends Document {
  quizzes?: Quiz[];
  flashcards?: FlashcardSet[];
  explanations?: Explanation[];
  quiz_attempts?: QuizAttempt[];
}

export type Difficulty = "easy" | "medium" | "hard";
export type ExplanationLevel = "eli5" | "standard" | "professor";
