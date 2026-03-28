"use client";

import Image from "next/image";
import Hls from "hls.js";
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
  const playerShellRef = useRef(null);
  const hlsRef = useRef(null);
  const boostTimeoutRef = useRef(null);
  const boostPreviousRateRef = useRef(1);
  const boostActiveRef = useRef(false);
  const controlsHideTimerRef = useRef(null);
  const [content, setContent] = useState(null);
  const [playback, setPlayback] = useState(null);
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const [status, setStatus] = useState("Loading...");
  const [statusCode, setStatusCode] = useState(0);
  const [adultOk, setAdultOk] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistBusy, setWatchlistBusy] = useState(false);
  const [watchlistHint, setWatchlistHint] = useState("");
  const [qualityOptions, setQualityOptions] = useState([{ value: "auto", label: "Auto" }]);
  const [selectedQuality, setSelectedQuality] = useState("auto");
  const [subtitleOptions, setSubtitleOptions] = useState([{ value: "off", label: "CC Off" }]);
  const [selectedSubtitle, setSelectedSubtitle] = useState("off");
  const [audioOptions, setAudioOptions] = useState([{ value: "default", label: "Default" }]);
  const [selectedAudio, setSelectedAudio] = useState("default");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState("1");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMorePanel, setShowMorePanel] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [relatedItems, setRelatedItems] = useState([]);
  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState(0);
  const isAdult = Boolean(content?.isAdult);
  const showAdultGate = isAdult && !adultOk;
  const premium = content?.isPremium !== false;

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
        try {
          const catalog = await apiGet("/api/v1/ott");
          if (!cancelled) {
            const rel = (Array.isArray(catalog) ? catalog : [])
              .filter((item) => item?.slug && item.slug !== slug)
              .filter((item) => !info?.type || item.type === info.type)
              .slice(0, 12);
            setRelatedItems(rel);
          }
        } catch {
          if (!cancelled) setRelatedItems([]);
        }

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
          if (!cancelled && progress?.seconds > 0) {
            setResumeSeconds(progress.seconds);
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
    setSelectedSeasonIdx(0);
  }, [slug]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !playback?.hlsUrl) return undefined;

    setQualityOptions([{ value: "auto", label: "Auto" }]);
    setSelectedQuality("auto");
    setSubtitleOptions([{ value: "off", label: "CC Off" }]);
    setSelectedSubtitle("off");
    setAudioOptions([{ value: "default", label: "Default" }]);
    setSelectedAudio("default");

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(playback.hlsUrl);
      hls.attachMedia(el);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = Array.isArray(hls.levels) ? hls.levels : [];
        const uniqueByHeight = new Map();
        levels.forEach((level, idx) => {
          const label = level?.height ? `${level.height}p` : `Level ${idx + 1}`;
          const key = String(level?.height || idx);
          if (!uniqueByHeight.has(key)) uniqueByHeight.set(key, { value: String(idx), label });
        });
        setQualityOptions([{ value: "auto", label: "Auto" }, ...Array.from(uniqueByHeight.values())]);

        const tracks = hls.subtitleTracks || [];
        if (tracks.length > 0) {
          setSubtitleOptions([{ value: "off", label: "CC Off" }, ...tracks.map((track, idx) => ({ value: String(idx), label: track?.name || track?.lang || `Track ${idx + 1}` }))]);
        }

        const audios = hls.audioTracks || [];
        if (audios.length > 0) {
          setAudioOptions(audios.map((track, idx) => ({ value: String(idx), label: track?.name || track?.lang || `Audio ${idx + 1}` })));
          setSelectedAudio("0");
        }
      });
    } else {
      el.src = playback.hlsUrl;
      el.load();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playback?.hlsUrl]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;

    function onLoadedMetadata() {
      setDuration(Number.isFinite(el.duration) ? el.duration : 0);
      setCurrentTime(el.currentTime || 0);
    }
    function onTimeUpdate() {
      setCurrentTime(el.currentTime || 0);
    }
    function onPlay() {
      setIsPlaying(true);
    }
    function onPause() {
      setIsPlaying(false);
    }
    function onVolumeChange() {
      setVolume(el.muted ? 0 : el.volume);
    }
    function onRateChange() {
      setPlaybackRate(String(el.playbackRate || 1));
    }
    function onDurationChange() {
      setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    }

    el.addEventListener("loadedmetadata", onLoadedMetadata);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("volumechange", onVolumeChange);
    el.addEventListener("ratechange", onRateChange);
    el.addEventListener("durationchange", onDurationChange);

    return () => {
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("volumechange", onVolumeChange);
      el.removeEventListener("ratechange", onRateChange);
      el.removeEventListener("durationchange", onDurationChange);
    };
  }, [playback?.hlsUrl]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !resumeSeconds) return undefined;
    function applyResume() {
      if (resumeSeconds > 0 && Number.isFinite(el.duration)) {
        el.currentTime = Math.min(resumeSeconds, Math.max(0, el.duration - 2));
      }
    }
    el.addEventListener("loadedmetadata", applyResume);
    return () => {
      el.removeEventListener("loadedmetadata", applyResume);
    };
  }, [resumeSeconds, playback?.hlsUrl]);

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

  function seekBy(deltaSeconds) {
    const el = videoRef.current;
    if (!el) return;
    const next = Math.max(0, (el.currentTime || 0) + deltaSeconds);
    if (Number.isFinite(el.duration) && el.duration > 0) {
      el.currentTime = Math.min(next, el.duration);
      return;
    }
    el.currentTime = next;
  }

  function togglePlayPause() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }

  function onSeek(event) {
    const el = videoRef.current;
    if (!el) return;
    const next = Number(event.target.value);
    if (!Number.isFinite(next)) return;
    el.currentTime = next;
    setCurrentTime(next);
  }

  function onVolumeInput(event) {
    const el = videoRef.current;
    if (!el) return;
    const next = Number(event.target.value);
    if (!Number.isFinite(next)) return;
    el.volume = next;
    el.muted = next <= 0;
    setVolume(next);
  }

  function toggleMute() {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    if (!el.muted && el.volume <= 0) {
      el.volume = 0.8;
    }
    setVolume(el.muted ? 0 : el.volume);
  }

  function onPlaybackRateChange(event) {
    const el = videoRef.current;
    const nextRate = event.target.value;
    setPlaybackRate(nextRate);
    if (!el) return;
    el.playbackRate = Number(nextRate);
  }

  function toggleFullscreen() {
    const shell = playerShellRef.current;
    if (!shell) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }
    shell.requestFullscreen().catch(() => {});
  }

  function clearBoostTimer() {
    if (boostTimeoutRef.current) {
      window.clearTimeout(boostTimeoutRef.current);
      boostTimeoutRef.current = null;
    }
  }

  function clearControlsHideTimer() {
    if (controlsHideTimerRef.current) {
      window.clearTimeout(controlsHideTimerRef.current);
      controlsHideTimerRef.current = null;
    }
  }

  function revealControlsTemporarily() {
    setControlsVisible(true);
    clearControlsHideTimer();
    if (!isPlaying) return;
    controlsHideTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
      setShowMorePanel(false);
    }, 2500);
  }

  function stopSpaceBoost() {
    const el = videoRef.current;
    if (!el || !boostActiveRef.current) return;
    boostActiveRef.current = false;
    clearBoostTimer();
    el.playbackRate = boostPreviousRateRef.current || 1;
  }

  function startSpaceBoost() {
    const el = videoRef.current;
    if (!el || boostActiveRef.current) return;
    boostPreviousRateRef.current = el.playbackRate || 1;
    boostActiveRef.current = true;
    el.playbackRate = 2;
    clearBoostTimer();
    boostTimeoutRef.current = window.setTimeout(() => {
      stopSpaceBoost();
    }, 3000);
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    const hrs = Math.floor(safe / 3600);
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  function formatDuration(mins) {
    const n = Number(mins || 0);
    if (!Number.isFinite(n) || n <= 0) return "";
    const h = Math.floor(n / 60);
    const m = n % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  }

  function formatEpisodeDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  useEffect(() => {
    function isInteractiveTarget(target) {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      return target.isContentEditable || tag === "input" || tag === "textarea" || tag === "select" || tag === "button";
    }

    function onKeyDown(event) {
      if (!(event.code === "Space" || event.key === " ")) return;
      if (!playback?.hlsUrl || showAdultGate) return;
      if (isInteractiveTarget(event.target)) return;
      if (event.repeat) return;
      event.preventDefault();
      startSpaceBoost();
    }

    function onKeyUp(event) {
      if (!(event.code === "Space" || event.key === " ")) return;
      if (!playback?.hlsUrl || showAdultGate) return;
      event.preventDefault();
      stopSpaceBoost();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      stopSpaceBoost();
    };
  }, [playback?.hlsUrl, showAdultGate]);

  useEffect(() => {
    if (!isPlaying) {
      clearControlsHideTimer();
      setControlsVisible(true);
      return;
    }
    revealControlsTemporarily();
    return () => {
      clearControlsHideTimer();
    };
  }, [isPlaying]);

  function onSelectQuality(event) {
    const value = event.target.value;
    setSelectedQuality(value);
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = value === "auto" ? -1 : Number(value);
  }

  function onSelectSubtitle(event) {
    const value = event.target.value;
    setSelectedSubtitle(value);
    const hls = hlsRef.current;
    if (!hls) return;
    hls.subtitleTrack = value === "off" ? -1 : Number(value);
  }

  function onSelectAudio(event) {
    const value = event.target.value;
    setSelectedAudio(value);
    const hls = hlsRef.current;
    if (!hls) return;
    if (value === "default") return;
    hls.audioTrack = Number(value);
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
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("mirai-watchlist-changed", { detail: { slug, inWatchlist: !inWatchlist } }));
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

  async function shareContent() {
    if (typeof window === "undefined") return;
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: content?.title || "Mirai OTT", url: shareUrl });
        return;
      }
    } catch {
      // fallback to clipboard below
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setWatchlistHint("Link copied.");
    } catch {
      setWatchlistHint("Could not copy link.");
    }
  }

  if (!content) return <p className="text-zinc-300">{status || "OTT content not found."}</p>;

  const seasons =
    Array.isArray(content?.seasons) && content.seasons.length > 0
      ? content.seasons
      : [
          {
            seasonNumber: 1,
            title: "Season 1",
            episodes: [
              {
                episodeNumber: 1,
                title: content.title,
                description: content.description,
                posterUrl: content.posterUrl,
                durationMin: content.durationMin || 41,
                releasedAt: content.createdAt,
              },
            ],
          },
        ];
  const safeSeasonIdx = Math.min(Math.max(selectedSeasonIdx, 0), Math.max(0, seasons.length - 1));
  const currentSeason = seasons[safeSeasonIdx] || seasons[0];
  const episodes = Array.isArray(currentSeason?.episodes) ? currentSeason.episodes : [];
  const metaChips = [
    content.contentRating,
    content.year ? String(content.year) : "",
    formatDuration(content.durationMin),
    Array.isArray(content.languages) ? content.languages.join(", ") : "",
  ].filter(Boolean);

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
          <div ref={playerShellRef} className="relative aspect-video w-full bg-zinc-900">
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
              <video ref={videoRef} controls={false} className="absolute inset-0 z-[2] h-full w-full bg-black" />
            ) : (
              <div className="absolute inset-0 z-[1] flex items-center justify-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ottBlue text-white shadow-xl shadow-black/50">
                  <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-current" aria-hidden>
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                </span>
              </div>
            )}

            {playback?.hlsUrl && !showAdultGate ? (
              <div className="absolute inset-0 z-[3] flex">
                <button type="button" aria-label="Rewind 10 seconds" onDoubleClick={() => seekBy(-10)} className="h-full w-1/2 bg-transparent" />
                <button type="button" aria-label="Forward 10 seconds" onDoubleClick={() => seekBy(10)} className="h-full w-1/2 bg-transparent" />
              </div>
            ) : null}

            {playback?.hlsUrl && !showAdultGate ? (
              <div className="absolute inset-x-0 bottom-0 z-[4] px-3 pb-2 md:px-4 md:pb-3" onMouseMove={revealControlsTemporarily} onMouseEnter={revealControlsTemporarily}>
                <div
                  className={`relative rounded-lg bg-gradient-to-t from-black/95 via-black/70 to-transparent px-3 py-2 text-zinc-100 transition duration-300 ${
                    controlsVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                  }`}
                >
                  <input
                    type="range"
                    min="0"
                    max={Math.max(duration, 0)}
                    step="0.1"
                    value={Math.min(currentTime, duration || 0)}
                    onChange={onSeek}
                    className="mb-2 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/25 accent-ottBlue"
                  />
                  <div className="flex items-center justify-between gap-3 text-xs md:text-sm">
                    <div className="flex items-center gap-1.5 md:gap-2.5">
                      <button type="button" onClick={togglePlayPause} className="rounded-full p-2.5 hover:bg-white/15" aria-label={isPlaying ? "Pause" : "Play"}>
                        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
                          {isPlaying ? <path d="M7 5h4v14H7zM13 5h4v14h-4z" /> : <path d="M8 5v14l11-7z" />}
                        </svg>
                      </button>
                      <button type="button" onClick={() => seekBy(-10)} className="rounded-full p-2.5 hover:bg-white/15" aria-label="Rewind 10 seconds">
                        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
                          <path d="M11 18V6L2.5 12 11 18zm.5-6L20 18V6l-8.5 6z" />
                        </svg>
                      </button>
                      <button type="button" onClick={() => seekBy(10)} className="rounded-full p-2.5 hover:bg-white/15" aria-label="Forward 10 seconds">
                        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
                          <path d="M13 6v12l8.5-6L13 6zm-1.5 6L3 6v12l8.5-6z" />
                        </svg>
                      </button>
                      <button type="button" onClick={toggleMute} className="rounded-full p-2.5 hover:bg-white/15" aria-label={volume <= 0 ? "Unmute" : "Mute"}>
                        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
                          {volume <= 0 ? (
                            <path d="M16.5 12c0-1.8-1-3.3-2.5-4.1v8.2c1.5-.8 2.5-2.3 2.5-4.1zM19 12c0 2.8-1.6 5.2-4 6.3v-2.2c1.2-.8 2-2.2 2-4.1s-.8-3.3-2-4.1V5.7c2.4 1.1 4 3.5 4 6.3zM3 9v6h4l5 5V4L7 9H3zm17.7-2.3-1.4-1.4-15 15 1.4 1.4 15-15z" />
                          ) : (
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.8-1-3.3-2.5-4.1v8.2c1.5-.8 2.5-2.3 2.5-4.1zM14 3.2v2.1c2.9 1 5 3.7 5 6.7s-2.1 5.7-5 6.7v2.1c4-.9 7-4.5 7-8.8s-3-7.9-7-8.8z" />
                          )}
                        </svg>
                      </button>
                      <input type="range" min="0" max="1" step="0.01" value={volume} onChange={onVolumeInput} className="hidden w-24 accent-ottBlue md:block" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="whitespace-nowrap text-xs font-medium md:text-sm">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowMorePanel((prev) => !prev)}
                        className="rounded px-2.5 py-1.5 font-semibold hover:bg-white/15"
                        aria-label="Open more controls"
                      >
                        More
                      </button>
                      <button type="button" onClick={toggleFullscreen} className="rounded-full p-2.5 hover:bg-white/15" aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
                        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
                          {isFullscreen ? (
                            <path d="M14 10V5h5v2h-3v3h-2zm-4 0H8V7H5V5h5v5zm4 4h2v3h3v2h-5v-5zm-4 0v5H5v-2h3v-3h2z" />
                          ) : (
                            <path d="M7 14H5v5h5v-2H7v-3zm0-4h2V7h3V5H5v5zm10 7h-3v2h5v-5h-2v3zm0-12h-3v2h3v3h2V5h-2z" />
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>

                  {showMorePanel ? (
                    <div className="absolute bottom-16 right-2 grid w-[min(92vw,18rem)] gap-2 rounded-lg border border-white/15 bg-black/90 p-2 text-xs shadow-xl backdrop-blur">
                      <label className="flex items-center gap-2 rounded border border-white/15 px-2 py-1.5">
                        Speed
                        <select value={playbackRate} onChange={onPlaybackRateChange} className="w-full rounded bg-zinc-950 px-2 py-1 text-xs text-white">
                          <option value="0.5">0.5x</option>
                          <option value="0.75">0.75x</option>
                          <option value="1">1x</option>
                          <option value="1.25">1.25x</option>
                          <option value="1.5">1.5x</option>
                          <option value="2">2x</option>
                        </select>
                      </label>
                      <label className="flex items-center gap-2 rounded border border-white/15 px-2 py-1.5">
                        Quality
                        <select value={selectedQuality} onChange={onSelectQuality} className="w-full rounded bg-zinc-950 px-2 py-1 text-xs text-white">
                          {qualityOptions.map((option) => (
                            <option key={`q-${option.value}`} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex items-center gap-2 rounded border border-white/15 px-2 py-1.5">
                        CC
                        <select value={selectedSubtitle} onChange={onSelectSubtitle} className="w-full rounded bg-zinc-950 px-2 py-1 text-xs text-white">
                          {subtitleOptions.map((option) => (
                            <option key={`cc-${option.value}`} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex items-center gap-2 rounded border border-white/15 px-2 py-1.5">
                        Audio
                        <select value={selectedAudio} onChange={onSelectAudio} className="w-full rounded bg-zinc-950 px-2 py-1 text-xs text-white">
                          {audioOptions.map((option) => (
                            <option key={`a-${option.value}`} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

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

        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="mb-3 text-[11px] text-zinc-500">Home &gt; OTT &gt; {content.type} &gt; {content.title}</p>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl space-y-3">
              <h2 className="text-3xl font-semibold text-zinc-200">{content.title}</h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                {metaChips.map((chip) => (
                  <span key={`chip-${chip}`} className="rounded border border-white/25 px-2 py-0.5">
                    {chip}
                  </span>
                ))}
              </div>
              {Array.isArray(content?.genres) && content.genres.length > 0 ? (
                <p className="text-xs text-zinc-400">Genre: {content.genres.join(", ")}</p>
              ) : null}
              {content?.director ? <p className="text-xs text-zinc-400">Director: {content.director}</p> : null}
              {Array.isArray(content?.cast) && content.cast.length > 0 ? <p className="text-xs text-zinc-400">Starring: {content.cast.join(", ")}</p> : null}
              {content?.publisher ? <p className="text-xs text-zinc-400">Publisher: {content.publisher}</p> : null}
              <p className="max-w-3xl text-sm leading-relaxed text-zinc-400">{content.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {premium ? (
                <Link href="/subscription" className="rounded-full border border-amber-300/40 bg-amber-500/15 px-3 py-2 font-medium text-amber-200">
                  Join MX Gold
                </Link>
              ) : null}
              <button
                type="button"
                onClick={toggleWatchlist}
                disabled={watchlistBusy}
                className="rounded-full border border-white/20 bg-white/5 px-3 py-2 font-medium text-white disabled:opacity-60"
              >
                {watchlistBusy ? "Updating..." : inWatchlist ? "Remove from My List" : "Add to My List"}
              </button>
              <button type="button" onClick={shareContent} className="rounded-full border border-white/20 bg-white/5 px-3 py-2 font-medium text-white">
                Share
              </button>
            </div>
          </div>
          {watchlistHint ? <p className="mt-2 text-xs text-zinc-400">{watchlistHint}</p> : null}
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {seasons.map((season, idx) => (
                <button
                  key={`season-${season.seasonNumber || idx}`}
                  type="button"
                  onClick={() => setSelectedSeasonIdx(idx)}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                    idx === safeSeasonIdx ? "bg-ottBlue text-white" : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  {season.title || `Season ${season.seasonNumber || idx + 1}`}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-400">
              Sort By <span className="text-ottBlue">Default</span>
            </p>
          </div>

          <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 pt-1 [scrollbar-width:thin]">
            {episodes.map((episode, idx) => (
              <div key={`ep-${idx}-${episode.title || "episode"}`} className="w-64 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-zinc-900/80">
                <div className="relative aspect-video w-full bg-zinc-800">
                  {episode.posterUrl || content.posterUrl ? (
                    <Image
                      src={episode.posterUrl || content.posterUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="256px"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="space-y-1 p-2">
                  <p className="text-[11px] text-zinc-400">
                    S{currentSeason?.seasonNumber || safeSeasonIdx + 1} E{episode.episodeNumber || idx + 1}
                    {episode.releasedAt ? ` | ${formatEpisodeDate(episode.releasedAt)}` : ""}
                  </p>
                  <p className="line-clamp-1 text-sm font-semibold text-white">{episode.title || `Episode ${idx + 1}`}</p>
                  <p className="line-clamp-2 text-xs text-zinc-400">{episode.description || "Episode description coming soon."}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-300">Related Shows</h3>
          <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 pt-1 [scrollbar-width:thin]">
            {relatedItems.length > 0 ? (
              relatedItems.map((item) => (
                <Link key={`related-${item.slug}`} href={`/ott/${item.slug}`} className="w-52 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-zinc-900/80">
                  <div className="relative aspect-video w-full bg-zinc-800">
                    {item.posterUrl ? <Image src={item.posterUrl} alt="" fill className="object-cover" sizes="208px" unoptimized /> : null}
                  </div>
                  <div className="p-2">
                    <p className="line-clamp-1 text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs capitalize text-zinc-400">{String(item.type || "").replace(/-/g, " ")}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-zinc-500">More related titles will appear here.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
