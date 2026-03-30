"use client";

import Image from "next/image";
import Link from "next/link";
import Hls from "hls.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiDeleteAuth, apiGetAuth, apiPostAuth } from "../lib/api";
import { OttPosterCard, getOttPreviewUrl } from "./OttHoverCard";

const HERO_BANNER_DELAY_MS = 3000;
const HERO_POSTER_ROTATE_MS = 7000;
const HERO_MAX_PREVIEW_SECONDS = 30;

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

function Row({ title, subtitle, children, id, viewAllHref }) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white md:text-xl">{title}</h2>
          {subtitle ? <p className="text-sm text-zinc-400">{subtitle}</p> : null}
        </div>
        <Link href={viewAllHref || "/ott"} className="hidden text-sm text-ottBlue hover:underline sm:inline">
          View all
        </Link>
      </div>
      <div className="-mx-1 flex gap-3 overflow-x-auto pb-5 pt-3 [overflow-y:visible] [scrollbar-width:thin]">{children}</div>
    </section>
  );
}

function getSectionData(section, { continueItems, watchlistItems, items, list }) {
  if (section === "continue") {
    return { title: "Continue Watching", subtitle: "Pick up where you left off", items: continueItems, type: "continue" };
  }
  if (section === "watchlist") {
    return { title: "Watchlist", subtitle: "Movies and shows saved for later", items: watchlistItems, type: "watchlist" };
  }
  if (section === "trending") {
    return { title: "Trending on Mirai OTT", subtitle: "Handpicked originals and exclusives", items: list.length ? list : items, type: "content" };
  }
  if (section === "new") {
    return { title: "Recently added", subtitle: "Fresh drops across movies, series, and courses", items: [...(items || [])].reverse(), type: "content" };
  }
  return null;
}

