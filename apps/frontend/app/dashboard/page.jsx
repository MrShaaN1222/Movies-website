"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGetAuth } from "../../lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [continueItems, setContinueItems] = useState([]);
  const [subscription, setSubscription] = useState({ status: "inactive", planCode: null });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("mirai_token") : null;
      if (!token) {
        router.replace(`/login?returnUrl=${encodeURIComponent("/dashboard")}`);
        return;
      }
      try {
        const [progressRows, sub] = await Promise.all([
          apiGetAuth("/api/v1/ott/progress/continue"),
          apiGetAuth("/api/v1/monetization/subscriptions/me"),
        ]);
        if (!cancelled) {
          setContinueItems(Array.isArray(progressRows) ? progressRows : []);
          setSubscription(sub || { status: "inactive", planCode: null });
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          router.replace(`/login?returnUrl=${encodeURIComponent("/dashboard")}`);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return <p className="text-sm text-slate-400">Loading dashboard...</p>;
  }

  return (
    <section>
      <h1 className="mb-4 text-3xl font-bold">User Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded bg-brandCard p-4">
          <h2 className="mb-2 font-semibold">Account</h2>
          <p className="text-slate-300">Manage profile, phone number, and account security.</p>
          <div className="mt-3">
            <Link href="/dashboard/account" className="text-sm text-brandAccent">
              Open account settings
            </Link>
          </div>
        </div>
        <Link
          href="/ott?section=watchlist"
          className="block rounded bg-brandCard p-4 transition hover:bg-brandCard/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandAccent"
        >
          <h2 className="mb-2 font-semibold">Watchlist</h2>
          <p className="text-slate-300">Saved movies will appear here.</p>
        </Link>
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
          <div className="mt-3">
            <Link href="/ott?section=continue" className="text-sm text-brandAccent">
              Open continue watching
            </Link>
          </div>
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
        <div className="rounded bg-brandCard p-4">
          <h2 className="mb-2 font-semibold">Notifications</h2>
          <p className="text-slate-300">Control alerts for new movies, series, premium drops, and offers.</p>
          <div className="mt-3">
            <Link href="/dashboard/notifications" className="text-sm text-brandAccent">
              Open notification preferences
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
