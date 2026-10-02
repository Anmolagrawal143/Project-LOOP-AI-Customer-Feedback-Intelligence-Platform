import { FeedbackSentiment } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is missing from environment variables!");

const genAI = new GoogleGenerativeAI(apiKey);

const classificationSchema = z.object({
  sentiment: z.nativeEnum(FeedbackSentiment),
  themes: z.array(z.string().min(1)).max(8),
});

export type ClassificationResult = z.infer<typeof classificationSchema>;

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  return JSON.parse(candidate);
}

export async function classifyFeedback(
  rawText: string
): Promise<ClassificationResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.8-flash",
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });

  const prompt = `You are a feedback classification engine for a SaaS product analytics platform.

Analyze the following customer feedback and return ONLY a valid JSON object with this exact shape:
{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "themes": ["theme one", "theme two"]
}

Rules:
- sentiment must be exactly one of: POSITIVE, NEUTRAL, NEGATIVE
- themes must be a JSON array of 1 to 5 short, human-readable theme labels (2-4 words each)
- themes should capture recurring topics such as onboarding, performance, billing, feature requests, bugs, support, UX, integrations
- do not include markdown, explanations, or any keys other than sentiment and themes

Feedback:
"""
${rawText}
"""`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  const parsed = classificationSchema.safeParse(extractJson(responseText));
  if (!parsed.success) {
    throw new Error("Gemini returned an invalid classification payload.");
  }

  return parsed.data;
}

export type AskLoopContextItem = {
  id: string;
  content: string;
  sentiment: FeedbackSentiment;
  channel: string;
  createdAt: Date;
};

export async function askLoopQuestion(
  question: string,
  feedbackContext: AskLoopContextItem[]
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.3,
    },
  });

  const contextBlock =
    feedbackContext.length === 0
      ? "No feedback records are available."
      : feedbackContext
          .map(
            (item, index) =>
              `[${index + 1}] id=${item.id} | channel=${item.channel} | sentiment=${item.sentiment} | date=${item.createdAt.toISOString()}\n${item.content}`
          )
          .join("\n\n");

  const prompt = `You are LOOP, an AI assistant that answers questions about customer feedback for a single workspace.

Answer the user's question using ONLY the feedback records provided below.
If the answer is not supported by the provided feedback, say clearly that you do not have enough feedback data to answer confidently.
Do not invent feedback, metrics, or trends that are not grounded in the provided records.
When helpful, reference themes, sentiment patterns, and specific examples from the feedback.
Keep answers concise, actionable, and written for product teams.

Feedback records:
"""
${contextBlock}
"""

User question:
"""
${question}
"""`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Lightweight relevance scoring: ranks feedback by keyword overlap with the question.
 */
export function rankFeedbackByRelevance(
  question: string,
  items: AskLoopContextItem[],
  limit = 40
): AskLoopContextItem[] {
  const terms = question
    .toLowerCase()
    .split(/\W+/)
    .filter((term) => term.length > 2);

  if (terms.length === 0) {
    return items.slice(0, limit);
  }

  const scored = items.map((item) => {
    const haystack = item.content.toLowerCase();
    const score = terms.reduce(
      (total, term) => total + (haystack.includes(term) ? 1 : 0),
      0
    );
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const relevant = scored
    .filter((entry) => entry.score > 0)
    .map((entry) => entry.item);

  if (relevant.length >= 10) {
    return relevant.slice(0, limit);
  }

  const merged = [...relevant];
  for (const entry of items) {
    if (merged.length >= limit) {
      break;
    }
    if (!merged.some((item) => item.id === entry.id)) {
      merged.push(entry);
    }
  }

  return merged.slice(0, limit);
}
