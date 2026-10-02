"use client";

import { FormEvent, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta?: string;
};

export function AskLoopChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi, I'm LOOP. Ask me anything about your workspace feedback — trends, pain points, sentiment patterns, or recurring themes.",
    },
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/insights/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to get an answer.");
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
        meta: `Grounded in ${data.contextCount} of ${data.totalFeedback} recent feedback items`,
      };

      setMessages((current) => [...current, assistantMessage]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Ask LOOP
            </h1>
            <p className="text-sm text-gray-600">
              RAG-powered Q&amp;A grounded in your latest workspace feedback
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {loading ? (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-md bg-gray-100 px-4 py-3 text-sm text-gray-600">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing feedback context...
                </span>
              </div>
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex items-end gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about customer pain points, sentiment trends, or feature requests..."
            rows={2}
            className="max-h-32 min-h-[3rem] flex-1 resize-none bg-transparent px-2 py-1 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || question.trim().length < 3}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Answers are generated from your 100 most recent feedback items using Gemini.
        </p>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-gray-900 text-white" : "bg-indigo-100 text-indigo-700"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={`max-w-[80%] ${isUser ? "text-right" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-md bg-gray-900 text-white"
              : "rounded-tl-md bg-gray-100 text-gray-800"
          }`}
        >
          {message.content}
        </div>
        {message.meta ? (
          <p className="mt-1 text-xs text-gray-500">{message.meta}</p>
        ) : null}
      </div>
    </div>
  );
}
