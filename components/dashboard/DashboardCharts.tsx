"use client";

import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardAnalytics } from "@/lib/analytics";

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: "#22c55e",
  Neutral: "#94a3b8",
  Negative: "#ef4444",
};

export function DashboardCharts({ data }: { data: DashboardAnalytics }) {
  const pieData = data.sentimentBreakdown
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: item.label,
      value: item.count,
    }));

  const totalSentiment = data.sentimentBreakdown.reduce(
    (sum, item) => sum + item.count,
    0
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Feedback Volume
          </h2>
          <p className="text-sm text-gray-500">Last 30 days</p>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.volumeOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "0.5rem",
                  border: "1px solid #e5e7eb",
                  fontSize: "0.875rem",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                name="Feedback"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={{ r: 3, fill: "#4f46e5" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Sentiment Breakdown
          </h2>
          <p className="text-sm text-gray-500">All-time workspace distribution</p>
        </div>

        {totalSentiment === 0 ? (
          <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm text-gray-500">
            No feedback data yet
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={SENTIMENT_COLORS[entry.name] ?? "#6366f1"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.5rem",
                    border: "1px solid #e5e7eb",
                    fontSize: "0.875rem",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3">
          {data.sentimentBreakdown.map((item) => (
            <div
              key={item.sentiment}
              className="rounded-lg bg-gray-50 px-3 py-2 text-center"
            >
              <p className="text-xs font-medium text-gray-500">{item.label}</p>
              <p className="text-lg font-semibold text-gray-900">{item.count}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
