import { prisma } from "@/lib/prisma";
import { classifyAndPersistFeedback } from "@/lib/insights";
import type { FeedbackItemInput } from "@/lib/validations/feedback";

export async function ingestFeedbackItem(
  item: FeedbackItemInput,
  workspaceId: string
) {
  const feedback = await prisma.feedback.create({
    data: {
      ...item,
      workspaceId,
    },
  });

  try {
    await classifyAndPersistFeedback(
      feedback.id,
      feedback.content,
      workspaceId
    );
  } catch (error) {
    console.error(`Auto-classification failed for ${feedback.id}:`, error);
  }

  return prisma.feedback.findUniqueOrThrow({ where: { id: feedback.id } });
}

export async function ingestFeedbackBulk(
  items: FeedbackItemInput[],
  workspaceId: string
) {
  const results = await Promise.all(
    items.map((item) => ingestFeedbackItem(item, workspaceId))
  );

  return results;
}
