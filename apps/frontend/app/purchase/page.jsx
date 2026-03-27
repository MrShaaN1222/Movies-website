"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGetAuth, apiPostAuth } from "../../lib/api";

const PLANS = [
  { code: "premium-monthly", name: "Premium Monthly", priceLabel: "₹99 / month", amountInr: 99 },
  { code: "premium-yearly", name: "Premium Yearly", priceLabel: "₹499 / year", amountInr: 499 },
];

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.Razorpay) return resolve(window.Razorpay);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(window.Razorpay);
    s.onerror = () => reject(new Error("Could not load Razorpay"));
    document.body.appendChild(s);
  });
}

function PaymentDemoDialog({ open, onClose, amountInr, planName, method }) {
  if (!open) return null;

  const upi = `upi://pay?pa=miraigold@okicici&pn=${encodeURIComponent("Mirai Movies")}&am=${amountInr}.00&cu=INR`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upi)}`;

  const titleId = method === "upi" ? "demo-upi-title" : "demo-card-title";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/15 bg-zinc-900 p-6 shadow-xl">
        {method === "upi" ? (
          <>
            <h2 id={titleId} className="text-lg font-semibold text-mxGold">
              UPI — demo QR
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Add <code className="rounded bg-zinc-800 px-1">RAZORPAY_KEY_ID</code> and{" "}
              <code className="rounded bg-zinc-800 px-1">RAZORPAY_KEY_SECRET</code> in <code className="rounded bg-zinc-800 px-1">.env</code> to open
              live Razorpay checkout for {planName}.
            </p>
            <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrSrc} alt="" width={240} height={240} className="rounded-lg bg-white p-2" />
              <div className="text-xs text-zinc-400">
                <p>Scan with any UPI app (demo intent only).</p>
                <p className="mt-2">
                  Amount: <strong className="text-white">₹{amountInr}</strong>
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 id={titleId} className="text-lg font-semibold text-white">
              Pay with card
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Live card entry runs inside Razorpay’s secure window. Configure Razorpay keys to enable it. This form is a layout preview only.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-xs text-zinc-400">
                Card number
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="4111 1111 1111 1111"
                  readOnly
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-zinc-500"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs text-zinc-400">
                  Expiry
                  <input type="text" placeholder="MM/YY" readOnly className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-zinc-500" />
                </label>
                <label className="block text-xs text-zinc-400">
                  CVV
                  <input type="text" placeholder="•••" readOnly className="mt-1 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-zinc-500" />
                </label>
              </div>
            </div>
            <p className="mt-4 text-xs text-amber-200/90">
              {planName} · ₹{amountInr}
            </p>
          </>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function LiveCheckoutDialog({ open, onClose, onConfirm, planLabel, amountInr, payMethod, confirming }) {
  if (!open) return null;
  const methodLabel = payMethod === "card" ? "Card" : payMethod === "stripe" ? "Stripe" : "UPI";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-checkout-title"
    >
      <div className="w-full max-w-md rounded-xl border border-emerald-500/25 bg-zinc-900 p-6 shadow-xl">
        <h2 id="live-checkout-title" className="text-lg font-semibold text-white">
          Confirm payment
        </h2>
        <p className="mt-3 text-sm text-zinc-300">
          <span className="font-medium text-white">{planLabel}</span>
          <span className="mx-2 text-zinc-600">·</span>
          <span className="text-mxGold">₹{amountInr}</span>
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          {payMethod === "stripe"
            ? "You will be redirected to Stripe hosted checkout. Your subscription activates after payment is verified."
            : (
                <>
                  Pay with <strong className="text-zinc-300">{methodLabel}</strong> in Razorpay’s secure window. Your subscription activates after payment is verified.
                </>
              )}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={confirming}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="rounded-lg bg-brandAccent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {confirming ? "Opening checkout…" : `Pay ₹${amountInr} securely`}
          </button>
        </div>
      </div>
    </div>
  );
}

function PurchaseFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planFromUrl = searchParams.get("plan");
  const methodFromUrl = searchParams.get("method");
  const stripeState = searchParams.get("stripe");
  const stripeSessionId = searchParams.get("session_id");

  const initialPlan = useMemo(() => {
    if (planFromUrl && PLANS.some((p) => p.code === planFromUrl)) return planFromUrl;
    return PLANS[0].code;
  }, [planFromUrl]);

  const [selected, setSelected] = useState(initialPlan);
  const [payMethod, setPayMethod] = useState(methodFromUrl === "card" ? "card" : methodFromUrl === "stripe" ? "stripe" : "upi");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gateMessage, setGateMessage] = useState("Checking your account…");
  const [razorpayReady, setRazorpayReady] = useState(null);
  const [stripeReady, setStripeReady] = useState(null);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoAmount, setDemoAmount] = useState(99);
  const [liveConfirmOpen, setLiveConfirmOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [razorpayOpening, setRazorpayOpening] = useState(false);

  useEffect(() => {
    setSelected(initialPlan);
  }, [initialPlan]);

  useEffect(() => {
    if (methodFromUrl === "card" || methodFromUrl === "upi" || methodFromUrl === "stripe") setPayMethod(methodFromUrl);
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

  useEffect(() => {
    let cancelled = false;

    async function checkPayment() {
      try {
        const s = await apiGetAuth("/api/v1/monetization/subscriptions/payment-status");
        if (!cancelled) {
          setRazorpayReady(Boolean(s?.razorpayConfigured));
          setStripeReady(Boolean(s?.stripeConfigured));
        }
      } catch {
        if (!cancelled) {
          setRazorpayReady(false);
          setStripeReady(false);
        }
      }
    }
    checkPayment();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function resolveStripeReturn() {
      if (stripeState !== "success" || !stripeSessionId) return;
      setLoading(true);
      setError("");
      setMessage("Verifying Stripe payment…");
      try {
        const result = await apiGetAuth(`/api/v1/monetization/subscriptions/stripe-session-status?sessionId=${encodeURIComponent(stripeSessionId)}`);
        if (cancelled) return;
        if (result?.paid) {
          setMessage("Payment successful. Redirecting…");
          window.dispatchEvent(new Event("mirai-auth-changed"));
          router.push("/ott");
          return;
        }
        setError("Stripe payment is not completed yet.");
      } catch (err) {
        if (!cancelled) setError(err?.message || "Could not verify Stripe payment.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    resolveStripeReturn();
    return () => {
      cancelled = true;
    };
  }, [router, stripeSessionId, stripeState]);

  const selectedPlan = PLANS.find((p) => p.code === selected) || PLANS[0];

  const openRazorpayCheckout = useCallback(
    async (order) => {
      const Razorpay = await loadRazorpayScript();
      const planCode = order.planCode || selected;
      const planMeta = PLANS.find((p) => p.code === planCode) || selectedPlan;
      const name = planMeta.name;
      const options = {
        key: order.keyId,
        currency: order.currency || "INR",
        name: "Mirai Movies",
        description: `Mirai Gold — ${name}`,
        order_id: order.orderId,
        theme: { color: "#2563eb" },
        method: {
          upi: payMethod === "upi",
          card: payMethod === "card",
          netbanking: false,
          wallet: false,
          emi: false,
        },
        handler: async (response) => {
          setError("");
          setMessage("");
          setLoading(true);
          try {
            await apiPostAuth("/api/v1/monetization/subscriptions/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planCode,
            });
            setMessage("Payment successful. Redirecting…");
            window.dispatchEvent(new Event("mirai-auth-changed"));
            router.push("/ott");
          } catch (err) {
            setError(err?.message || "Could not verify payment.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };
      const rzp = new Razorpay(options);
      rzp.open();
    },
    [payMethod, router, selected, selectedPlan]
  );

  const handleLiveConfirm = useCallback(async () => {
    if (!pendingOrder) return;
    setRazorpayOpening(true);
    setError("");
    try {
      setLiveConfirmOpen(false);
      if (payMethod === "stripe") {
        if (pendingOrder?.checkoutUrl) {
          window.location.assign(pendingOrder.checkoutUrl);
          return;
        }
        throw new Error("Stripe checkout URL is missing.");
      }
      await openRazorpayCheckout(pendingOrder);
    } catch (err) {
      setError(err?.message || "Could not open Razorpay checkout.");
      setPendingOrder(null);
    } finally {
      setRazorpayOpening(false);
    }
  }, [openRazorpayCheckout, payMethod, pendingOrder]);

  async function handlePay() {
    setError("");
    setMessage("");
    setLoading(true);
    setLiveConfirmOpen(false);
    setPendingOrder(null);
    const returnPath =
      typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/purchase";
    try {
      const order =
        payMethod === "stripe"
          ? await apiPostAuth("/api/v1/monetization/subscriptions/create-stripe-checkout-session", {
              planCode: selected,
            })
          : await apiPostAuth("/api/v1/monetization/subscriptions/create-order", {
              planCode: selected,
              paymentMethod: payMethod,
            });
      setDemoModalOpen(false);
      setPendingOrder(order);
      setLiveConfirmOpen(true);
    } catch (err) {
      if (err?.status === 403 && err?.code === "PHONE_NOT_VERIFIED") {
        setError(err?.message || "Verify your mobile number first.");
        router.push(`/subscription?next=${encodeURIComponent(returnPath)}`);
      } else if (err?.status === 401) {
        router.push(`/login?returnUrl=${encodeURIComponent(returnPath)}`);
      } else if (err?.status === 503 && err?.code === "PAYMENT_NOT_CONFIGURED") {
        setDemoAmount(err?.amountInr ?? selectedPlan.amountInr);
        setDemoModalOpen(true);
        setError("");
      } else if (err?.status === 503 && err?.code === "STRIPE_NOT_CONFIGURED") {
        setError("Stripe is not configured on server. Add STRIPE_SECRET_KEY in .env.");
      } else {
        setError(err?.message || "Unable to start payment.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative">
      <h1 className="mb-2 text-3xl font-bold">Checkout</h1>
      <p className="mb-2 text-sm text-slate-300">Review your Mirai Gold selection and complete payment.</p>

      {gateMessage ? <p className="mb-4 text-sm text-zinc-500">{gateMessage}</p> : null}

      {!gateMessage && payMethod !== "stripe" && razorpayReady === false ? (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-950/30 p-3 text-sm text-amber-100">
          Razorpay isn&apos;t configured on the server. You&apos;ll see a demo UPI QR or card dialog after you tap Pay &mdash; add{" "}
          <code className="rounded bg-black/30 px-1">RAZORPAY_KEY_ID</code> and{" "}
          <code className="rounded bg-black/30 px-1">RAZORPAY_KEY_SECRET</code> for real payments.
        </p>
      ) : null}
      {!gateMessage && payMethod === "stripe" && stripeReady === false ? (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-950/30 p-3 text-sm text-amber-100">
          Stripe isn&apos;t configured on the server. Add <code className="rounded bg-black/30 px-1">STRIPE_SECRET_KEY</code> in <code className="rounded bg-black/30 px-1">.env</code>.
        </p>
      ) : null}
      {!gateMessage && stripeState === "cancelled" ? (
        <p className="mb-4 rounded-lg border border-zinc-700 bg-zinc-900/60 p-3 text-sm text-zinc-300">Stripe payment was cancelled.</p>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full border border-mxGold/40 bg-mxGold/10 px-3 py-1 text-mxGold">
          Pay with: <strong className="text-white">{payMethod === "card" ? "Card" : payMethod === "stripe" ? "Stripe" : "UPI"}</strong>
        </span>
        <button
          type="button"
          onClick={() => setPayMethod("upi")}
          className={`rounded-full px-3 py-1 ${payMethod === "upi" ? "bg-ottBlue text-white" : "border border-slate-700 text-slate-300"}`}
        >
          UPI
        </button>
        <button
          type="button"
          onClick={() => setPayMethod("card")}
          className={`rounded-full px-3 py-1 ${payMethod === "card" ? "bg-ottBlue text-white" : "border border-slate-700 text-slate-300"}`}
        >
          Card
        </button>
        <button
          type="button"
          onClick={() => setPayMethod("stripe")}
          className={`rounded-full px-3 py-1 ${payMethod === "stripe" ? "bg-ottBlue text-white" : "border border-slate-700 text-slate-300"}`}
        >
          Stripe
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
            <p className="mt-1 text-sm text-slate-300">{plan.priceLabel}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handlePay}
          disabled={loading || Boolean(gateMessage)}
          className="rounded bg-brandAccent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Preparing…" : "Pay now"}
        </button>
        <Link href="/subscription" className="rounded border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white">
          Back to membership
        </Link>
      </div>

      <PaymentDemoDialog
        open={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        amountInr={demoAmount}
        planName={selectedPlan.name}
        method={payMethod}
      />

      <LiveCheckoutDialog
        open={liveConfirmOpen}
        onClose={() => {
          setLiveConfirmOpen(false);
          setPendingOrder(null);
        }}
        onConfirm={handleLiveConfirm}
        planLabel={selectedPlan.name}
        amountInr={pendingOrder?.amountInr ?? selectedPlan.amountInr}
        payMethod={payMethod}
        confirming={razorpayOpening}
      />

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
