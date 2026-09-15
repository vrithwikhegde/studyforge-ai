import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

interface Flashcard {
  front: string;
  back: string;
  status: "known" | "learning";
}

interface StudyKit {
  title: string;
  tag: string;
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
  explanation: string;
}

// ===== TEXT ANALYSIS ENGINE =====

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by","from","is",
  "are","was","were","be","been","being","have","has","had","do","does","did","will","would",
  "could","should","may","might","must","can","this","that","these","those","it","its","as",
  "if","then","than","so","not","no","yes","also","such","which","who","whom","whose",
  "what","when","where","why","how","all","any","each","few","more","most","other","some",
  "only","own","same","very","just","because","about","into","through","during","before",
  "after","above","below","up","down","out","off","over","under","again","further","here",
  "there","both","am","i","you","he","she","we","they","me","him","her","us","them","my",
  "your","his","hers","our","their","mine","yours","ours","theirs","myself","yourself",
  "himself","herself","itself","ourselves","themselves","one","two","three","first",
  "second","third","new","old","good","bad","big","small","great","well","even","still",
  "now","get","got","make","made","like","go","going","went","come","came","take","took",
  "see","saw","know","knew","think","thought","say","said","tell","told","give","gave",
  "find","found","call","called","want","need","try","tried","use","used","work","worked",
  "look","looked","feel","felt","become","became","leave","left","put","mean","meant",
  "keep","kept","let","begin","began","seem","seemed","help","helped","show","showed",
  "run","play","move","live","believe","hold","bring","happen","write","sit","stand",
  "lose","pay","meet","include","continue","set","learn","change","lead","understand",
  "watch","follow","stop","create","speak","read","allow","add","spend","grow","open",
  "walk","win","offer","remember","love","consider","appear","buy","wait","serve","die",
  "send","expect","build","stay","fall","cut","reach","remain","suggest","raise","pass",
  "sell","require","report","decide","pull","upon","per","between","against","without",
  "within","along","among","behind","beside","beyond","around","toward","towards","until",
  "while","whether","though","although","unless","since","once","often","able","very",
  "many","much","lot","lots","kind","sort","way","ways","thing","things","time","times",
  "place","places","part","parts","case","cases","number","numbers","point","points",
  "fact","facts","reason","reasons","result","results","side","sides","end","ends",
  "area","line","lines","word","words","example","examples","level","levels","form",
  "forms","type","types","group","groups","process","processes","system","systems",
  "method","methods","problem","problems","question","questions","idea","ideas",
  "information","data","research","study","studies","theory","theories","model","models",
  "approach","approaches","field","fields","subject","subjects","topic","topics",
  "term","terms","concept","concepts","structure","structures","function","functions",
  "value","values","role","roles","effect","effects","cause","causes","difference",
  "differences","relationship","relationships","pattern","patterns","feature","features",
]);

