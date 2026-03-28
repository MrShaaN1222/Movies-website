"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGetAuth } from "../../../lib/api";
import DashboardPosterCard, { movieCardImageUrl } from "../../../components/DashboardPosterCard";

export default function DashboardNonOttWishlistPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("mirai_token") : null;
      if (!token) {
        router.replace(`/login?returnUrl=${encodeURIComponent("/dashboard/non-ott-wishlist")}`);
        return;
      }
      try {
        const data = await apiGetAuth("/api/v1/movies/favorites");
        const slugs = Array.isArray(data?.slugs) ? data.slugs : [];
        const movies = await Promise.all(slugs.map((slug) => apiGetAuth(`/api/v1/movies/${slug}`)));
        if (!cancelled) {
          setItems(movies.filter(Boolean));
          setReady(true);
        }
      } catch {
        if (!cancelled) router.replace(`/login?returnUrl=${encodeURIComponent("/dashboard/non-ott-wishlist")}`);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) return <p className="text-sm text-slate-400">Loading non-OTT wishlist...</p>;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Non-OTT Wishlist</h1>
        <Link href="/dashboard" className="text-sm text-brandAccent">
          Back to dashboard
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="rounded bg-brandCard p-5">
          <p className="text-slate-300">No non-OTT movies in wishlist yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <DashboardPosterCard
              key={item._id || item.slug}
              href={`/movie/${item.slug}`}
              title={item.title}
              subtitle={item.releaseDate || "Latest"}
              imageUrl={movieCardImageUrl(item)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
