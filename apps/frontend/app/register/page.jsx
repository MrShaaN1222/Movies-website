"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiPost } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiPost("/api/v1/auth/register", { name, email, password });
      const loginData = await apiPost("/api/v1/auth/login", { email, password });
      if (loginData?.token) window.localStorage.setItem("mirai_token", loginData.token);
      router.push("/dashboard");
    } catch (err) {
      setError(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-xl bg-brandCard p-6">
      <h1 className="mb-2 text-2xl font-bold">Register</h1>
      <p className="mb-5 text-sm text-slate-300">Create your account to unlock personalized OTT features.</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-brandAccent"
        />
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
          minLength={6}
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
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-300">
        Already have an account?{" "}
        <Link href="/login" className="text-brandAccent">
          Login
        </Link>
      </p>
    </section>
  );
}
