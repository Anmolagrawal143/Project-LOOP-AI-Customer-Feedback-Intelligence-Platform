"use client";

import { FeedbackStatus, Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Eye } from "lucide-react";

export function StatusActions({
  feedbackId,
  currentStatus,
  userRole,
}: {
  feedbackId: string;
  currentStatus: FeedbackStatus;
  userRole: Role;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<FeedbackStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canUpdate =
    (userRole === Role.ADMIN || userRole === Role.ANALYST) &&
    currentStatus === FeedbackStatus.NEW;

  if (!canUpdate) {
    return <StatusBadge status={currentStatus} />;
  }

  async function updateStatus(status: FeedbackStatus) {
    setLoading(status);
    setError(null);

    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to update status.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => updateStatus(FeedbackStatus.REVIEWED)}
          className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200 transition hover:bg-amber-100 disabled:opacity-50"
        >
          <Eye className="h-3.5 w-3.5" />
          {loading === FeedbackStatus.REVIEWED ? "Updating..." : "Mark Reviewed"}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => updateStatus(FeedbackStatus.ACTIONED)}
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200 transition hover:bg-emerald-100 disabled:opacity-50"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {loading === FeedbackStatus.ACTIONED ? "Updating..." : "Mark Actioned"}
        </button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: FeedbackStatus }) {
  const styles: Record<FeedbackStatus, string> = {
    NEW: "bg-blue-50 text-blue-700 ring-blue-200",
    REVIEWED: "bg-amber-50 text-amber-700 ring-amber-200",
    ACTIONED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
