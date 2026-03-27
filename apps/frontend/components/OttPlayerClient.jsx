"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { apiDeleteAuth, apiGet, apiGetAuth, apiPostAuth } from "../lib/api";

const PREMIUM_BADGE = "/ott/premium-gold-bucket.png";
const SIGNIN_BADGE = "/ott/signin-to-watch.png";

function adultStorageKey(slug) {
  return `mirai-ott-adult-ok:${slug}`;
}

export default function OttPlayerClient({ slug }) {
  const videoRef = useRef(null);
  const [content, setContent] = useState(null);
  const [playback, setPlayback] = useState(null);
  const [status, setStatus] = useState("Loading...");
  const [statusCode, setStatusCode] = useState(0);
  const [adultOk, setAdultOk] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistBusy, setWatchlistBusy] = useState(false);
  const [watchlistHint, setWatchlistHint] = useState("");

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    setAdultOk(Boolean(window.sessionStorage.getItem(adultStorageKey(slug))));
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const info = await apiGet(`/api/v1/ott/${slug}`);
        if (!cancelled) setContent(info);

        const isAdult = Boolean(info?.isAdult);
        const canRequestPlayback = !isAdult || (typeof window !== "undefined" && window.sessionStorage.getItem(adultStorageKey(slug)));

        if (!canRequestPlayback) {
          if (!cancelled) {
            setPlayback(null);
            setStatusCode(0);
            setStatus("");
          }
          return;
        }

        try {
          const playbackData = await apiGetAuth(`/api/v1/ott/${slug}/playback`);
          if (!cancelled) {
            setPlayback(playbackData);
            setStatus("");
          }

          const progress = await apiGetAuth(`/api/v1/ott/${slug}/progress`);
          if (!cancelled && videoRef.current && progress?.seconds > 0) {
            videoRef.current.currentTime = progress.seconds;
          }
          const watchlistStatus = await apiGetAuth(`/api/v1/ott/watchlist/${slug}/status`);
          if (!cancelled) setInWatchlist(Boolean(watchlistStatus?.inWatchlist));
        } catch (error) {
          if (!cancelled) {
            setStatusCode(error?.status || 0);
            setStatus(error?.message || "Unable to load playback.");
          }
        }
      } catch (error) {
        if (!cancelled) {
          setStatusCode(error?.status || 0);
          setStatus(error?.message || "Unable to load content.");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, adultOk]);

  useEffect(() => {
    async function saveProgress() {
      const el = videoRef.current;
      if (!el || !playback) return;
      try {
        await apiPostAuth(`/api/v1/ott/${slug}/progress`, {
          seconds: Math.floor(el.currentTime || 0),
          completed: Boolean(el.ended),
          deviceId: "web",
        });
      } catch {
        // Silent fail so playback is uninterrupted.
      }
    }

    const timer = setInterval(saveProgress, 15000);
    const el = videoRef.current;
    if (el) {
      el.addEventListener("pause", saveProgress);
      el.addEventListener("ended", saveProgress);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", saveProgress);
    }

    return () => {
      clearInterval(timer);
      if (el) {
        el.removeEventListener("pause", saveProgress);
        el.removeEventListener("ended", saveProgress);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeunload", saveProgress);
      }
    };
  }, [slug, playback]);

  function confirmAdult() {
    window.sessionStorage.setItem(adultStorageKey(slug), "1");
    setAdultOk(true);
  }

  async function toggleWatchlist() {
    setWatchlistHint("");
    setWatchlistBusy(true);
    try {
      if (inWatchlist) {
        await apiDeleteAuth(`/api/v1/ott/watchlist/${slug}`);
        setInWatchlist(false);
        setWatchlistHint("Removed from watchlist.");
      } else {
        await apiPostAuth(`/api/v1/ott/watchlist/${slug}`, {});
        setInWatchlist(true);
        setWatchlistHint("Added to watchlist.");
      }
    } catch (error) {
      if (error?.status === 401) {
        setWatchlistHint("Sign in to manage your watchlist.");
      } else {
        setWatchlistHint("Could not update watchlist right now.");
      }
    } finally {
      setWatchlistBusy(false);
    }
  }

  if (!content) return <p className="text-zinc-300">{status || "OTT content not found."}</p>;

  const isAdult = Boolean(content.isAdult);
  const showAdultGate = isAdult && !adultOk;
  const premium = content.isPremium !== false;

  return (
    <section className="relative -mx-6 min-h-[70vh] bg-black text-zinc-100">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur md:px-8">
        <Link href="/ott" className="text-zinc-300 transition hover:text-white" aria-label="Back to OTT">
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold tracking-tight text-yellow-300 md:text-2xl">{content.title}</h1>
        <span className="w-6" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-6 md:px-8">
        {content.contentRating ? (
          <p className="mb-3 text-xs text-zinc-400">
            Rating: <span className="text-white">{content.contentRating}</span>
          </p>
        ) : null}

        <div className="relative overflow-hidden rounded-xl bg-zinc-950 ring-1 ring-white/10">
          <div className="relative aspect-video w-full bg-zinc-900">
            {content.posterUrl ? (
              <Image src={content.posterUrl} alt="" fill className={`object-cover ${showAdultGate || (!playback?.hlsUrl && statusCode) ? "brightness-[0.35]" : ""}`} sizes="(max-width:1024px) 100vw, 1024px" />
            ) : (
              <div className="h-full w-full bg-zinc-800" />
            )}

            {premium ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={PREMIUM_BADGE} alt="" className="pointer-events-none absolute bottom-3 left-3 z-[2] h-10 w-auto drop-shadow-lg" />
            ) : null}

            {!showAdultGate && playback?.hlsUrl ? (
              <video ref={videoRef} controls className="absolute inset-0 z-[2] h-full w-full bg-black">
                <source src={playback.hlsUrl} type="application/x-mpegURL" />
              </video>
            ) : (
              <div className="absolute inset-0 z-[1] flex items-center justify-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ottBlue text-white shadow-xl shadow-black/50">
                  <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-current" aria-hidden>
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                </span>
              </div>
            )}

            {showAdultGate ? (
              <div className="absolute bottom-0 left-0 z-[3] max-w-md p-4 md:p-6">
                <p className="text-lg font-semibold text-white">Adult Content</p>
                <p className="mt-1 text-sm text-zinc-300">I confirm that I am 18 years and above</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={confirmAdult}
                    className="inline-flex items-center gap-2 rounded-md bg-ottBlue px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                      <path d="M8 5v14l11-7L8 5z" />
                    </svg>
                    I am over 18
                  </button>
                  <Link
                    href="/ott"
                    className="inline-flex items-center justify-center rounded-md border border-white px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-white"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          {!playback?.hlsUrl && !showAdultGate ? (
            <div className="space-y-4 border-t border-white/10 bg-black/60 p-4">
              <p className="text-sm text-amber-200">{status || "Premium access required. Please login with an active subscription."}</p>

              {statusCode === 401 ? (
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={SIGNIN_BADGE} alt="Sign in to watch premium content" className="max-h-28 w-auto object-contain" />
                  <Link
                    href="/login"
                    className="inline-block rounded-md bg-ottBlue px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Sign in to continue
                  </Link>
                </div>
              ) : null}

              {statusCode === 402 ? (
                <div className="mt-1 flex flex-wrap gap-2">
                  <Link href="/purchase" className="inline-block rounded-md bg-ottBlue px-3 py-2 text-xs font-semibold text-white">
                    Purchase Premium
                  </Link>
                  <Link
                    href="/subscription"
                    className="inline-block rounded-md border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Membership
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-sm leading-relaxed text-zinc-400">{content.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleWatchlist}
            disabled={watchlistBusy}
            className="rounded-md border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {watchlistBusy ? "Updating..." : inWatchlist ? "Remove from watchlist" : `Watchlist ${content.title}`}
          </button>
          {watchlistHint ? <span className="text-xs text-zinc-400">{watchlistHint}</span> : null}
        </div>
      </div>
    </section>
  );
}
