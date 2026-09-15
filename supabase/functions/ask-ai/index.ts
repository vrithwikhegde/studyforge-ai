import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .replace(/([.!?])\s+/g, "$1\n")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by","from","is",
  "are","was","were","be","been","being","have","has","had","do","does","did","will","would",
  "could","should","may","might","must","can","this","that","these","those","it","its","as",
  "if","then","than","so","not","no","yes","also","such","which","who","what","when","where",
  "why","how","all","any","each","few","more","most","other","some","only","own","same","very",
  "just","about","into","through","during","before","after","above","below","up","down","out",
  "off","over","under","again","further","here","there","both","am","i","you","he","she","we",
  "they","me","him","her","us","them","my","your","his","hers","our","their",
]);

function findRelevantSentences(rawText: string, question: string, max: number = 5): string[] {
  const sentences = splitSentences(rawText);
  const questionTokens = new Set(tokenize(question).filter((t) => !STOP_WORDS.has(t)));

  if (questionTokens.size === 0) return sentences.slice(0, max);

  const scored = sentences.map((s) => {
    const tokens = tokenize(s);
    let score = 0;
    for (const t of tokens) {
      if (questionTokens.has(t)) score += 1;
    }
    // Boost sentences with definition patterns
    if (s.match(/\b(is|are|means|refers to|defined as)\b/i)) score += 0.5;
    return { sentence: s, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((s) => s.sentence);
}

function generateAnswer(rawText: string, question: string): string {
  const relevant = findRelevantSentences(rawText, question, 5);

  if (relevant.length === 0) {
    return "I couldn't find information directly related to your question in this document. Try rephrasing your question using terms that appear in the material.";
  }

  // Build a contextual answer
  const qLower = question.toLowerCase();

  // Check for definition-type questions
  if (qLower.match(/what is|what are|define|explain|describe|what does/)) {
    const defSentences = relevant.filter((s) =>
      s.match(/\b(is|are|means|refers to|defined as|describes)\b/i)
    );
    if (defSentences.length > 0) {
      return defSentences.slice(0, 3).join(" ");
    }
  }

  // Check for "why" questions
  if (qLower.startsWith("why") || qLower.includes("reason")) {
    const causalSentences = relevant.filter((s) =>
      s.match(/\b(because|since|therefore|due to|causes|results in|leads to|consequently)\b/i)
    );
    if (causalSentences.length > 0) {
      return causalSentences.slice(0, 3).join(" ");
    }
  }

  // Check for "how" questions
  if (qLower.startsWith("how")) {
    const processSentences = relevant.filter((s) =>
      s.match(/\b(by|through|via|using|process|step|first|then|next|finally)\b/i)
    );
    if (processSentences.length > 0) {
      return processSentences.slice(0, 4).join(" ");
    }
  }

  // Default: return most relevant sentences
  return relevant.slice(0, 3).join(" ");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { document_id, question } = await req.json();

    if (!document_id || !question) {
      return new Response(JSON.stringify({ error: "document_id and question are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: doc, error } = await supabase
      .from("documents")
      .select("raw_text, title")
      .eq("id", document_id)
      .maybeSingle();

    if (error || !doc) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const answer = generateAnswer(doc.raw_text, question);

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
