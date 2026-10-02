import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  FeedbackChannel,
  FeedbackSentiment,
  FeedbackStatus,
} from "@prisma/client";
import { getSession, workspaceWhere } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InboxFilters } from "@/components/inbox/InboxFilters";
import { FeedbackTable, Pagination } from "@/components/inbox/FeedbackTable";

const PAGE_SIZE = 15;

type InboxPageProps = {
  searchParams: {
    page?: string;
    channel?: string;
    sentiment?: string;
    status?: string;
  };
};

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const page = Math.max(1, Number(searchParams.page ?? "1"));

  const channel = isValidEnum(searchParams.channel, FeedbackChannel)
    ? searchParams.channel
    : undefined;
  const sentiment = isValidEnum(searchParams.sentiment, FeedbackSentiment)
    ? searchParams.sentiment
    : undefined;
  const status = isValidEnum(searchParams.status, FeedbackStatus)
    ? searchParams.status
    : undefined;

  const where = workspaceWhere(session, {
    ...(channel ? { channel } : {}),
    ...(sentiment ? { sentiment } : {}),
    ...(status ? { status } : {}),
  });

  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.feedback.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Feedback Inbox
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Review and triage feedback for your workspace.
        </p>
      </div>

      <Suspense fallback={<div className="h-16 animate-pulse rounded-lg bg-gray-200" />}>
        <InboxFilters />
      </Suspense>

      <FeedbackTable items={items} userRole={session.user.role} />

      <Pagination
        page={page}
        totalPages={totalPages}
        searchParams={{ channel, sentiment, status }}
      />
    </div>
  );
}

function isValidEnum<T extends Record<string, string>>(
  value: string | undefined,
  enumObject: T
): value is T[keyof T] {
  if (!value) {
    return false;
  }
  return Object.values(enumObject).includes(value);
}
