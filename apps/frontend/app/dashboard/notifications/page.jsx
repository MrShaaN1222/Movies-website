"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGetAuth } from "../../../lib/api";

const PREFS_KEY = "mirai_notification_prefs";
const DEFAULT_PREFS = {
  movies: true,
  series: true,
  premium: true,
  offers: false,
};

function maskEmail(value) {
  if (!value || !value.includes("@")) return "your account email";
  const [name, domain] = value.split("@");
  if (!name) return `***@${domain}`;
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
}

export default function DashboardNotificationsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(PREFS_KEY) : null;
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setPrefs((prev) => ({ ...prev, ...parsed }));
    } catch {
      // Ignore invalid local value.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("mirai_token") : null;
      if (!token) {
        router.replace(`/login?returnUrl=${encodeURIComponent("/dashboard/notifications")}`);
        return;
      }
      try {
        const me = await apiGetAuth("/api/v1/auth/me");
        if (cancelled) return;
        if (!me?.user) {
          router.replace(`/login?returnUrl=${encodeURIComponent("/dashboard/notifications")}`);
          return;
        }
        setAccountEmail(me.user.email || "");
        setReady(true);
      } catch {
        if (!cancelled) router.replace(`/login?returnUrl=${encodeURIComponent("/dashboard/notifications")}`);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function updatePref(key, checked) {
    setPrefs((prev) => ({ ...prev, [key]: checked }));
    setStatus({ type: "", message: "" });
  }

  function savePrefs() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    }
    setStatus({ type: "success", message: "Notification preferences saved." });
  }

  function resetPrefs() {
    setPrefs(DEFAULT_PREFS);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(DEFAULT_PREFS));
    }
    setStatus({ type: "success", message: "Preferences reset to default." });
  }

  if (!ready) {
    return <p className="text-sm text-slate-400">Loading notification preferences…</p>;
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Notification Preferences</h1>
          <p className="mt-1 text-sm text-slate-400">
            Choose what updates you want from Mirai.
          </p>
        </div>
        <Link href="/dashboard" className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900">
          Back to dashboard
        </Link>
      </div>

      <div className="rounded-xl border border-slate-800 bg-brandCard p-5">
        <p className="text-xs uppercase tracking-wide text-slate-400">Subscribed account</p>
        <p className="mt-1 text-sm text-slate-200">{maskEmail(accountEmail)}</p>

        <div className="mt-5 grid gap-2">
          {[
            ["movies", "New movie releases"],
            ["series", "New series episodes"],
            ["premium", "Premium drops and exclusives"],
            ["offers", "Special offers and discounts"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-200">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={Boolean(prefs[key])}
                onChange={(event) => updatePref(key, event.target.checked)}
                className="h-4 w-4 accent-brandAccent"
              />
            </label>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={savePrefs} className="rounded-lg bg-brandAccent px-4 py-2 text-sm font-semibold text-white">
            Save preferences
          </button>
          <button type="button" onClick={resetPrefs} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200">
            Reset defaults
          </button>
        </div>

        {status.message ? (
          <p className={`mt-3 text-xs ${status.type === "success" ? "text-emerald-400" : "text-rose-400"}`}>{status.message}</p>
        ) : null}
      </div>
    </section>
  );
}
