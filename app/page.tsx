import Link from "next/link";
import { Inbox, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <div className="max-w-lg text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
        Project LOOP — AI Customer-Feedback Intelligence Platform 
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Multi-tenant feedback intelligence platform
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/inbox"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <Inbox className="h-4 w-4" />
            Open Feedback Inbox
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
