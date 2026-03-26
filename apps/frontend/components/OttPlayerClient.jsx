"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiGet, apiGetAuth, apiPostAuth } from "../lib/api";

export default function OttPlayerClient({ slug }) {
  const videoRef = useRef(null);
  const [content, setContent] = useState(null);
  const [playback, setPlayback] = useState(null);
  const [status, setStatus] = useState("Loading...");
  const [statusCode, setStatusCode] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const info = await apiGet(`/api/v1/ott/${slug}`);
        if (!cancelled) setContent(info);

        const playbackData = await apiGetAuth(`/api/v1/ott/${slug}/playback`);
        if (!cancelled) {
          setPlayback(playbackData);
          setStatus("");
        }

        const progress = await apiGetAuth(`/api/v1/ott/${slug}/progress`);
        if (!cancelled && videoRef.current && progress?.seconds > 0) {
          videoRef.current.currentTime = progress.seconds;
        }
      } catch (error) {
        if (!cancelled) {
          setStatusCode(error?.status || 0);
          setStatus(error?.message || "Unable to load playback.");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    const timer = setInterval(async () => {
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
    }, 15000);

    return () => clearInterval(timer);
  }, [slug, playback]);

  if (!content) return <p>{status || "OTT content not found."}</p>;

  return (
    <section>
      <h1 className="mb-4 text-3xl font-bold">{content.title}</h1>
      {playback?.hlsUrl ? (
        <video ref={videoRef} controls className="mb-4 w-full rounded bg-black">
          <source src={playback.hlsUrl} type="application/x-mpegURL" />
        </video>
      ) : (
        <div className="mb-4 rounded bg-brandCard p-3 text-sm">
          <p className="text-amber-300">
            {status || "Premium access required. Please login with an active subscription."}
          </p>
          {statusCode === 401 ? (
            <div className="mt-3">
              <Link
                href="/login"
                className="inline-block rounded bg-brandAccent px-3 py-2 text-xs font-medium text-white"
              >
                Login to continue
              </Link>
            </div>
          ) : null}
          {statusCode === 402 ? (
            <div className="mt-3 flex gap-2">
              <Link
                href="/purchase"
                className="inline-block rounded bg-brandAccent px-3 py-2 text-xs font-medium text-white"
              >
                Purchase Premium
              </Link>
              <Link
                href="/subscription"
                className="inline-block rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-white"
              >
                Check Subscription
              </Link>
            </div>
          ) : null}
        </div>
      )}
      <p className="text-slate-300">{content.description}</p>
    </section>
  );
}
