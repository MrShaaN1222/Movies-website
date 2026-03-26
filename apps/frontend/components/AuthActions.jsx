"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthActions() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = window.localStorage.getItem("mirai_token");
    setIsLoggedIn(Boolean(token));
  }, []);

  function handleLogout() {
    window.localStorage.removeItem("mirai_token");
    setIsLoggedIn(false);
    router.push("/login");
  }

  if (isLoggedIn) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white transition hover:border-brandAccent"
      >
        Logout
      </button>
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
