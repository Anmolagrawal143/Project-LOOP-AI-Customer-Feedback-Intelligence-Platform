"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import {
  FeedbackChannel,
  FeedbackSentiment,
  FeedbackStatus,
} from "@prisma/client";

const ALL = "ALL";

export function InboxFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const channel = searchParams.get("channel") ?? ALL;
  const sentiment = searchParams.get("sentiment") ?? ALL;
  const status = searchParams.get("status") ?? ALL;

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === ALL) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`/inbox?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-end gap-4">
      <FilterSelect
        label="Channel"
        value={channel}
        disabled={isPending}
        onChange={(value) => updateFilter("channel", value)}
        options={[
          { value: ALL, label: "All channels" },
          ...Object.values(FeedbackChannel).map((value) => ({
            value,
            label: formatLabel(value),
          })),
        ]}
      />
      <FilterSelect
        label="Sentiment"
        value={sentiment}
        disabled={isPending}
        onChange={(value) => updateFilter("sentiment", value)}
        options={[
          { value: ALL, label: "All sentiments" },
          ...Object.values(FeedbackSentiment).map((value) => ({
            value,
            label: formatLabel(value),
          })),
        ]}
      />
      <FilterSelect
        label="Status"
        value={status}
        disabled={isPending}
        onChange={(value) => updateFilter("status", value)}
        options={[
          { value: ALL, label: "All statuses" },
          ...Object.values(FeedbackStatus).map((value) => ({
            value,
            label: formatLabel(value),
          })),
        ]}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
