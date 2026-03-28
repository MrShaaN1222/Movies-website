"use client";

import Image from "next/image";
import Link from "next/link";
import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

const SIGNIN_BADGE = "/ott/signin-to-watch.png";

export function getOttPreviewUrl(item, previewFallback) {
  const a = item || {};
  const b = previewFallback || {};
  return (
    a.trailerHlsUrl ||
    a.previewHlsUrl ||
    a.hlsPreviewUrl ||
    a.hlsUrl ||
    b.trailerHlsUrl ||
    b.previewHlsUrl ||
    b.hlsPreviewUrl ||
    b.hlsUrl ||
    ""
  );
}

function useOttCardHoverVideo(isHovered, previewUrl, previewMuted) {
  const cardVideoRef = useRef(null);
  const cardHlsRef = useRef(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);

  useEffect(() => {
    const el = cardVideoRef.current;
    if (!(el instanceof HTMLVideoElement)) return undefined;
    if (!isHovered || !previewUrl) {
      el.pause();
      setPreviewReady(false);
      setPreviewPlaying(false);
      if (cardHlsRef.current) {
        cardHlsRef.current.destroy();
        cardHlsRef.current = null;
      } else {
        el.removeAttribute("src");
        el.load();
      }
      return undefined;
    }

    el.muted = previewMuted;
    el.loop = true;
    el.playsInline = true;
    el.autoplay = true;
    el.currentTime = 0;

    const onCanPlay = () => {
      setPreviewReady(true);
      el.play().then(() => setPreviewPlaying(true)).catch(() => setPreviewPlaying(false));
    };
    const onPlay = () => setPreviewPlaying(true);
    const onPause = () => setPreviewPlaying(false);

    el.addEventListener("canplay", onCanPlay);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);

    if (Hls.isSupported()) {
      cardHlsRef.current = new Hls({ enableWorker: true });
      cardHlsRef.current.loadSource(previewUrl);
      cardHlsRef.current.attachMedia(el);
    } else {
      el.src = previewUrl;
      el.load();
    }

    return () => {
      el.removeEventListener("canplay", onCanPlay);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      if (cardHlsRef.current) {
        cardHlsRef.current.destroy();
        cardHlsRef.current = null;
      }
    };
  }, [isHovered, previewUrl, previewMuted]);

  useEffect(() => {
    const el = cardVideoRef.current;
    if (!(el instanceof HTMLVideoElement)) return;
    el.muted = previewMuted;
    if (isHovered && previewUrl) {
      el.play().catch(() => {});
    }
  }, [previewMuted, isHovered, previewUrl]);

  return { cardVideoRef, previewReady, previewPlaying };
}

