"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGetAuth, apiPostAuth } from "../../lib/api";

const EMPTY_SUBSCRIPTION = { status: "inactive", planCode: null, provider: "razorpay" };

function hasToken() {
  return typeof window !== "undefined" && Boolean(window.localStorage.getItem("mirai_token"));
}

function SubscriptionFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextAfterVerify = searchParams.get("next");

  const [subscription, setSubscription] = useState(EMPTY_SUBSCRIPTION);
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [plan, setPlan] = useState("annual");
  const [payMethod, setPayMethod] = useState("upi");
  const [coupon, setCoupon] = useState("");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpHint, setOtpHint] = useState("");
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [phoneMsg, setPhoneMsg] = useState("");

  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [phoneGateOpen, setPhoneGateOpen] = useState(false);
  const otpSectionRef = useRef(null);

  const loggedIn = hasToken();
  const phoneVerified = Boolean(profile?.phoneVerified);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!hasToken()) {
        setProfile(null);
        setProfileReady(true);
        return;
      }
      setProfileReady(false);
      try {
        const me = await apiGetAuth("/api/v1/auth/me");
        if (!cancelled) {
          setProfile(me?.user || null);
          setLoadError("");
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
          setLoadError("");
        }
      } finally {
        if (!cancelled) setProfileReady(true);
      }
      try {
        const data = await apiGetAuth("/api/v1/monetization/subscriptions/me");
        if (!cancelled) setSubscription(data || EMPTY_SUBSCRIPTION);
      } catch (err) {
        if (!cancelled) setLoadError(err?.message || "");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  useEffect(() => {
    if (!nextAfterVerify || !hasToken() || !profileReady || !profile) return;
    if (!profile.phoneVerified) setPhoneGateOpen(true);
  }, [nextAfterVerify, profileReady, profile]);

  useEffect(() => {
    if (!phoneGateOpen) return;
    const id = requestAnimationFrame(() => {
      otpSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => cancelAnimationFrame(id);
  }, [phoneGateOpen]);

  const planCode = plan === "annual" ? "premium-yearly" : "premium-monthly";
  const purchaseHref = `/purchase?plan=${encodeURIComponent(planCode)}&method=${encodeURIComponent(payMethod)}`;

  async function requestOtp() {
    setPhoneMsg("");
    setOtpHint("");
    if (!hasToken()) {
      router.push(`/login?returnUrl=${encodeURIComponent("/subscription")}`);
      return;
    }
    setPhoneBusy(true);
    try {
      const res = await apiPostAuth("/api/v1/auth/phone/request-otp", { phone });
      setPhoneMsg(res?.message || "OTP sent.");
      if (res?.devOtp) setOtpHint(`Dev OTP: ${res.devOtp}`);
    } catch (err) {
      setPhoneMsg(err?.message || "Could not send OTP.");
    } finally {
      setPhoneBusy(false);
    }
  }

  async function verifyOtp() {
    setPhoneMsg("");
    setPhoneBusy(true);
    try {
      const res = await apiPostAuth("/api/v1/auth/phone/verify-otp", { phone, code: otp });
      setPhoneMsg(res?.message || "Verified.");
      setOtpHint("");
      if (res?.user) {
        setProfile(res.user);
      }
      const target = nextAfterVerify && nextAfterVerify.startsWith("/") && !nextAfterVerify.startsWith("//") ? nextAfterVerify : purchaseHref;
      router.push(target);
    } catch (err) {
      setPhoneMsg(err?.message || "Verification failed.");
    } finally {
      setPhoneBusy(false);
    }
  }

  function goLogin() {
    router.push(`/login?returnUrl=${encodeURIComponent("/subscription")}`);
  }

  function onJoinMiraiGold() {
    setPhoneMsg("");
    if (!hasToken()) {
      goLogin();
      return;
    }
    if (!phoneVerified) {
      setPhoneGateOpen(true);
      return;
    }
    setCheckoutBusy(true);
    try {
      router.push(purchaseHref);
    } finally {
      setCheckoutBusy(false);
    }
  }

  return (
    <div className="relative -mx-6 min-h-screen overflow-hidden bg-[#0a0a0c] text-zinc-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-35deg, transparent, transparent 12px, rgba(212,164,23,0.35) 12px, rgba(212,164,23,0.35) 13px)",
        }}
      />

      <div className="relative z-[1] border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/ott" className="text-zinc-400 transition hover:text-white" aria-label="Back">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
            </Link>
            <h1 className="text-sm font-semibold text-white md:text-base">Mirai Movies — Memberships</h1>
          </div>
          <button type="button" className="text-xs text-zinc-400 transition hover:text-mxGold md:text-sm">
            FAQs
          </button>
        </div>
        <p className="mx-auto mt-2 max-w-6xl text-[11px] text-zinc-500 md:text-xs">
          <Link href="/" className="hover:text-zinc-300">
            Home
          </Link>
          <span className="mx-1.5 text-zinc-600">/</span>
          <span>Memberships</span>
        </p>
      </div>

      <div className="relative z-[1] mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2 md:gap-14 md:px-8 lg:py-14">
        <div>
          <div className="mb-6 flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight text-white md:text-4xl">Mirai</span>
            <span className="bg-gradient-to-r from-mxGold to-yellow-200 bg-clip-text text-3xl font-black tracking-tight text-transparent md:text-4xl">
              GOLD
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl ring-2 ring-mxGold/35 shadow-[0_0_60px_-20px_rgba(212,164,23,0.45)]">
            <div className="grid grid-cols-2 gap-1 bg-black p-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[3/4] rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-950" />
              ))}
            </div>
          </div>
          {!hasToken() ? (
            <>
              <p className="mt-6 font-serif text-2xl leading-snug text-mxGold md:text-3xl">Watch with fewer interruptions.</p>
              <p className="mt-2 text-sm text-zinc-400">Full HD streaming · Ad-light experience · Offline downloads where available</p>

              <ol className="mt-8 space-y-2 text-sm text-zinc-400">
                <li className={hasToken() ? "text-emerald-400/90" : ""}>1. Sign in to your Mirai account</li>
                <li className={profileReady && phoneVerified ? "text-emerald-400/90" : ""}>2. Tap Join Mirai Gold, then verify mobile (OTP)</li>
                <li>3. Confirm plan and pay on the secure checkout page</li>
              </ol>
            </>
          ) : (
            <p className="mt-6 text-sm text-zinc-500">Choose your plan and payment method, then tap Join Mirai Gold to continue.</p>
          )}
        </div>

        <div className="rounded-2xl border border-mxGold/40 bg-zinc-950/80 p-5 shadow-[0_0_0_1px_rgba(212,164,23,0.12)_inset] md:p-7">
          {loadError && hasToken() ? (
            <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-950/30 p-3 text-sm text-amber-200">{loadError}</p>
          ) : null}

          {!hasToken() ? (
            <div className="mb-6 rounded-xl border border-ottBlue/30 bg-ottBlue/10 p-4 text-sm text-zinc-200">
              <p className="font-medium text-white">Login required</p>
              <p className="mt-1 text-zinc-400">Sign in before you can verify your phone or continue to checkout.</p>
              <button
                type="button"
                onClick={goLogin}
                className="mt-3 rounded-lg bg-ottBlue px-4 py-2 text-sm font-semibold text-white"
              >
                Sign in to continue
              </button>
            </div>
          ) : null}

          {hasToken() && profileReady && profile && phoneVerified ? (
            <p className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-200">
              Mobile verified: <span className="font-medium text-white">{profile.phone || "on file"}</span>
            </p>
          ) : null}

          {hasToken() && profileReady && !profile ? (
            <p className="mb-4 text-sm text-red-300">Could not load your profile. Try signing in again.</p>
          ) : null}

          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Choose your plan</h2>
            {subscription.status === "active" ? (
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">Active</span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setPlan("annual")}
            className={`relative mt-3 w-full rounded-xl border-2 p-4 text-left transition ${plan === "annual" ? "border-mxGold bg-mxGold/10" : "border-white/10 bg-black/40 hover:border-white/20"}`}
          >
            <span className="absolute left-3 top-3 rounded bg-mxGold px-2 py-0.5 text-[10px] font-bold text-black">Best value</span>
            <div className="mt-6 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-white">Annual</p>
                <p className="text-xs text-zinc-500">Maps to checkout: plan premium-yearly</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-mxGold">₹499 / year</p>
                <p className="text-[11px] text-zinc-500">~₹1.4 / day</p>
              </div>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${plan === "annual" ? "border-mxGold bg-mxGold" : "border-zinc-600"}`}
                aria-hidden
              >
                {plan === "annual" ? <span className="h-2 w-2 rounded-full bg-black" /> : null}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPlan("monthly")}
            className={`mt-3 w-full rounded-xl border-2 p-4 text-left transition ${plan === "monthly" ? "border-mxGold bg-mxGold/10" : "border-white/10 bg-black/40 hover:border-white/20"}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-white">Monthly</p>
                <p className="text-xs text-zinc-500">Maps to checkout: plan premium-monthly</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">₹99 / month</p>
              </div>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${plan === "monthly" ? "border-mxGold bg-mxGold" : "border-zinc-600"}`}
                aria-hidden
              >
                {plan === "monthly" ? <span className="h-2 w-2 rounded-full bg-black" /> : null}
              </span>
            </div>
          </button>

          <h3 className="mb-3 mt-8 text-sm font-semibold text-white">Select payment method</h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPayMethod("upi")}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-medium transition ${
                payMethod === "upi" ? "border-mxGold bg-mxGold/10 text-white" : "border-white/10 bg-black/40 text-zinc-300"
              }`}
            >
              UPI
              {payMethod === "upi" ? <span className="text-mxGold">✓</span> : null}
            </button>
            <button
              type="button"
              onClick={() => setPayMethod("card")}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-medium transition ${
                payMethod === "card" ? "border-mxGold bg-mxGold/10 text-white" : "border-white/10 bg-black/40 text-zinc-300"
              }`}
            >
              Card
              {payMethod === "card" ? <span className="text-mxGold">✓</span> : null}
            </button>
            <button
              type="button"
              onClick={() => setPayMethod("stripe")}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-medium transition ${
                payMethod === "stripe" ? "border-mxGold bg-mxGold/10 text-white" : "border-white/10 bg-black/40 text-zinc-300"
              }`}
            >
              Stripe
              {payMethod === "stripe" ? <span className="text-mxGold">✓</span> : null}
            </button>
          </div>

          <div className="mt-6 flex gap-2 rounded-xl border border-dashed border-white/20 bg-black/30 p-2">
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Got any coupon code?"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
            />
            <button
              type="button"
              className="shrink-0 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-200 transition hover:bg-zinc-700"
            >
              Apply
            </button>
          </div>

          <button
            type="button"
            disabled={checkoutBusy}
            onClick={onJoinMiraiGold}
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-mxGold to-yellow-500 py-3.5 text-center text-base font-bold text-black shadow-lg shadow-mxGold/20 transition hover:brightness-105 disabled:opacity-60"
          >
            join mirai gold
          </button>
          {!phoneVerified && hasToken() && !phoneGateOpen ? (
            <p className="mt-2 text-center text-[11px] text-zinc-500">Tap Join to verify your mobile number, then you&apos;ll go to checkout.</p>
          ) : null}
          {hasToken() && profileReady && profile && !phoneVerified && phoneGateOpen ? (
            <div ref={otpSectionRef} className="mt-6 rounded-xl border border-mxGold/40 bg-black/50 p-4">
              <h3 className="text-sm font-semibold text-mxGold">Verify mobile number</h3>
              <p className="mt-1 text-xs text-zinc-500">We send a one-time code. In development the API may return a dev OTP for testing.</p>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-3 w-full rounded-lg border border-white/15 bg-black/60 px-3 py-2.5 text-sm text-white outline-none focus:border-mxGold"
              />
              <button
                type="button"
                disabled={phoneBusy}
                onClick={requestOtp}
                className="mt-2 w-full rounded-lg border border-mxGold/50 bg-mxGold/10 py-2 text-sm font-semibold text-mxGold disabled:opacity-50"
              >
                {phoneBusy ? "Sending…" : "Send OTP"}
              </button>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="mt-3 w-full rounded-lg border border-white/15 bg-black/60 px-3 py-2.5 text-sm text-white outline-none focus:border-mxGold"
              />
              <button
                type="button"
                disabled={phoneBusy}
                onClick={verifyOtp}
                className="mt-2 w-full rounded-lg bg-mxGold py-2 text-sm font-bold text-black disabled:opacity-50"
              >
                {phoneBusy ? "Checking…" : "Verify & continue"}
              </button>
              {phoneMsg ? <p className="mt-3 text-xs text-zinc-300">{phoneMsg}</p> : null}
              {otpHint ? <p className="mt-1 text-xs font-mono text-yellow-200/90">{otpHint}</p> : null}
            </div>
          ) : null}

          {!hasToken() ? (
            <p className="mt-5 text-center text-sm text-zinc-400">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-ottBlue hover:underline">
                Sign in
              </Link>
            </p>
          ) : (
            <p className="mt-5 text-center text-sm text-zinc-500">
              <Link href="/ott" className="font-medium text-ottBlue hover:underline">
                Back to Mirai OTT
              </Link>
            </p>
          )}

          {subscription.status === "active" ? (
            <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-950/25 p-4 text-sm text-emerald-100">
              <p>
                Your subscription is <strong className="text-white">{subscription.status}</strong>
                {subscription.planCode ? (
                  <>
                    {" "}
                    · Plan <span className="font-medium text-white">{subscription.planCode}</span>
                  </>
                ) : null}
              </p>
              <Link href="/dashboard" className="mt-3 inline-block text-xs font-semibold text-ottBlue hover:underline">
                Go to dashboard
              </Link>
            </div>
          ) : null}

          {!hasToken() ? (
            <p className="mt-8 text-[10px] leading-relaxed text-zinc-600">
              Recurring billing until cancelled. By continuing you agree to our terms. Mirai Gold availability and pricing may vary by region.
            </p>
          ) : (
            <p className="mt-8 text-[10px] leading-relaxed text-zinc-600">
              By joining Mirai Gold you agree to our terms. Subscriptions renew until cancelled; pricing may vary by region.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] animate-pulse bg-[#0a0a0c]" aria-hidden />}>
      <SubscriptionFlow />
    </Suspense>
  );
}
