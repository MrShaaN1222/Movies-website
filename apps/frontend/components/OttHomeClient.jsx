"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiGetAuth } from "../lib/api";

const HERO_AUTOPLAY_MS = 7000;

const PREMIUM_BADGE = "/ott/premium-gold-bucket.png";
const SIGNIN_BADGE = "/ott/signin-to-watch.png";

function filterByView(items, view) {
  if (!items?.length) return [];
  if (view === "shows") return items.filter((i) => i.type === "exclusive" || i.type === "course");
  if (view === "movies") return items.filter((i) => i.type === "short-film");
  if (view === "new") return [...items].reverse();
  return items;
}

function formatMinutes(seconds) {
  return Math.max(1, Math.floor((seconds || 0) / 60));
}

function OttPosterCard({ item, loggedIn, metaText }) {
  const poster = item.posterUrl;
  const premium = item.isPremium !== false;
  const showSignInGate = premium && !loggedIn;

  return (
    <Link
      href={`/ott/${item.slug}`}
      className="group relative block w-36 shrink-0 overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/5 transition hover:ring-ottBlue/60 sm:w-40 md:w-44"
    >
      <div className="relative aspect-[2/3] w-full">
        {poster ? (
          <Image src={poster} alt="" fill className="object-cover transition duration-300 group-hover:scale-105" sizes="176px" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-xs text-zinc-500">No poster</div>
        )}
        {item.contentRating ? (
          <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">{item.contentRating}</span>
        ) : null}
        {premium ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={PREMIUM_BADGE} alt="" className="pointer-events-none absolute bottom-2 left-2 z-[1] h-9 w-auto drop-shadow-md" />
        ) : null}
        {showSignInGate ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] flex justify-center bg-gradient-to-t from-black via-black/85 to-transparent px-2 pb-3 pt-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SIGNIN_BADGE} alt="Sign in to watch premium content" className="max-h-16 w-full max-w-[min(100%,220px)] object-contain object-bottom" />
          </div>
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ottBlue text-white shadow-lg">
            <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 fill-current" aria-hidden>
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          </span>
        </div>
      </div>
      <div className="border-t border-white/5 bg-black/50 px-2 py-2">
        <p className="line-clamp-2 text-xs font-medium text-white">{item.title}</p>
        <p className="mt-0.5 text-[10px] capitalize text-zinc-400">{String(item.type || "").replace(/-/g, " ")}</p>
        {metaText ? <p className="mt-1 text-[10px] text-ottBlue">{metaText}</p> : null}
      </div>
    </Link>
  );
}

function Row({ title, subtitle, children, id }) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white md:text-xl">{title}</h2>
          {subtitle ? <p className="text-sm text-zinc-400">{subtitle}</p> : null}
        </div>
        <span className="hidden text-sm text-ottBlue sm:inline">View all</span>
      </div>
      <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 pt-1 [scrollbar-width:thin]">{children}</div>
    </section>
  );
}