function OttHoverPopoverPanel({
  poster,
  item,
  previewUrl,
  cardVideoRef,
  previewReady,
  previewPlaying,
  previewMuted,
  setPreviewMuted,
  loggedIn,
  inWatchlist,
  watchlistBusy,
  onToggleWatchlist,
  showWatchlist,
  typeLabel,
  description,
}) {
  const title = item?.title || "Title";
  const typeLine = typeLabel ?? String(item?.type || "").replace(/-/g, " ");
  return (
    <div className="absolute left-1/2 top-0 z-30 w-[17rem] -translate-x-1/2 -translate-y-2 overflow-hidden rounded-xl border border-white/15 bg-slate-900 shadow-2xl shadow-black/80 group-first:left-0 group-first:translate-x-0 group-last:left-auto group-last:right-0 group-last:translate-x-0">
      <div className="relative aspect-video w-full bg-black">
        {poster ? (
          <Image src={poster} alt="" fill className="object-cover" sizes="272px" unoptimized />
        ) : (
          <div className="h-full w-full bg-zinc-800" />
        )}
        {previewUrl ? (
          <video
            ref={cardVideoRef}
            className={`absolute inset-0 z-[1] h-full w-full object-cover transition-opacity duration-300 ${
              previewReady && previewPlaying ? "opacity-100" : "opacity-0"
            }`}
            muted={previewMuted}
            autoPlay
            loop
            playsInline
            preload="metadata"
          />
        ) : null}
        {previewUrl ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setPreviewMuted((prev) => !prev);
            }}
            aria-label={previewMuted ? `Unmute preview for ${title}` : `Mute preview for ${title}`}
            className="absolute bottom-2 left-2 z-[4] inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/45 bg-black/60 text-white backdrop-blur hover:bg-black/80"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
              {previewMuted ? (
                <path d="M16.5 12c0-1.8-1-3.3-2.5-4.1v8.2c1.5-.8 2.5-2.3 2.5-4.1zM19 12c0 2.8-1.6 5.2-4 6.3v-2.2c1.2-.8 2-2.2 2-4.1s-.8-3.3-2-4.1V5.7c2.4 1.1 4 3.5 4 6.3zM3 9v6h4l5 5V4L7 9H3zm17.7-2.3-1.4-1.4-15 15 1.4 1.4 15-15z" />
              ) : (
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.8-1-3.3-2.5-4.1v8.2c1.5-.8 2.5-2.3 2.5-4.1zM14 3.2v2.1c2.9 1 5 3.7 5 6.7s-2.1 5.7-5 6.7v2.1c4-.9 7-4.5 7-8.8s-3-7.9-7-8.8z" />
              )}
            </svg>
          </button>
        ) : null}
        <div className="absolute inset-0 z-[2] flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ottBlue/90 text-white shadow-lg">
            <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-current" aria-hidden>
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          </span>
        </div>
      </div>
      <div className="space-y-2 bg-slate-900 px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-ottBlue px-2 py-1 text-xs font-semibold text-white">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
            Play
          </span>
          {showWatchlist && item?.slug ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                title={inWatchlist ? "Remove from wishlist" : "Add to wishlist"}
                aria-label={inWatchlist ? `Remove ${title} from wishlist` : `Add ${title} to wishlist`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onToggleWatchlist(item.slug);
                }}
                disabled={watchlistBusy}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  inWatchlist ? "border-rose-400 bg-rose-500/90" : "border-white/30 bg-transparent hover:bg-white/10"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4C8.24 4 9.91 4.81 11 6.09 12.09 4.81 13.76 4 15.5 4A4.5 4.5 0 0 1 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
              <button
                type="button"
                title="More info"
                aria-label={`More info about ${title}`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/30 text-white transition hover:bg-white/10"
              >
                i
              </button>
            </div>
          ) : null}
        </div>
        <p className="line-clamp-2 text-base font-semibold leading-tight text-white">{title}</p>
        {typeLine ? <p className="text-xs capitalize text-zinc-300">{typeLine}</p> : null}
        {item?.contentRating ? (
          <span className="inline-block rounded border border-white/50 px-1.5 py-0.5 text-[10px] font-medium text-white">{item.contentRating}</span>
        ) : null}
        {description ? <p className="line-clamp-2 text-xs text-zinc-400">{description}</p> : null}
      </div>
    </div>
  );
}

/** Portrait OTT rail card (OTT home rows). */
export function OttPosterCard({ item, loggedIn, metaText, inWatchlist, watchlistBusy, onToggleWatchlist }) {
  const [isHovered, setIsHovered] = useState(false);
  const [previewMuted, setPreviewMuted] = useState(true);
  const previewUrl = getOttPreviewUrl(item);
  const { cardVideoRef, previewReady, previewPlaying } = useOttCardHoverVideo(isHovered, previewUrl, previewMuted);

  const poster = item.posterUrl;
  const premium = item.isPremium !== false;
  const showSignInGate = premium && !loggedIn;
  const showWatchlist = Boolean(loggedIn && onToggleWatchlist);

  return (
    <Link
      href={`/ott/${item.slug}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative block w-36 shrink-0 sm:w-40 md:w-44"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/5 transition group-hover:ring-ottBlue/60">
        {poster ? (
          <Image src={poster} alt="" fill className="object-cover transition duration-300 group-hover:scale-105" sizes="176px" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-xs text-zinc-500">No poster</div>
        )}
        {item.contentRating ? (
          <span className="absolute left-2 top-2 z-[3] rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">{item.contentRating}</span>
        ) : null}
        {premium ? (
          <span className="pointer-events-none absolute right-2 top-2 z-[3] inline-flex items-center gap-1 rounded-full bg-amber-400/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-black shadow-md">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
              <path d="M4 18h16l-1.4-8.4-4.7 3.5L12 6 10.1 13.1 5.4 9.6 4 18zm1.5 2a1 1 0 1 1 0-2h13a1 1 0 1 1 0 2h-13z" />
            </svg>
            Premium
          </span>
        ) : null}
        {showSignInGate ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] flex justify-center bg-gradient-to-t from-black via-black/85 to-transparent px-2 pb-3 pt-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SIGNIN_BADGE} alt="Sign in to watch premium content" className="max-h-16 w-full max-w-[min(100%,220px)] object-contain object-bottom" />
          </div>
        ) : null}
        {loggedIn ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleWatchlist(item.slug);
            }}
            disabled={watchlistBusy}
            aria-label={inWatchlist ? `Remove ${item.title} from watchlist` : `Add ${item.title} to watchlist`}
            className={`absolute bottom-2 right-2 z-[4] inline-flex h-8 w-8 items-center justify-center rounded-full border text-white shadow-md backdrop-blur disabled:cursor-not-allowed disabled:opacity-60 ${
              inWatchlist ? "border-rose-400 bg-rose-500/90" : "border-white/40 bg-black/55 hover:bg-black/75"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4C8.24 4 9.91 4.81 11 6.09 12.09 4.81 13.76 4 15.5 4A4.5 4.5 0 0 1 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        ) : null}
        <div className="absolute inset-0 z-[2] flex items-center justify-center opacity-0 transition group-hover:opacity-100">
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

      {isHovered ? (
        <OttHoverPopoverPanel
          poster={poster}
          item={item}
          previewUrl={previewUrl}
          cardVideoRef={cardVideoRef}
          previewReady={previewReady}
          previewPlaying={previewPlaying}
          previewMuted={previewMuted}
          setPreviewMuted={setPreviewMuted}
          loggedIn={loggedIn}
          inWatchlist={inWatchlist}
          watchlistBusy={watchlistBusy}
          onToggleWatchlist={onToggleWatchlist}
          showWatchlist={showWatchlist}
        />
      ) : null}
    </Link>
  );
}

