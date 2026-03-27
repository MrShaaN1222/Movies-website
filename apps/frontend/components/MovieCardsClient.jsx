"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiDeleteAuth, apiGetAuth, apiPostAuth } from "../lib/api";

export default function MovieCardsClient({ movies = [], showDetailsButton = false }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [favoritesBySlug, setFavoritesBySlug] = useState({});
  const [busyBySlug, setBusyBySlug] = useState({});

  useEffect(() => {
    function syncAuth() {
      setLoggedIn(Boolean(typeof window !== "undefined" && window.localStorage.getItem("mirai_token")));
    }
    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("mirai-auth-changed", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("mirai-auth-changed", syncAuth);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadFavorites() {
      if (!loggedIn) {
        if (!cancelled) setFavoritesBySlug({});
        return;
      }
      try {
        const data = await apiGetAuth("/api/v1/movies/favorites");
        if (!cancelled) {
          const slugs = Array.isArray(data?.slugs) ? data.slugs : [];
          setFavoritesBySlug(slugs.reduce((acc, slug) => ({ ...acc, [slug]: true }), {}));
        }
      } catch {
        if (!cancelled) setFavoritesBySlug({});
      }
    }
    loadFavorites();
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  async function toggleFavorite(slug) {
    if (!slug) return;
    setBusyBySlug((prev) => ({ ...prev, [slug]: true }));
    try {
      if (favoritesBySlug[slug]) {
        await apiDeleteAuth(`/api/v1/movies/favorites/${slug}`);
        setFavoritesBySlug((prev) => ({ ...prev, [slug]: false }));
      } else {
        await apiPostAuth(`/api/v1/movies/favorites/${slug}`, {});
        setFavoritesBySlug((prev) => ({ ...prev, [slug]: true }));
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("mirai-movie-favorites-changed", { detail: { slug } }));
      }
    } catch {
      // Keep this lightweight and non-blocking.
    } finally {
      setBusyBySlug((prev) => ({ ...prev, [slug]: false }));
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5">
      {movies.map((movie) => (
        <article key={movie._id || movie.slug} className="overflow-hidden rounded-lg bg-brandCard">
          <Link href={`/movie/${movie.slug}`} className="block">
            <div className="relative h-64 w-full bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={movie.poster} alt={movie.title} className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
              {loggedIn ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggleFavorite(movie.slug);
                  }}
                  disabled={Boolean(busyBySlug[movie.slug])}
                  aria-label={favoritesBySlug[movie.slug] ? `Remove ${movie.title} from favorites` : `Add ${movie.title} to favorites`}
                  className={`absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border text-white shadow-md backdrop-blur disabled:opacity-60 ${
                    favoritesBySlug[movie.slug] ? "border-rose-400 bg-rose-500/90" : "border-white/40 bg-black/55 hover:bg-black/75"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4C8.24 4 9.91 4.81 11 6.09 12.09 4.81 13.76 4 15.5 4A4.5 4.5 0 0 1 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>
              ) : null}
              <div className="absolute bottom-0 p-3">
                <p className="text-xs text-slate-300">{movie.releaseDate || "New release"}</p>
                <p className="line-clamp-3 text-sm font-semibold text-white">{movie.title}</p>
              </div>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-2 p-3">
            {showDetailsButton ? (
              <Link href={`/movie/${movie.slug}`} className="rounded bg-slate-700 px-2 py-1 text-xs">
                View Details
              </Link>
            ) : null}
            {(movie.providers || []).slice(0, 1).map((provider) => (
              <a
                key={`${movie.slug}-${provider.name}`}
                href={provider.url}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded bg-brandAccent px-2 py-1 text-xs"
              >
                Watch on {provider.name}
              </a>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
