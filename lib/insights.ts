import { prisma } from "@/lib/prisma";
import { classifyFeedback } from "@/lib/ai";

export async function classifyAndPersistFeedback(
  feedbackId: string,
  content: string,
  workspaceId: string
) {
  const classification = await classifyFeedback(content);

  await prisma.feedback.update({
    where: { id: feedbackId },
    data: { sentiment: classification.sentiment },
  });

  for (const themeName of classification.themes) {
    const normalized = themeName.trim();
    if (!normalized) {
      continue;
    }

    const existing = await prisma.theme.findFirst({
      where: {
        workspaceId,
        name: { equals: normalized, mode: "insensitive" },
      },
    });

    if (!existing) {
      await prisma.theme.create({
        data: { name: normalized, workspaceId },
      });
    }
  }

  return classification;
}
