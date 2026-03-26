"use client";

import Link from "next/link";
import { useState } from "react";
import { apiPostAuth } from "../../lib/api";

const PLANS = [
  { code: "premium-monthly", name: "Premium Monthly", price: "Rs 199 / month" },
  { code: "premium-yearly", name: "Premium Yearly", price: "Rs 1499 / year" },
];

export default function PurchasePage() {
  const [selected, setSelected] = useState(PLANS[0].code);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePurchase() {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await apiPostAuth("/api/v1/monetization/subscriptions/intent", { planCode: selected });
      setMessage(response?.message || "Subscription intent created.");
    } catch (err) {
      setError(err?.message || "Unable to create purchase intent. Please login first.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1 className="mb-2 text-3xl font-bold">Purchase Premium</h1>
      <p className="mb-6 text-sm text-slate-300">Choose a premium plan to unlock OTT playback and premium content.</p>

      <div className="grid gap-4 md:grid-cols-2">
        {PLANS.map((plan) => (
          <button
            key={plan.code}
            type="button"
            onClick={() => setSelected(plan.code)}
            className={`rounded-xl border p-5 text-left transition ${
              selected === plan.code
                ? "border-brandAccent bg-brandCard"
                : "border-slate-800 bg-brandCard/60 hover:border-slate-600"
            }`}
          >
            <p className="text-lg font-semibold">{plan.name}</p>
            <p className="mt-1 text-sm text-slate-300">{plan.price}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handlePurchase}
          disabled={loading}
          className="rounded bg-brandAccent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Processing..." : "Purchase now"}
        </button>
        <Link href="/subscription" className="rounded border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white">
          View subscription
        </Link>
      </div>

      {message ? <p className="mt-4 rounded bg-emerald-950/40 p-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-4 rounded bg-red-950/40 p-3 text-sm text-red-300">{error}</p> : null}
    </section>
  );
}
