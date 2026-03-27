"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGetAuth } from "../../../lib/api";

const EMPTY_SUBSCRIPTION = { status: "inactive", planCode: null, provider: "razorpay" };

const PLAN_META = {
  "premium-monthly": {
    label: "Mirai Gold Monthly",
    durationLabel: "30 days",
    benefits: ["Ad-light premium streaming", "Offline download support where available", "Priority playback for premium titles"],
  },
  "premium-yearly": {
    label: "Mirai Gold Yearly",
    durationLabel: "365 days",
    benefits: ["All monthly benefits", "Best value annual price", "Early access to selected drops"],
  },
};

function formatDate(value) {
  if (!value) return "Not available";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Not available";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function calcRemainingDays(currentPeriodEnd) {
  if (!currentPeriodEnd) return null;
  const end = new Date(currentPeriodEnd).getTime();
  if (Number.isNaN(end)) return null;
  const diff = end - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

function normalizeProvider(provider) {
  if (!provider) return "Unknown";
  if (provider === "razorpay") return "Razorpay";
  if (provider === "stripe") return "Stripe";
  return provider;
}

function normalizePreviousStatus(status) {
  if (!status) return "Not available";
  if (status === "active") return "Replaced";
  if (status === "cancelled") return "Cancelled";
  if (status === "past_due") return "Past due";
  return status;
}

export default function ManageSubscriptionPage() {
  const router = useRouter();
  const [profileReady, setProfileReady] = useState(false);
  const [subscription, setSubscription] = useState(EMPTY_SUBSCRIPTION);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("mirai_token") : null;
      if (!token) {
        router.replace(`/login?returnUrl=${encodeURIComponent("/subscription/manage")}`);
        return;
      }
      try {
        const me = await apiGetAuth("/api/v1/auth/me");
        if (cancelled) return;
        if (!me?.user) {
          router.replace(`/login?returnUrl=${encodeURIComponent("/subscription/manage")}`);
          return;
        }
      } catch {
        if (!cancelled) router.replace(`/login?returnUrl=${encodeURIComponent("/subscription/manage")}`);
        return;
      } finally {
        if (!cancelled) setProfileReady(true);
      }

      try {
        const sub = await apiGetAuth("/api/v1/monetization/subscriptions/me");
        if (!cancelled) setSubscription(sub || EMPTY_SUBSCRIPTION);
      } catch (err) {
        if (!cancelled) setLoadError(err?.message || "Could not load subscription.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const planMeta = PLAN_META[subscription.planCode] || null;
  const previousPlanMeta = PLAN_META[subscription.previousPlanCode] || null;
  const remainingDays = useMemo(() => calcRemainingDays(subscription.currentPeriodEnd), [subscription.currentPeriodEnd]);
  const isActive = subscription.status === "active";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-zinc-100 md:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">Manage Membership</h1>
          <p className="mt-1 text-sm text-zinc-400">Your current plan, billing period, benefits, and previous plan details.</p>
        </div>
        <Link href="/subscription" className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900">
          Change plan
        </Link>
      </div>

      {!profileReady ? <p className="text-sm text-zinc-400">Loading membership…</p> : null}
      {loadError ? <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-950/30 p-3 text-sm text-amber-200">{loadError}</p> : null}

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Current plan</h2>
          <span className={`rounded-full px-2.5 py-1 text-xs ${isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-800 text-zinc-300"}`}>
            {subscription.status || "inactive"}
          </span>
        </div>
        <div className="grid gap-3 text-sm text-zinc-300 md:grid-cols-2">
          <p>Plan: <span className="font-medium text-white">{planMeta?.label || subscription.planCode || "No active plan"}</span></p>
          <p>Provider: <span className="font-medium text-white">{normalizeProvider(subscription.provider)}</span></p>
          <p>Started on: <span className="font-medium text-white">{formatDate(subscription.planStartedAt || subscription.updatedAt)}</span></p>
          <p>Renews/ends: <span className="font-medium text-white">{formatDate(subscription.currentPeriodEnd)}</span></p>
          <p>Duration: <span className="font-medium text-white">{planMeta?.durationLabel || "Not available"}</span></p>
          <p>
            Remaining days:{" "}
            <span className="font-medium text-white">{remainingDays === null ? "Not available" : remainingDays === 0 ? "Ends today" : `${remainingDays} days`}</span>
          </p>
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
        <h2 className="mb-3 text-lg font-semibold text-white">Current plan benefits</h2>
        {planMeta?.benefits?.length ? (
          <ul className="space-y-2 text-sm text-zinc-300">
            {planMeta.benefits.map((benefit) => (
              <li key={benefit} className="rounded-lg border border-zinc-800 bg-black/30 px-3 py-2">
                {benefit}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-400">Choose a plan to unlock Mirai Gold benefits.</p>
        )}
      </section>

      <section className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
        <h2 className="mb-3 text-lg font-semibold text-white">Previous plan</h2>
        {subscription.previousPlanCode ? (
          <div className="grid gap-3 text-sm text-zinc-300 md:grid-cols-2">
            <p>Plan: <span className="font-medium text-white">{previousPlanMeta?.label || subscription.previousPlanCode}</span></p>
            <p>Provider: <span className="font-medium text-white">{normalizeProvider(subscription.previousProvider)}</span></p>
            <p>Status: <span className="font-medium text-white">{normalizePreviousStatus(subscription.previousStatus)}</span></p>
            <p>Last period end: <span className="font-medium text-white">{formatDate(subscription.previousPeriodEnd)}</span></p>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">No previous plan found yet.</p>
        )}
      </section>
    </div>
  );
}
