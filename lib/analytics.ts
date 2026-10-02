import { FeedbackSentiment } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type SentimentBreakdown = {
  sentiment: FeedbackSentiment;
  count: number;
  label: string;
};

export type DailyVolume = {
  date: string;
  count: number;
  label: string;
};

export type DashboardAnalytics = {
  totalFeedback: number;
  sentimentBreakdown: SentimentBreakdown[];
  volumeOverTime: DailyVolume[];
};

const SENTIMENT_LABELS: Record<FeedbackSentiment, string> = {
  POSITIVE: "Positive",
  NEUTRAL: "Neutral",
  NEGATIVE: "Negative",
};

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatChartLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function buildLast30Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 29; offset >= 0; offset--) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    days.push(formatDateKey(day));
  }

  return days;
}

export async function getDashboardAnalytics(
  workspaceId: string
): Promise<DashboardAnalytics> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [totalFeedback, sentimentGroups, recentFeedback] = await Promise.all([
    prisma.feedback.count({ where: { workspaceId } }),
    prisma.feedback.groupBy({
      by: ["sentiment"],
      where: { workspaceId },
      _count: { sentiment: true },
    }),
    prisma.feedback.findMany({
      where: {
        workspaceId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const sentimentBreakdown = Object.values(FeedbackSentiment).map(
    (sentiment) => {
      const match = sentimentGroups.find((group) => group.sentiment === sentiment);
      return {
        sentiment,
        count: match?._count.sentiment ?? 0,
        label: SENTIMENT_LABELS[sentiment],
      };
    }
  );

  const countsByDay = new Map<string, number>();
  for (const day of buildLast30Days()) {
    countsByDay.set(day, 0);
  }

  for (const item of recentFeedback) {
    const key = formatDateKey(item.createdAt);
    if (countsByDay.has(key)) {
      countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
    }
  }

  const volumeOverTime = Array.from(countsByDay.entries()).map(
    ([date, count]) => ({
      date,
      count,
      label: formatChartLabel(date),
    })
  );

  return {
    totalFeedback,
    sentimentBreakdown,
    volumeOverTime,
  };
}