/**
 * Landscape thumbnail with the same hover preview as OTT home (detail page: episodes, related).
 * @param {object} props
 * @param {string|null} props.href - If null, renders a static div (e.g. episode rail).
 */
export function OttLandscapeHoverCard({
  href,
  item,
  previewFallback,
  widthClass = "w-52",
  footerTitle,
  footerMeta,
  loggedIn = false,
  inWatchlist = false,
  watchlistBusy = false,
  onToggleWatchlist,
  typeLabel,
  popoverDescription,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [previewMuted, setPreviewMuted] = useState(true);
  const previewUrl = getOttPreviewUrl(item, previewFallback);
  const { cardVideoRef, previewReady, previewPlaying } = useOttCardHoverVideo(isHovered, previewUrl, previewMuted);

  const poster = item?.posterUrl;
  const premium = item?.isPremium !== false;
  const showSignInGate = premium && !loggedIn;
  const showWatchlist = Boolean(loggedIn && onToggleWatchlist && item?.slug);
  const title = footerTitle ?? item?.title;
  const meta = footerMeta ?? (item?.type ? String(item.type).replace(/-/g, " ") : "");

  const inner = (
    <>
      <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900/80 ring-1 ring-white/5 transition group-hover:ring-ottBlue/50">
        <div className="relative aspect-video w-full bg-zinc-800">
          {poster ? (
            <Image src={poster} alt="" fill className="object-cover transition duration-300 group-hover:scale-[1.02]" sizes="256px" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">No poster</div>
          )}
          {item?.contentRating ? (
            <span className="absolute left-2 top-2 z-[3] rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">{item.contentRating}</span>
          ) : null}
          {premium ? (
            <span className="pointer-events-none absolute right-2 top-2 z-[3] inline-flex items-center gap-1 rounded-full bg-amber-400/95 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-black shadow-md">
              Premium
            </span>
          ) : null}
          {showSignInGate ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] flex justify-center bg-gradient-to-t from-black via-black/80 to-transparent px-2 pb-2 pt-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={SIGNIN_BADGE} alt="" className="max-h-12 w-full max-w-[180px] object-contain object-bottom" />
            </div>
          ) : null}
          <div className="absolute inset-0 z-[2] flex items-center justify-center opacity-0 transition group-hover:opacity-100">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ottBlue text-white shadow-lg">
              <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 fill-current" aria-hidden>
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            </span>
          </div>
        </div>
        <div className="p-2">
          <p className="line-clamp-1 text-sm font-semibold text-white">{title}</p>
          {meta ? <p className="text-xs capitalize text-zinc-400">{meta}</p> : null}
          {popoverDescription ? <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500">{popoverDescription}</p> : null}
        </div>
      </div>
      {isHovered ? (
        <OttHoverPopoverPanel
          poster={poster}
          item={item}
          previewUrl={previewUrl}
          cardVideoRef={cardVideoRef}
          previewReady={previewReady}
          previewPlaying={previewPlaying}
          previewMuted={previewMuted}
          setPreviewMuted={setPreviewMuted}
          loggedIn={loggedIn}
          inWatchlist={inWatchlist}
          watchlistBusy={watchlistBusy}
          onToggleWatchlist={onToggleWatchlist}
          showWatchlist={showWatchlist}
          typeLabel={typeLabel}
          description={popoverDescription}
        />
      ) : null}
    </>
  );

  const shellClass = `group relative shrink-0 ${widthClass}`;

  if (href) {
    return (
      <Link href={href} className={shellClass} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={shellClass} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      {inner}
    </div>
  );
}
