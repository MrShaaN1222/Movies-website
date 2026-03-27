"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGetAuth } from "../lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");

  useEffect(() => {
    function syncAuthState() {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("mirai_token") : null;
      setIsLoggedIn(Boolean(token));
    }

    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("focus", syncAuthState);
    window.addEventListener("mirai-auth-changed", syncAuthState);
    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("focus", syncAuthState);
      window.removeEventListener("mirai-auth-changed", syncAuthState);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      if (!isLoggedIn) {
        setAccountEmail("");
        return;
      }
      try {
        const me = await apiGetAuth("/api/v1/auth/me");
        if (!cancelled) setAccountEmail(me?.user?.email || "");
      } catch {
        if (!cancelled) setAccountEmail("");
      }
    }
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  function maskEmail(value) {
    if (!value || !value.includes("@")) return "your account email";
    const [name, domain] = value.split("@");
    if (!name) return `***@${domain}`;
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name.slice(0, 2)}***@${domain}`;
  }

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch(`${API_URL}/api/v1/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to subscribe.");
      }

      setStatus({ type: "success", message: data?.message || "Subscribed successfully." });
      setEmail("");
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Something went wrong. Try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      {isLoggedIn ? (
        <>
          <p className="text-xs uppercase tracking-wide text-slate-400">Notification preferences</p>
          <h3 className="mt-1 text-base font-semibold text-white">Manage your alerts from dashboard</h3>
          <p className="mt-2 text-xs text-slate-400">
            Subscribed as <span className="font-medium text-slate-200">{maskEmail(accountEmail)}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/dashboard/notifications"
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200"
            >
              Manage notifications
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs uppercase tracking-wide text-slate-400">Subscribe for latest updates</p>
          <h3 className="mt-1 text-base font-semibold text-white">Get notified about new movies and series</h3>
          <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brandAccent"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brandAccent px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        </>
      )}
      {status.message ? (
        <p className={`mt-2 text-xs ${status.type === "success" ? "text-emerald-400" : "text-rose-400"}`}>{status.message}</p>
      ) : null}
    </section>
  );
}
