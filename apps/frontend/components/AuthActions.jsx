"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

export default function AuthActions() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function syncAuthState() {
      const token = window.localStorage.getItem("mirai_token");
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
  }, [pathname]);

  function handleLogout() {
    window.localStorage.removeItem("mirai_token");
    setIsLoggedIn(false);
    window.dispatchEvent(new Event("mirai-auth-changed"));
    router.push("/login");
  }

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/subscription"
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white transition hover:border-brandAccent"
        >
          Subscription
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white transition hover:border-brandAccent"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white transition hover:border-brandAccent"
      >
        Login
      </Link>
      <Link
        href="/register"
        className="rounded-lg bg-brandAccent px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        Register
      </Link>
    </div>
  );
}
