"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiPost } from "../../lib/api";

function safeReturnUrl(raw) {
  if (!raw || typeof raw !== "string") return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = safeReturnUrl(searchParams.get("returnUrl"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiPost("/api/v1/auth/login", { email, password });
      if (!data?.token) throw new Error("Login failed. No token received.");
      window.localStorage.setItem("mirai_token", data.token);
      window.dispatchEvent(new Event("mirai-auth-changed"));
      router.push(returnUrl);
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-xl bg-brandCard p-6">
      <h1 className="mb-2 text-2xl font-bold">Login</h1>
      <p className="mb-5 text-sm text-slate-300">Sign in to access premium OTT playback and checkout.</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-brandAccent"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-brandAccent"
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-brandAccent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-300">
        New user?{" "}
        <Link href={`/register?returnUrl=${encodeURIComponent(returnUrl)}`} className="text-brandAccent">
          Create an account
        </Link>
      </p>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md rounded-xl bg-brandCard p-6 text-sm text-slate-400">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
