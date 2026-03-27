"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { apiGetAuth } from "../lib/api";

export default function GoldNavButton() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("mirai_token") : null;
      const loggedIn = Boolean(token);
      if (cancelled) return;
      setIsLoggedIn(loggedIn);
      if (!loggedIn) {
        setHasActiveSubscription(false);
        setReady(true);
        return;
      }

      try {
        const sub = await apiGetAuth("/api/v1/monetization/subscriptions/me");
        if (cancelled) return;
        setHasActiveSubscription(sub?.status === "active");
      } catch {
        if (!cancelled) setHasActiveSubscription(false);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("mirai-auth-changed", sync);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("mirai-auth-changed", sync);
    };
  }, [pathname]);

  if (!ready) return null;

  const href = isLoggedIn && hasActiveSubscription ? "/subscription/manage" : "/subscription";
  const label = isLoggedIn && hasActiveSubscription ? "Manage Plan" : "Join Mirai Gold";

  return (
    <Link
      href={href}
      className="hidden shrink-0 items-center gap-2 rounded-md border border-mxGold/70 bg-gradient-to-r from-mxGold/15 to-yellow-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-mxGold shadow-[0_0_0_1px_rgba(212,164,23,0.35)_inset] sm:inline-flex"
    >
      <span aria-hidden className="text-sm leading-none">
        ◆
      </span>
      {label}
    </Link>
  );
}
