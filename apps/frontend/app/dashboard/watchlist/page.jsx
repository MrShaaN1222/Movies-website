"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGetAuth } from "../../../lib/api";

export default function DashboardWatchlistPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("mirai_token") : null;
      if (!token) {
        router.replace(`/login?returnUrl=${encodeURIComponent("/dashboard/watchlist")}`);
        return;
      }
      try {
        const data = await apiGetAuth("/api/v1/ott/watchlist");
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : []);
          setReady(true);
        }
      } catch {
        if (!cancelled) router.replace(`/login?returnUrl=${encodeURIComponent("/dashboard/watchlist")}`);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) return <p className="text-sm text-slate-400">Loading watchlist...</p>;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Watchlist</h1>
        <Link href="/dashboard" className="text-sm text-brandAccent">
          Back to dashboard
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="rounded bg-brandCard p-5">
          <p className="text-slate-300">No movies in your watchlist yet.</p>
          <Link href="/ott" className="mt-3 inline-block rounded bg-brandAccent px-4 py-2 text-sm font-semibold text-white">
            Add movies to watchlist
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <Link key={item._id || item.slug} href={`/ott/${item.slug}`} className="rounded bg-brandCard p-4 transition hover:bg-brandCard/80">
              <p className="font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-xs capitalize text-slate-400">{String(item.type || "").replace(/-/g, " ")}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
