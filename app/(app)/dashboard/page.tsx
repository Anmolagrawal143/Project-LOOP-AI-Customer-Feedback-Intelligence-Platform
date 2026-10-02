import { redirect } from "next/navigation";
import { MessageSquareText, TrendingUp } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getDashboardAnalytics } from "@/lib/analytics";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const analytics = await getDashboardAnalytics(session.user.workspaceId);

  const last30Total = analytics.volumeOverTime.reduce(
    (sum, day) => sum + day.count,
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Analytics Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Real-time insights for your workspace feedback
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Feedback"
          value={analytics.totalFeedback.toLocaleString()}
          description="All time"
          icon={<MessageSquareText className="h-5 w-5 text-indigo-600" />}
        />
        <StatCard
          title="Last 30 Days"
          value={last30Total.toLocaleString()}
          description="Recent volume"
          icon={<TrendingUp className="h-5 w-5 text-indigo-600" />}
        />
        <StatCard
          title="Positive Sentiment"
          value={(
            analytics.sentimentBreakdown.find((s) => s.sentiment === "POSITIVE")
              ?.count ?? 0
          ).toLocaleString()}
          description="All time"
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
        />
      </div>

      <DashboardCharts data={analytics} />
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-gray-400">{description}</p>
        </div>
        <div className="rounded-lg bg-indigo-50 p-2">{icon}</div>
      </div>
    </div>
  );
}
