import Link from "next/link";
import {
  Feedback,
  FeedbackChannel,
  FeedbackSentiment,
  Role,
} from "@prisma/client";
import { StatusActions, StatusBadge } from "./StatusActions";

export function FeedbackTable({
  items,
  userRole,
}: {
  items: Feedback[];
  userRole: Role;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-gray-900">No feedback found</p>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your filters or import feedback via the API.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Content
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Channel
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Sentiment
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Received
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/80">
                <td className="max-w-md px-4 py-4 text-sm text-gray-900">
                  <p className="line-clamp-2">{item.content}</p>
                </td>
                <td className="px-4 py-4">
                  <ChannelBadge channel={item.channel} />
                </td>
                <td className="px-4 py-4">
                  <SentimentBadge sentiment={item.sentiment} />
                </td>
                <td className="px-4 py-4">
                  {item.status === "NEW" &&
                  (userRole === Role.ADMIN || userRole === Role.ANALYST) ? (
                    <StatusActions
                      feedbackId={item.id}
                      currentStatus={item.status}
                      userRole={userRole}
                    />
                  ) : (
                    <StatusBadge status={item.status} />
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(item.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChannelBadge({ channel }: { channel: FeedbackChannel }) {
  return (
    <span className="inline-flex rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
      {channel.replace("_", " ")}
    </span>
  );
}

function SentimentBadge({ sentiment }: { sentiment: FeedbackSentiment }) {
  const styles: Record<FeedbackSentiment, string> = {
    POSITIVE: "bg-green-50 text-green-700",
    NEUTRAL: "bg-gray-100 text-gray-700",
    NEGATIVE: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${styles[sentiment]}`}
    >
      {sentiment.charAt(0) + sentiment.slice(1).toLowerCase()}
    </span>
  );
}

export function Pagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) {
    return null;
  }

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    params.set("page", String(targetPage));
    return `/inbox?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
      <p className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <PaginationLink
          href={buildHref(page - 1)}
          disabled={page <= 1}
          label="Previous"
        />
        <PaginationLink
          href={buildHref(page + 1)}
          disabled={page >= totalPages}
          label="Next"
        />
      </div>
    </div>
  );
}

function PaginationLink({
  href,
  disabled,
  label,
}: {
  href: string;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <span className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-400">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
    >
      {label}
    </Link>
  );
}
