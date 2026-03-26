"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGetAuth } from "../../lib/api";

const EMPTY_SUBSCRIPTION = { status: "inactive", planCode: null, provider: "razorpay" };

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState(EMPTY_SUBSCRIPTION);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadSubscription() {
      try {
        const data = await apiGetAuth("/api/v1/monetization/subscriptions/me");
        if (!cancelled) setSubscription(data || EMPTY_SUBSCRIPTION);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Please login to view your subscription.");
      }
    }
    loadSubscription();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mx-auto max-w-2xl rounded-xl bg-brandCard p-6">
      <h1 className="mb-2 text-2xl font-bold">Subscription</h1>
      <p className="mb-5 text-sm text-slate-300">View your premium status and continue watching protected content.</p>

      {error ? <p className="mb-4 rounded bg-red-950/40 p-3 text-sm text-red-300">{error}</p> : null}

      <div className="rounded border border-slate-800 bg-slate-950/40 p-4">
        <p className="text-sm text-slate-300">Status: <span className="font-medium text-white">{subscription.status}</span></p>
        <p className="mt-1 text-sm text-slate-300">
          Plan: <span className="font-medium text-white">{subscription.planCode || "No active plan"}</span>
        </p>
        <p className="mt-1 text-sm text-slate-300">
          Provider: <span className="font-medium text-white">{subscription.provider || "N/A"}</span>
        </p>
      </div>

      <div className="mt-4 flex gap-3">
        <Link href="/purchase" className="rounded bg-brandAccent px-4 py-2 text-sm font-medium text-white">
          Purchase / Upgrade
        </Link>
        <Link href="/dashboard" className="rounded border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white">
          Back to dashboard
        </Link>
      </div>
    </section>
  );
}
