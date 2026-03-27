"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGetAuth } from "../../../lib/api";

function formatMinutes(seconds) {
  return Math.max(1, Math.floor((seconds || 0) / 60));
}

export default function DashboardContinueWatchingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("mirai_token") : null;
      if (!token) {
        router.replace(`/login?returnUrl=${encodeURIComponent("/dashboard/continue-watching")}`);
        return;
      }
      try {
        const data = await apiGetAuth("/api/v1/ott/progress/continue");
        if (!cancelled) {
          setRows(Array.isArray(data) ? data : []);
          setReady(true);
        }
      } catch {
        if (!cancelled) router.replace(`/login?returnUrl=${encodeURIComponent("/dashboard/continue-watching")}`);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) return <p className="text-sm text-slate-400">Loading continue watching...</p>;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Continue Watching</h1>
        <Link href="/dashboard" className="text-sm text-brandAccent">
          Back to dashboard
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="rounded bg-brandCard p-5">
          <p className="text-slate-300">No in-progress content found.</p>
          <Link href="/ott" className="mt-3 inline-block rounded bg-brandAccent px-4 py-2 text-sm font-semibold text-white">
            Start watching on OTT
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((row) => (
            <Link key={row.progressId} href={`/ott/${row.content.slug}`} className="rounded bg-brandCard p-4 transition hover:bg-brandCard/80">
              <p className="font-semibold text-white">{row.content.title}</p>
              <p className="mt-1 text-xs text-slate-400">Resume from {formatMinutes(row.seconds)} min</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