export default function OttHomeClient({ items = [], view = "all", section = "" }) {
  const [heroIndex, setHeroIndex] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [continueItems, setContinueItems] = useState([]);
  const [watchlistItems, setWatchlistItems] = useState([]);

  useEffect(() => {
    function sync() {
      setLoggedIn(Boolean(typeof window !== "undefined" && window.localStorage.getItem("mirai_token")));
    }
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("mirai-auth-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("mirai-auth-changed", sync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadSubscriptionStatus() {
      if (!loggedIn) {
        if (!cancelled) setHasActiveSubscription(false);
        return;
      }
      try {
        const data = await apiGetAuth("/api/v1/monetization/subscriptions/me");
        if (!cancelled) setHasActiveSubscription(data?.status === "active");
      } catch {
        if (!cancelled) setHasActiveSubscription(false);
      }
    }
    loadSubscriptionStatus();
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  useEffect(() => {
    let cancelled = false;
    async function loadUserRows() {
      if (!loggedIn) {
        if (!cancelled) {
          setContinueItems([]);
          setWatchlistItems([]);
        }
        return;
      }
      try {
        const [continueRows, watchlist] = await Promise.all([
          apiGetAuth("/api/v1/ott/progress/continue"),
          apiGetAuth("/api/v1/ott/watchlist"),
        ]);
        if (!cancelled) {
          setContinueItems(Array.isArray(continueRows) ? continueRows : []);
          setWatchlistItems(Array.isArray(watchlist) ? watchlist : []);
        }
      } catch {
        if (!cancelled) {
          setContinueItems([]);
          setWatchlistItems([]);
        }
      }
    }
    loadUserRows();
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  const list = useMemo(() => filterByView(items, view), [items, view]);
  const heroList = list.length ? list : items;
  const featured = heroList[heroIndex % heroList.length];

  useEffect(() => {
    setHeroIndex(0);
  }, [view, list.length]);

  useEffect(() => {
    if (heroList.length <= 1) return;
    const id = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroList.length);
    }, HERO_AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [heroList.length]);

  useEffect(() => {
    if (!section || typeof document === "undefined") return;
    const id = section === "continue" ? "continue-watching" : section === "watchlist" ? "watchlist" : "";
    if (!id) return;
    const node = document.getElementById(id);
    if (node) node.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [section, continueItems.length, watchlistItems.length]);

  return (
    <div className="relative -mx-6 min-h-screen bg-black text-zinc-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-zinc-900/80 to-black" />

      {featured ? (
        <div className="relative">
          <div className="relative h-[min(72vw,420px)] w-full overflow-hidden md:h-[min(52vw,480px)]">
            {featured.posterUrl ? (
              <Image
                src={featured.posterUrl}
                alt=""
                fill
                className="object-cover object-top opacity-60"
                priority
                unoptimized
              />
            ) : (
              <div className="h-full w-full bg-zinc-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
            <div className="relative z-[1] flex h-full max-w-7xl flex-col justify-end px-6 pb-10 pt-24 md:px-10">
              {featured.contentRating ? (
                <span className="mb-3 w-fit rounded border border-white/20 bg-black/50 px-2 py-0.5 text-xs text-white">{featured.contentRating}</span>
              ) : null}
              <p className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-ottBlue/90 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                Premium stream
              </p>
              <h1 className="max-w-xl text-3xl font-bold text-white drop-shadow md:text-4xl">{featured.title}</h1>
              <p className="mt-2 max-w-lg text-sm text-zinc-300">{featured.description}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  href={`/ott/${featured.slug}`}
                  className="inline-flex items-center gap-2 rounded-md bg-ottBlue px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ottBlue/25"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                  Play
                </Link>
                <Link
                  href={`/ott/${featured.slug}`}
                  className="rounded-md border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-medium text-white backdrop-blur"
                >
                  More info
                </Link>
                <Link href={hasActiveSubscription ? "/subscription/manage" : "/subscription"} className="text-sm text-mxGold underline-offset-4 hover:underline">
                  {hasActiveSubscription ? "Manage subscription" : "Upgrade to premium"}
                </Link>
              </div>
              {heroList.length > 1 ? (
                <div className="mt-6 flex gap-1.5">
                  {heroList.slice(0, 6).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Slide ${i + 1}`}
                      onClick={() => setHeroIndex(i)}
                      className={`h-1.5 rounded-full transition ${i === heroIndex % heroList.length ? "w-6 bg-white" : "w-2 bg-white/30 hover:bg-white/50"}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative z-[1] mx-auto max-w-7xl space-y-10 px-6 py-12 md:px-10">
        <Row id="continue-watching" title="Continue Watching" subtitle="Pick up where you left off">
          {continueItems.length > 0 ? (
            continueItems.map((row) => (
              <OttPosterCard
                key={row.progressId}
                item={row.content}
                loggedIn={loggedIn}
                metaText={`Resume from ${formatMinutes(row.seconds)} min`}
              />
            ))
          ) : (
            <div className="rounded-lg border border-white/10 bg-zinc-900/80 p-4 text-sm text-zinc-300">
              <p>No unfinished titles yet.</p>
              <Link href="/ott" className="mt-2 inline-block text-ottBlue hover:underline">
                Start watching on OTT
              </Link>
            </div>
          )}
        </Row>

        <Row id="watchlist" title="Watchlist" subtitle="Movies and shows saved for later">
          {watchlistItems.length > 0 ? (
            watchlistItems.map((item) => <OttPosterCard key={`watchlist-${item._id || item.slug}`} item={item} loggedIn={loggedIn} />)
          ) : (
            <div className="rounded-lg border border-white/10 bg-zinc-900/80 p-4 text-sm text-zinc-300">
              <p>Your watchlist is empty.</p>
              <Link href="/ott" className="mt-2 inline-block text-ottBlue hover:underline">
                Add movies to watchlist
              </Link>
            </div>
          )}
        </Row>

        <Row id="trending" title="Trending on Mirai OTT" subtitle="Handpicked originals and exclusives">
          {(list.length ? list : items).map((item) => (
            <OttPosterCard key={item._id || item.slug} item={item} loggedIn={loggedIn} />
          ))}
        </Row>

        <Row id="new" title="Recently added" subtitle="Fresh drops across movies, series, and courses">
          {[...(items || [])].reverse().map((item) => (
            <OttPosterCard key={`recent-${item._id || item.slug}`} item={item} loggedIn={loggedIn} />
          ))}
        </Row>
      </div>
    </div>
  );
}
