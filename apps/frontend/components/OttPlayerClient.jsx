"use client";

import { useEffect, useRef, useState } from "react";
import { apiGet, apiGetAuth, apiPostAuth } from "../lib/api";

export default function OttPlayerClient({ slug }) {
  const videoRef = useRef(null);
  const [content, setContent] = useState(null);
  const [playback, setPlayback] = useState(null);
  const [status, setStatus] = useState("Loading...");

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
        <p className="mb-4 rounded bg-brandCard p-3 text-sm text-amber-300">
          {status || "Premium access required. Please login with an active subscription."}
        </p>
      )}
      <p className="text-slate-300">{content.description}</p>
    </section>
  );
}
