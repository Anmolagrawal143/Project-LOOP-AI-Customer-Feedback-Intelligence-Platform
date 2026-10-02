import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, workspaceWhere } from "@/lib/auth";
import { askLoopQuestion, rankFeedbackByRelevance } from "@/lib/ai";

const askSchema = z.object({
  question: z.string().min(3).max(1000),
});

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (session instanceof NextResponse) {
    return session;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = askSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid question.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const recentFeedback = await prisma.feedback.findMany({
      where: workspaceWhere(session),
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        content: true,
        sentiment: true,
        channel: true,
        createdAt: true,
      },
    });

    const context = rankFeedbackByRelevance(
      parsed.data.question,
      recentFeedback
    );

    const answer = await askLoopQuestion(parsed.data.question, context);

    return NextResponse.json({
      answer,
      contextCount: context.length,
      totalFeedback: recentFeedback.length,
    });
  } catch (error) {
    console.error("Ask LOOP failed:", error);
    return NextResponse.json(
      { error: "Failed to generate an answer." },
      { status: 500 }
    );
  }
}
