import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  assertSameWorkspace,
  forbiddenResponse,
  requireAuth,
} from "@/lib/auth";
import { classifyAndPersistFeedback } from "@/lib/insights";

const classifySchema = z.object({
  feedbackId: z.string().min(1),
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

  const parsed = classifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const feedback = await prisma.feedback.findUnique({
    where: { id: parsed.data.feedbackId },
  });

  if (!feedback) {
    return NextResponse.json({ error: "Feedback not found." }, { status: 404 });
  }

  if (!assertSameWorkspace(session, feedback.workspaceId)) {
    return forbiddenResponse();
  }

  try {
    const classification = await classifyAndPersistFeedback(
      feedback.id,
      feedback.content,
      feedback.workspaceId
    );

    return NextResponse.json({
      feedbackId: feedback.id,
      ...classification,
    });
  } catch (error) {
    console.error("Classification failed:", error);
    return NextResponse.json(
      { error: "Failed to classify feedback." },
      { status: 500 }
    );
  }
}
