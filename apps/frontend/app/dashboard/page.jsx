"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGetAuth } from "../../lib/api";

export default function DashboardPage() {
  const [continueItems, setContinueItems] = useState([]);
  const [subscription, setSubscription] = useState({ status: "inactive", planCode: null });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [progressRows, sub] = await Promise.all([
          apiGetAuth("/api/v1/ott/progress/continue"),
          apiGetAuth("/api/v1/monetization/subscriptions/me"),
        ]);
        if (!cancelled) {
          setContinueItems(Array.isArray(progressRows) ? progressRows : []);
          setSubscription(sub || { status: "inactive", planCode: null });
        }
      } catch {
        // Keep defaults when auth is missing.
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <h1 className="mb-4 text-3xl font-bold">User Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded bg-brandCard p-4">
          <h2 className="mb-2 font-semibold">Watchlist</h2>
          <p className="text-slate-300">Saved movies will appear here.</p>
        </div>
        <div className="rounded bg-brandCard p-4">
          <h2 className="mb-2 font-semibold">Continue Watching</h2>
          {continueItems.length === 0 ? (
            <p className="text-slate-300">Resume OTT content across devices.</p>
          ) : (
            <div className="space-y-2">
              {continueItems.slice(0, 3).map((row) => (
                <Link
                  key={row.progressId}
                  className="block text-sm text-brandAccent"
                  href={`/ott/${row.content.slug}`}
                >
                  {row.content.title} - {Math.floor((row.seconds || 0) / 60)} min
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="rounded bg-brandCard p-4">
          <h2 className="mb-2 font-semibold">Subscription</h2>
          <p className="text-slate-300">
            Status: {subscription.status} {subscription.planCode ? `(${subscription.planCode})` : ""}
          </p>
          <div className="mt-3 flex gap-2">
            <Link href="/subscription" className="text-sm text-brandAccent">
              Manage subscription
            </Link>
            {subscription.status !== "active" ? (
              <Link href="/purchase" className="text-sm text-brandAccent">
                Purchase premium
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
