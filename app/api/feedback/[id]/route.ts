import { FeedbackStatus, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertSameWorkspace,
  forbiddenResponse,
  requireRole,
} from "@/lib/auth";
import { feedbackStatusUpdateSchema } from "@/lib/validations/feedback";

type RouteContext = {
  params: { id: string };
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await requireRole([Role.ADMIN, Role.ANALYST]);
  if (session instanceof NextResponse) {
    return session;
  }

  const { id } = context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = feedbackStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid status update.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.feedback.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Feedback not found." }, { status: 404 });
  }

  if (!assertSameWorkspace(session, existing.workspaceId)) {
    return forbiddenResponse();
  }

  if (existing.status !== FeedbackStatus.NEW) {
    return NextResponse.json(
      { error: "Only feedback with status NEW can be updated." },
      { status: 400 }
    );
  }

  const updated = await prisma.feedback.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(updated);
}