export default function OttHomeClient({ items = [], view = "all", section = "" }) {
  const heroVideoRef = useRef(null);
  const heroHlsRef = useRef(null);
  const heroAdvanceTimeoutRef = useRef(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [showHeroVideo, setShowHeroVideo] = useState(false);
  const [heroMuted, setHeroMuted] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [continueItems, setContinueItems] = useState([]);
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [watchlistBySlug, setWatchlistBySlug] = useState({});
  const [watchlistBusyBySlug, setWatchlistBusyBySlug] = useState({});
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const [heroVideoPlaying, setHeroVideoPlaying] = useState(false);

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
          const watchlistArray = Array.isArray(watchlist) ? watchlist : [];
          setWatchlistItems(watchlistArray);
          setWatchlistBySlug(
            watchlistArray.reduce((acc, item) => {
              if (item?.slug) acc[item.slug] = true;
              return acc;
            }, {})
          );
        }
      } catch {
        if (!cancelled) {
          setContinueItems([]);
          setWatchlistItems([]);
          setWatchlistBySlug({});
        }
      }
    }
    loadUserRows();
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  const list = useMemo(() => filterByView(items, view), [items, view]);
  const trendingRail = list.length ? list : items;
  const heroList = list.length ? list : items;
  const featured = heroList[heroIndex % heroList.length];
  const selectedSection = getSectionData(section, { continueItems, watchlistItems, items, list });
  const featuredPreviewUrl = getOttPreviewUrl(featured);

  function clearHeroAdvanceTimer() {
    if (heroAdvanceTimeoutRef.current) {
      window.clearTimeout(heroAdvanceTimeoutRef.current);
      heroAdvanceTimeoutRef.current = null;
    }
  }

  function moveToNextHero() {
    if (heroList.length <= 1) return;
    setHeroIndex((i) => (i + 1) % heroList.length);
  }

  function goToPrevHero() {
    if (heroList.length <= 1) return;
    setHeroIndex((i) => (i - 1 + heroList.length) % heroList.length);
  }

  function goToNextHero() {
    moveToNextHero();
  }

  useEffect(() => {
    setHeroIndex(0);
  }, [view, list.length]);

  useEffect(() => {
    setShowHeroVideo(false);
    setHeroVideoReady(false);
    setHeroVideoPlaying(false);
    clearHeroAdvanceTimer();
    if (!featuredPreviewUrl) {
      if (heroList.length > 1) {
        heroAdvanceTimeoutRef.current = window.setTimeout(moveToNextHero, HERO_POSTER_ROTATE_MS);
      }
      return undefined;
    }
    const id = window.setTimeout(() => setShowHeroVideo(true), HERO_BANNER_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [featured?._id, featured?.slug, featuredPreviewUrl, heroList.length]);

  useEffect(() => {
    const el = heroVideoRef.current;
    if (!(el instanceof HTMLVideoElement)) return undefined;
    if (!showHeroVideo || !featuredPreviewUrl) {
      el.pause();
      if (heroHlsRef.current) {
        heroHlsRef.current.destroy();
        heroHlsRef.current = null;
      } else {
        el.removeAttribute("src");
        el.load();
      }
      clearHeroAdvanceTimer();
      return undefined;
    }

    clearHeroAdvanceTimer();
    setHeroVideoReady(false);
    setHeroVideoPlaying(false);
    el.muted = heroMuted;
    el.loop = false;
    el.playsInline = true;
    el.autoplay = true;
    el.currentTime = 0;

    const onCanPlay = () => {
      setHeroVideoReady(true);
      el.play().then(() => setHeroVideoPlaying(true)).catch(() => setHeroVideoPlaying(false));
    };
    const onPlay = () => setHeroVideoPlaying(true);
    const onPause = () => setHeroVideoPlaying(false);
    const onEnded = () => moveToNextHero();
    const onLoadedMetadata = () => {
      if (heroList.length <= 1) return;
      const duration = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : HERO_MAX_PREVIEW_SECONDS;
      const previewSeconds = Math.min(duration, HERO_MAX_PREVIEW_SECONDS);
      clearHeroAdvanceTimer();
      heroAdvanceTimeoutRef.current = window.setTimeout(() => {
        moveToNextHero();
      }, Math.max(2, previewSeconds) * 1000);
    };

    el.addEventListener("canplay", onCanPlay);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("loadedmetadata", onLoadedMetadata);

    if (Hls.isSupported()) {
      heroHlsRef.current = new Hls({ enableWorker: true });
      heroHlsRef.current.loadSource(featuredPreviewUrl);
      heroHlsRef.current.attachMedia(el);
    } else {
      el.src = featuredPreviewUrl;
      el.load();
    }

    return () => {
      el.removeEventListener("canplay", onCanPlay);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
      clearHeroAdvanceTimer();
      if (heroHlsRef.current) {
        heroHlsRef.current.destroy();
        heroHlsRef.current = null;
      }
    };
  }, [showHeroVideo, featuredPreviewUrl, heroMuted, heroList.length]);

  useEffect(() => {
    const el = heroVideoRef.current;
    if (!(el instanceof HTMLVideoElement)) return;
    el.muted = heroMuted;
    if (showHeroVideo && featuredPreviewUrl) {
      el.play().catch(() => {});
    }
  }, [heroMuted, showHeroVideo, featuredPreviewUrl]);

  useEffect(() => {
    if (!section || typeof document === "undefined") return;
    const id =
      section === "continue"
        ? "continue-watching"
        : section === "watchlist"
          ? "watchlist"
          : section === "trending"
            ? "trending"
            : section === "new"
              ? "new"
              : "";
    if (!id) return;
    const node = document.getElementById(id);
    if (node) node.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [section, continueItems.length, watchlistItems.length]);

  async function toggleWatchlistForSlug(slug) {
    if (!slug) return;
    setWatchlistBusyBySlug((prev) => ({ ...prev, [slug]: true }));
    try {
      if (watchlistBySlug[slug]) {
        await apiDeleteAuth(`/api/v1/ott/watchlist/${slug}`);
        setWatchlistBySlug((prev) => ({ ...prev, [slug]: false }));
        setWatchlistItems((prev) => prev.filter((item) => item.slug !== slug));
      } else {
        await apiPostAuth(`/api/v1/ott/watchlist/${slug}`, {});
        const content = (items || []).find((item) => item.slug === slug);
        setWatchlistBySlug((prev) => ({ ...prev, [slug]: true }));
        if (content) {
          setWatchlistItems((prev) => (prev.some((item) => item.slug === slug) ? prev : [content, ...prev]));
        }
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("mirai-watchlist-changed", { detail: { slug } }));
      }
    } catch {
      // Keep UX responsive; OTT player shows full error handling.
    } finally {
      setWatchlistBusyBySlug((prev) => ({ ...prev, [slug]: false }));
    }
  }

  return (
    <div className="relative -mx-6 min-h-screen bg-black text-zinc-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-zinc-900/80 to-black" />

      {featured ? (
        <div className="relative">
          <div className="relative h-[min(76vw,500px)] w-full overflow-hidden md:h-[min(56vw,620px)]">
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
            {featuredPreviewUrl && showHeroVideo ? (
              <video
                ref={heroVideoRef}
                className={`absolute inset-0 z-0 h-full w-full object-cover object-top transition-opacity duration-700 ${
                  heroVideoReady && heroVideoPlaying ? "opacity-75" : "opacity-0"
                }`}
                muted={heroMuted}
                autoPlay
                loop
                playsInline
                preload="metadata"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
            <div className="relative z-[1] flex h-full max-w-7xl flex-col justify-end px-6 pb-12 pt-24 md:px-10">
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
                {featuredPreviewUrl ? (
                  <button
                    type="button"
                    onClick={() => setHeroMuted((v) => !v)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                    aria-label={heroMuted ? "Unmute autoplay preview" : "Mute autoplay preview"}
                    title={heroMuted ? "Unmute preview" : "Mute preview"}
                  >
                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-current" aria-hidden>
                      {heroMuted ? (
                        <path d="M16.5 12c0-1.8-1-3.3-2.5-4.1v8.2c1.5-.8 2.5-2.3 2.5-4.1zM19 12c0 2.8-1.6 5.2-4 6.3v-2.2c1.2-.8 2-2.2 2-4.1s-.8-3.3-2-4.1V5.7c2.4 1.1 4 3.5 4 6.3zM3 9v6h4l5 5V4L7 9H3zm17.7-2.3-1.4-1.4-15 15 1.4 1.4 15-15z" />
                      ) : (
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.8-1-3.3-2.5-4.1v8.2c1.5-.8 2.5-2.3 2.5-4.1zM14 3.2v2.1c2.9 1 5 3.7 5 6.7s-2.1 5.7-5 6.7v2.1c4-.9 7-4.5 7-8.8s-3-7.9-7-8.8z" />
                      )}
                    </svg>
                  </button>
                ) : null}
              </div>
              {heroList.length > 1 ? (
                <div className="mt-7 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={goToPrevHero}
                    aria-label="Previous autoplay card"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/35 bg-black/45 text-base font-bold text-white hover:bg-white/20"
                  >
                    {"<"}
                  </button>
                  <div className="flex items-center justify-center gap-2">
                    {heroList.slice(0, 8).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        aria-label={`Slide ${i + 1}`}
                        onClick={() => setHeroIndex(i)}
                        className={`rounded-full transition ${i === heroIndex % heroList.length ? "h-2.5 w-7 bg-white" : "h-2.5 w-2.5 bg-white/35 hover:bg-white/60"}`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={goToNextHero}
                    aria-label="Next autoplay card"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/35 bg-black/45 text-base font-bold text-white hover:bg-white/20"
                  >
                    {">"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative z-[1] mx-auto max-w-7xl space-y-10 px-6 py-12 md:px-10">
        {selectedSection ? (
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-white md:text-3xl">{selectedSection.title}</h2>
                <p className="text-sm text-zinc-400">{selectedSection.subtitle}</p>
              </div>
              <Link href="/ott" className="text-sm text-ottBlue hover:underline">
                Back to OTT home
              </Link>
            </div>
            {selectedSection.items.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-zinc-900/80 p-4 text-sm text-zinc-300">
                <p>No items found in this category yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {selectedSection.type === "continue"
                  ? selectedSection.items.map((row) => (
                      <OttPosterCard
                        key={row.progressId}
                        item={row.content}
                        loggedIn={loggedIn}
                        metaText={`Resume from ${formatMinutes(row.seconds)} min`}
                        inWatchlist={Boolean(watchlistBySlug[row.content?.slug])}
                        watchlistBusy={Boolean(watchlistBusyBySlug[row.content?.slug])}
                        onToggleWatchlist={toggleWatchlistForSlug}
                      />
                    ))
                  : selectedSection.items.map((item) => (
                      <OttPosterCard
                        key={`${selectedSection.type}-${item._id || item.slug}`}
                        item={item}
                        loggedIn={loggedIn}
                        inWatchlist={Boolean(watchlistBySlug[item.slug])}
                        watchlistBusy={Boolean(watchlistBusyBySlug[item.slug])}
                        onToggleWatchlist={toggleWatchlistForSlug}
                      />
                    ))}
              </div>
            )}
          </section>
        ) : null}
        {!selectedSection ? (
          <>
            <Row id="continue-watching" title="Continue Watching" subtitle="Pick up where you left off" viewAllHref="/ott?section=continue">
          {continueItems.length > 0 ? (
            continueItems.map((row) => (
              <OttPosterCard
                key={row.progressId}
                item={row.content}
                loggedIn={loggedIn}
                metaText={`Resume from ${formatMinutes(row.seconds)} min`}
                inWatchlist={Boolean(watchlistBySlug[row.content?.slug])}
                watchlistBusy={Boolean(watchlistBusyBySlug[row.content?.slug])}
                onToggleWatchlist={toggleWatchlistForSlug}
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

            <Row id="watchlist" title="Watchlist" subtitle="Movies and shows saved for later" viewAllHref="/ott?section=watchlist">
          {watchlistItems.length > 0 ? (
            watchlistItems.map((item) => (
              <OttPosterCard
                key={`watchlist-${item._id || item.slug}`}
                item={item}
                loggedIn={loggedIn}
                inWatchlist={Boolean(watchlistBySlug[item.slug])}
                watchlistBusy={Boolean(watchlistBusyBySlug[item.slug])}
                onToggleWatchlist={toggleWatchlistForSlug}
              />
            ))
          ) : (
            <div className="rounded-lg border border-white/10 bg-zinc-900/80 p-4 text-sm text-zinc-300">
              <p>Your watchlist is empty.</p>
              <Link href="/ott" className="mt-2 inline-block text-ottBlue hover:underline">
                Add movies to watchlist
              </Link>
            </div>
          )}
            </Row>

            <Row id="trending" title="Trending on Mirai OTT" subtitle="Handpicked originals and exclusives" viewAllHref="/ott?section=trending">
          {trendingRail.map((item) => (
            <OttPosterCard
              key={item._id || item.slug}
              item={item}
              loggedIn={loggedIn}
              inWatchlist={Boolean(watchlistBySlug[item.slug])}
              watchlistBusy={Boolean(watchlistBusyBySlug[item.slug])}
              onToggleWatchlist={toggleWatchlistForSlug}
            />
          ))}
            </Row>

            <Row id="new" title="Recently added" subtitle="Fresh drops across movies, series, and courses" viewAllHref="/ott?section=new">
          {[...(items || [])].reverse().map((item) => (
            <OttPosterCard
              key={`recent-${item._id || item.slug}`}
              item={item}
              loggedIn={loggedIn}
              inWatchlist={Boolean(watchlistBySlug[item.slug])}
              watchlistBusy={Boolean(watchlistBusyBySlug[item.slug])}
              onToggleWatchlist={toggleWatchlistForSlug}
            />
          ))}
            </Row>
          </>
        ) : null}
      </div>
    </div>
  );
}
