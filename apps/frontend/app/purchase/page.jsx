"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGetAuth, apiPostAuth } from "../../lib/api";

const PLANS = [
  { code: "premium-monthly", name: "Premium Monthly", price: "Rs 199 / month" },
  { code: "premium-yearly", name: "Premium Yearly", price: "Rs 1499 / year" },
];

function PurchaseFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planFromUrl = searchParams.get("plan");
  const methodFromUrl = searchParams.get("method");

  const initialPlan = useMemo(() => {
    if (planFromUrl && PLANS.some((p) => p.code === planFromUrl)) return planFromUrl;
    return PLANS[0].code;
  }, [planFromUrl]);

  const [selected, setSelected] = useState(initialPlan);
  const [payMethod, setPayMethod] = useState(methodFromUrl === "card" ? "card" : "upi");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gateMessage, setGateMessage] = useState("Checking your account…");

  useEffect(() => {
    setSelected(initialPlan);
  }, [initialPlan]);

  useEffect(() => {
    if (methodFromUrl === "card" || methodFromUrl === "upi") setPayMethod(methodFromUrl);
  }, [methodFromUrl]);

  useEffect(() => {
    let cancelled = false;
    const fullPath = typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/purchase";

    async function gate() {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("mirai_token") : null;
      if (!token) {
        router.replace(`/login?returnUrl=${encodeURIComponent(fullPath)}`);
        return;
      }
      try {
        const me = await apiGetAuth("/api/v1/auth/me");
        if (cancelled) return;
        if (!me?.user?.phoneVerified) {
          router.replace(`/subscription?next=${encodeURIComponent(fullPath)}`);
          return;
        }
        setGateMessage("");
      } catch {
        if (!cancelled) router.replace(`/login?returnUrl=${encodeURIComponent(fullPath)}`);
      }
    }

    gate();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handlePurchase() {
    setError("");
    setMessage("");
    setLoading(true);
    const returnPath =
      typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/purchase";
    try {
      const response = await apiPostAuth("/api/v1/monetization/subscriptions/intent", {
        planCode: selected,
        paymentMethod: payMethod,
      });
      setMessage(response?.message || "Subscription intent created.");
    } catch (err) {
      if (err?.status === 403 && err?.code === "PHONE_NOT_VERIFIED") {
        setError(err?.message || "Verify your mobile number first.");
        router.push(`/subscription?next=${encodeURIComponent(returnPath)}`);
      } else if (err?.status === 401) {
        router.push(`/login?returnUrl=${encodeURIComponent(returnPath)}`);
      } else {
        setError(err?.message || "Unable to create purchase intent.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1 className="mb-2 text-3xl font-bold">Checkout</h1>
      <p className="mb-2 text-sm text-slate-300">Review your Mirai Gold selection and complete subscription setup.</p>

      {gateMessage ? <p className="mb-4 text-sm text-zinc-500">{gateMessage}</p> : null}

      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full border border-mxGold/40 bg-mxGold/10 px-3 py-1 text-mxGold">
          Pay with: <strong className="text-white">{payMethod === "card" ? "Card" : "UPI"}</strong>
        </span>
        <button type="button" onClick={() => setPayMethod("upi")} className={`rounded-full px-3 py-1 ${payMethod === "upi" ? "bg-ottBlue text-white" : "border border-slate-700 text-slate-300"}`}>
          UPI
        </button>
        <button type="button" onClick={() => setPayMethod("card")} className={`rounded-full px-3 py-1 ${payMethod === "card" ? "bg-ottBlue text-white" : "border border-slate-700 text-slate-300"}`}>
          Card
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {PLANS.map((plan) => (
          <button
            key={plan.code}
            type="button"
            onClick={() => setSelected(plan.code)}
            className={`rounded-xl border p-5 text-left transition ${
              selected === plan.code ? "border-brandAccent bg-brandCard" : "border-slate-800 bg-brandCard/60 hover:border-slate-600"
            }`}
          >
            <p className="text-lg font-semibold">{plan.name}</p>
            <p className="mt-1 text-sm text-slate-300">{plan.price}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handlePurchase}
          disabled={loading || Boolean(gateMessage)}
          className="rounded bg-brandAccent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? `Processing ${payMethod === "card" ? "card" : "UPI"}…` : "Confirm & process"}
        </button>
        <Link href="/subscription" className="rounded border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white">
          Back to membership
        </Link>
      </div>

      {message ? <p className="mt-4 rounded bg-emerald-950/40 p-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-4 rounded bg-red-950/40 p-3 text-sm text-red-300">{error}</p> : null}
    </section>
  );
}

export default function PurchasePage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Loading checkout…</p>}>
      <PurchaseFlow />
    </Suspense>
  );
}
