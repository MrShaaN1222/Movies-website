"use client";

import Image from "next/image";
import Link from "next/link";

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

/** Portrait OTT rail card (OTT home rows). Hover is poster-only (ring, play hint); no preview video. */
export function OttPosterCard({ item, loggedIn, metaText, inWatchlist, watchlistBusy, onToggleWatchlist }) {
  const poster = item.posterUrl;
  const premium = item.isPremium !== false;
  const showSignInGate = premium && !loggedIn;

  return (
    <Link href={`/ott/${item.slug}`} className="group relative block w-36 shrink-0 sm:w-40 md:w-44">
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
    </Link>
  );
}

/**
 * Landscape rail (detail: episodes, related). Poster-only hover; no preview video.
 * @param {string|null} props.href - If null, renders a static div (e.g. episode rail).
 */
export function OttLandscapeHoverCard({
  href,
  item,
  widthClass = "w-52",
  footerTitle,
  footerMeta,
  loggedIn = false,
  inWatchlist = false,
  watchlistBusy = false,
  onToggleWatchlist,
  popoverDescription,
}) {
  const poster = item?.posterUrl;
  const premium = item?.isPremium !== false;
  const showSignInGate = premium && !loggedIn;
  const showWatchlist = Boolean(loggedIn && onToggleWatchlist && item?.slug);
  const title = footerTitle ?? item?.title;
  const meta = footerMeta ?? (item?.type ? String(item.type).replace(/-/g, " ") : "");

  const inner = (
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
        {showWatchlist ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleWatchlist(item.slug);
            }}
            disabled={watchlistBusy}
            aria-label={inWatchlist ? `Remove ${title} from watchlist` : `Add ${title} to watchlist`}
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
  );

  const shellClass = `group relative shrink-0 ${widthClass}`;

  if (href) {
    return (
      <Link href={href} className={shellClass}>
        {inner}
      </Link>
    );
  }

  return <div className={shellClass}>{inner}</div>;
}