function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .replace(/([.!?])\s+/g, "$1\n")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 30 && s.length < 500)
    .filter((s) => /[a-zA-Z]/.test(s));
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function extractKeyTerms(text: string, max: number): { term: string; freq: number }[] {
  const tokens = tokenize(text);
  const freq = new Map<string, number>();
  for (const t of tokens) {
    freq.set(t, (freq.get(t) || 0) + 1);
  }

  // Also extract capitalized phrases (proper nouns / technical terms)
  const phrases = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  for (const p of phrases) {
    const pl = p.toLowerCase();
    freq.set(pl, (freq.get(pl) || 0) + 3); // boost proper nouns
  }

  // Extract "X is/are Y" definition patterns
  const defPatterns = text.match(/\b([A-Z][a-z]+(?:\s+[a-z]+)?)\s+(?:is|are|refers to|means|describes)\s+([^.]{10,80})/g) || [];
  for (const d of defPatterns) {
    const term = d.split(/\s+(?:is|are|refers to|means|describes)\s+/)[0].toLowerCase();
    if (term.length > 3) freq.set(term, (freq.get(term) || 0) + 5);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([term, f]) => ({ term, freq: f }));
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function detectTag(text: string, title: string): string {
  const lower = (text + " " + title).toLowerCase();
  const tags: { tag: string; keywords: string[] }[] = [
    { tag: "Biology", keywords: ["cell", "dna", "protein", "organism", "gene", "enzyme", "photosynthesis", "mitosis", "evolution", "ecosystem", "species", "bacteria", "virus"] },
    { tag: "Physics", keywords: ["force", "velocity", "acceleration", "energy", "momentum", "gravity", "newton", "quantum", "relativity", "wave", "particle", "electric", "magnetic"] },
    { tag: "Chemistry", keywords: ["molecule", "atom", "reaction", "compound", "element", "acid", "base", "bond", "ion", "oxidation", "reduction", "catalyst"] },
    { tag: "Mathematics", keywords: ["equation", "function", "derivative", "integral", "matrix", "theorem", "algebra", "geometry", "calculus", "probability", "vector"] },
    { tag: "History", keywords: ["war", "revolution", "empire", "king", "queen", "ancient", "century", "dynasty", "treaty", "independence", "colonial", "medieval"] },
    { tag: "Computer Science", keywords: ["algorithm", "programming", "software", "database", "network", "code", "compiler", "data structure", "machine learning", "artificial intelligence", "computer"] },
    { tag: "Economics", keywords: ["market", "supply", "demand", "inflation", "gdp", "trade", "currency", "fiscal", "monetary", "investment", "consumer"] },
    { tag: "Psychology", keywords: ["behavior", "cognitive", "memory", "perception", "emotion", "consciousness", "learning", "development", "personality", "therapy"] },
    { tag: "Literature", keywords: ["novel", "poem", "author", "narrative", "character", "metaphor", "theme", "symbolism", "prose", "verse"] },
    { tag: "Medicine", keywords: ["disease", "patient", "treatment", "diagnosis", "symptom", "clinical", "therapy", "anatomy", "physiology", "pharmacology"] },
  ];

  let best = "General";
  let bestScore = 0;
  for (const t of tags) {
    let score = 0;
    for (const kw of t.keywords) {
      if (lower.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = t.tag;
    }
  }
  return best;
}

function generateTitle(text: string): string {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return "Untitled Document";

  // Try to find a title-like first sentence
  const first = sentences[0];
  const short = first.length < 80 ? first : first.substring(0, 70).trim() + "...";

  // Check if first sentence looks like a title (short, no period at end in original)
  if (first.length < 60 && !first.endsWith(".")) {
    return titleCase(first);
  }

  // Use key terms
  const terms = extractKeyTerms(text, 3);
  if (terms.length >= 2) {
    return titleCase(terms[0].term) + " & " + titleCase(terms[1].term);
  }

  return short.length > 60 ? short.substring(0, 60) + "..." : short;
}

// ===== QUIZ GENERATION =====

function generateQuiz(text: string, difficulty: string): QuizQuestion[] {
  const sentences = splitSentences(text);
  const questions: QuizQuestion[] = [];
  const terms = extractKeyTerms(text, 30);
  const termSet = new Set(terms.map((t) => t.term));

  // Strategy 1: Definition-based questions
  const defRegex = /\b([A-Za-z][a-z]+(?:\s+[a-z]+)?)\s+(?:is|are|refers to|means|describes|is defined as|is called)\s+([^.]{10,120})/gi;
  let match;
  const definitions: { term: string; definition: string; sentence: string }[] = [];
  for (const s of sentences) {
    defRegex.lastIndex = 0;
    while ((match = defRegex.exec(s)) !== null) {
      const term = match[1].trim();
      const def = match[2].trim().replace(/,$/, "");
      if (term.length > 3 && def.length > 10 && !STOP_WORDS.has(term.toLowerCase())) {
        definitions.push({ term, definition: def, sentence: s });
      }
    }
  }

  // Strategy 2: Key term cloze questions
  const clozeSentences = sentences.filter((s) => {
    const tokens = tokenize(s);
    return tokens.filter((t) => termSet.has(t)).length >= 1 && s.length > 40;
  });

  // Strategy 3: True/False style (concept verification)
  const conceptSentences = sentences.filter((s) =>
    s.includes("because") || s.includes("therefore") || s.includes("since") ||
    s.includes("due to") || s.includes("results in") || s.includes("causes") ||
    s.includes("leads to") || s.includes("produces") || s.includes("requires")
  );

  const numQuestions = difficulty === "easy" ? 5 : difficulty === "hard" ? 10 : 7;

  // Generate definition questions
  for (const def of definitions) {
    if (questions.length >= numQuestions) break;
    const distractors = terms
      .filter((t) => t.term !== def.term.toLowerCase())
      .map((t) => t.term)
      .slice(0, 3);

    if (distractors.length < 3) continue;

    const correct = def.definition;
    const allOptions = shuffle([correct, ...distractors.map((d) => {
      // Try to make distractor definitions by swapping
      const otherDefs = definitions.filter((od) => od.term.toLowerCase() !== d && od.term.toLowerCase() !== def.term.toLowerCase());
      if (otherDefs.length > 0) return otherDefs[Math.floor(Math.random() * otherDefs.length)].definition;
      return `A concept related to ${d}`;
    })]);

    const correctIdx = allOptions.indexOf(correct);
    questions.push({
      question: `Which of the following best describes "${def.term}"?`,
      options: allOptions.map((o) => o.length > 80 ? o.substring(0, 77) + "..." : o),
      correct_index: correctIdx,
      explanation: `"${def.term}" ${def.sentence.toLowerCase().includes(def.term.toLowerCase() + " is") ? "is" : "is defined as"} ${def.definition}`,
    });
  }

  // Generate cloze (fill-in-the-blank) questions
  for (const s of clozeSentences) {
    if (questions.length >= numQuestions) break;
    const tokens = tokenize(s);
    const keyTerm = tokens.find((t) => termSet.has(t));
    if (!keyTerm) continue;

    // Check if the term appears in the original sentence
    const termRegex = new RegExp(`\\b${keyTerm}\\b`, "i");
    if (!termRegex.test(s)) continue;

    const blanked = s.replace(termRegex, "_____");
    const distractors = terms
      .filter((t) => t.term !== keyTerm)
      .map((t) => t.term)
      .slice(0, 3)
      .map((t) => titleCase(t));

    if (distractors.length < 3) continue;

    const allOptions = shuffle([titleCase(keyTerm), ...distractors]);
    const correctIdx = allOptions.indexOf(titleCase(keyTerm));

    questions.push({
      question: `Fill in the blank: ${blanked}`,
      options: allOptions,
      correct_index: correctIdx,
      explanation: `The correct term is "${titleCase(keyTerm)}" based on the context of the passage.`,
    });
  }

  // Generate concept questions from cause/effect sentences
  for (const s of conceptSentences) {
    if (questions.length >= numQuestions) break;

    // Create a "Which statement is true?" question
    const distractors: string[] = [];
    const otherSentences = shuffle(sentences.filter((x) => x !== s)).slice(0, 3);
    for (const os of otherSentences) {
      // Negate or modify the sentence to create a false statement
      if (os.includes(" is ")) {
        distractors.push(os.replace(/ is /, " is not "));
      } else if (os.includes(" are ")) {
        distractors.push(os.replace(/ are /, " are not "));
      } else if (os.includes(" causes ")) {
        distractors.push(os.replace(/ causes /, " prevents "));
      } else {
        // Use a different sentence as a wrong answer
        const tokens = tokenize(os);
        if (tokens.length > 0) {
          distractors.push(os.replace(new RegExp(`\\b${tokens[0]}\\b`, "i"), "Never"));
        }
      }
    }

    if (distractors.length < 3) continue;
    const truncated = s.length > 120 ? s.substring(0, 117) + "..." : s;
    const allOptions = shuffle([truncated, ...distractors.map((d) => d.length > 120 ? d.substring(0, 117) + "..." : d)]);
    const correctIdx = allOptions.indexOf(truncated);

    questions.push({
      question: "Which of the following statements is true according to the material?",
      options: allOptions,
      correct_index: correctIdx,
      explanation: truncated,
    });
  }

  // If we still need more questions, generate "What is the main topic?" style
  if (questions.length < numQuestions) {
    const topTerms = terms.slice(0, 5).map((t) => titleCase(t.term));
    if (topTerms.length >= 4) {
      questions.push({
        question: "What is the main subject of this material?",
        options: shuffle([topTerms[0], topTerms[1], topTerms[2], topTerms[3]]),
        correct_index: 0,
        explanation: `The material primarily discusses ${topTerms[0].toLowerCase()} and related concepts.`,
      });
    }
  }

  // Ensure we have at least some questions
  if (questions.length === 0 && sentences.length > 0) {
    const s = sentences[0];
    const words = s.split(/\s+/);
    const keyWord = words.find((w) => w.length > 5 && !STOP_WORDS.has(w.toLowerCase()));
    if (keyWord) {
      questions.push({
        question: `What is discussed in this material?`,
        options: shuffle([keyWord, "Nothing relevant", "Unknown topic", "Data analysis"]),
        correct_index: 0,
        explanation: `The material discusses ${keyWord.toLowerCase()}.`,
      });
    }
  }

  return questions.slice(0, numQuestions);
}

// ===== FLASHCARD GENERATION =====

function generateFlashcards(text: string): Flashcard[] {
  const cards: Flashcard[] = [];
  const sentences = splitSentences(text);
  const terms = extractKeyTerms(text, 20);

  // Strategy 1: Definition-based cards
  const defRegex = /\b([A-Za-z][a-z]+(?:\s+[a-z]+)?)\s+(?:is|are|refers to|means|describes|is defined as|is called)\s+([^.]{10,120})/gi;
  let match;
  const seen = new Set<string>();

  for (const s of sentences) {
    defRegex.lastIndex = 0;
    while ((match = defRegex.exec(s)) !== null && cards.length < 12) {
      const term = match[1].trim();
      const def = match[2].trim().replace(/,$/, "");
      const key = term.toLowerCase();
      if (term.length > 3 && def.length > 10 && !seen.has(key) && !STOP_WORDS.has(key)) {
        seen.add(key);
        cards.push({
          front: `What is ${term}?`,
          back: def,
          status: "learning",
        });
      }
    }
  }

  // Strategy 2: Key sentence cards (for terms not covered)
  for (const s of sentences) {
    if (cards.length >= 12) break;
    const tokens = tokenize(s);
    const keyTerm = tokens.find((t) => terms.some((tt) => tt.term === t));
    if (!keyTerm) continue;
    const key = `what_${keyTerm}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const termInfo = terms.find((t) => t.term === keyTerm);
    if (!termInfo) continue;

    // Create a question from the sentence
    const cleanSentence = s.replace(/^[A-Z][a-z]+\s+(is|are)\s+/i, "");
    cards.push({
      front: `Explain: ${titleCase(keyTerm)}`,
      back: s.length > 200 ? s.substring(0, 197) + "..." : s,
      status: "learning",
    });
  }

  // Strategy 3: Summary cards for remaining
  if (cards.length < 8 && sentences.length > 0) {
    const important = sentences
      .filter((s) => s.length > 50 && s.length < 200)
      .slice(0, 12 - cards.length);
    for (const s of important) {
      if (cards.length >= 12) break;
      const words = s.split(/\s+/);
      const firstWord = words[0];
      cards.push({
        front: `Key point: ${firstWord}...`,
        back: s,
        status: "learning",
      });
    }
  }

  return cards.slice(0, 12);
}

// ===== EXPLANATION GENERATION =====

function generateExplanation(text: string, level: string): string {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return text.substring(0, 500);

  // Score sentences by importance (position + keyword density)
  const terms = extractKeyTerms(text, 20);
  const termSet = new Set(terms.map((t) => t.term));
  const scored = sentences.map((s, i) => {
    const tokens = tokenize(s);
    let score = 0;
    for (const t of tokens) if (termSet.has(t)) score += 1;
    // Boost early sentences and longer ones
    score += Math.max(0, 3 - i) * 0.5;
    score += Math.min(s.length / 100, 2);
    return { sentence: s, score, index: i };
  });

  // Select top sentences for summary
  const numSentences = level === "eli5" ? 4 : level === "professor" ? 8 : 6;
  const selected = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, numSentences)
    .sort((a, b) => a.index - b.index)
    .map((s) => s.sentence);

  let summary = selected.join(" ");

  // Adjust language based on level
  if (level === "eli5") {
    summary = simplifyLanguage(summary);
  } else if (level === "professor") {
    summary = formalizeLanguage(summary);
  }

  return summary;
}

function simplifyLanguage(text: string): string {
  return text
    .replace(/utilize/gi, "use")
    .replace(/demonstrate/gi, "show")
    .replace(/subsequently/gi, "then")
    .replace(/approximately/gi, "about")
    .replace(/sufficient/gi, "enough")
    .replace(/numerous/gi, "many")
    .replace(/facilitate/gi, "help")
    .replace(/fundamental/gi, "basic")
    .replace(/comprise/gi, "make up")
    .replace(/additionally/gi, "also")
    .replace(/furthermore/gi, "also")
    .replace(/consequently/gi, "so")
    .replace(/nevertheless/gi, "but")
    .replace(/therefore/gi, "so");
}

function formalizeLanguage(text: string): string {
  return text
    .replace(/\buse\b/gi, "utilize")
    .replace(/\bshow\b/gi, "demonstrate")
    .replace(/\bthen\b/gi, "subsequently")
    .replace(/\babout\b/gi, "approximately")
    .replace(/\benough\b/gi, "sufficient")
    .replace(/\bmany\b/gi, "numerous")
    .replace(/\bhelp\b/gi, "facilitate")
    .replace(/\bbasic\b/gi, "fundamental");
}

// ===== MAIN HANDLER =====

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { raw_text, difficulty = "medium", title: providedTitle, regenerate, document_id, section, level } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Regenerate mode: only regenerate a specific section
    if (regenerate && document_id) {
      const { data: doc } = await supabase
        .from("documents")
        .select("raw_text, difficulty")
        .eq("id", document_id)
        .maybeSingle();

      if (!doc) {
        return new Response(JSON.stringify({ error: "Document not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (section === "quiz") {
        const questions = generateQuiz(doc.raw_text, difficulty);
        const { data, error } = await supabase
          .from("quizzes")
          .update({ questions })
          .eq("document_id", document_id)
          .select()
          .maybeSingle();
        if (error) throw error;
        return new Response(JSON.stringify({ quiz: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (section === "flashcards") {
        const cards = generateFlashcards(doc.raw_text);
        const { data, error } = await supabase
          .from("flashcards")
          .update({ cards })
          .eq("document_id", document_id)
          .select()
          .maybeSingle();
        if (error) throw error;
        return new Response(JSON.stringify({ flashcards: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (section === "explanation") {
        const simplified_text = generateExplanation(doc.raw_text, level || "standard");
        const { data, error } = await supabase
          .from("explanations")
          .update({ simplified_text, level: level || "standard" })
          .eq("document_id", document_id)
          .select()
          .maybeSingle();
        if (error) throw error;
        return new Response(JSON.stringify({ explanation: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Full generation mode
    if (!raw_text || raw_text.trim().length < 50) {
      return new Response(JSON.stringify({ error: "Text must be at least 50 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const title = providedTitle || generateTitle(raw_text);
    const tag = detectTag(raw_text, title);
    const quiz = generateQuiz(raw_text, difficulty);
    const flashcards = generateFlashcards(raw_text);
    const explanation = generateExplanation(raw_text, "standard");

    // Insert document
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({ title, tag, raw_text, difficulty })
      .select()
      .maybeSingle();

    if (docError || !doc) {
      throw new Error(docError?.message || "Failed to create document");
    }

    // Insert quiz
    await supabase.from("quizzes").insert({
      document_id: doc.id,
      questions: quiz,
    });

    // Insert flashcards
    await supabase.from("flashcards").insert({
      document_id: doc.id,
      cards: flashcards,
    });

    // Insert explanation
    await supabase.from("explanations").insert({
      document_id: doc.id,
      simplified_text: explanation,
      level: "standard",
    });

    return new Response(JSON.stringify({
      document: doc,
      quiz,
      flashcards,
      explanation,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
