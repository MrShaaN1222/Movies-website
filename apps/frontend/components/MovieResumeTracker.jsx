"use client";

import { useEffect } from "react";
import { apiPostAuth } from "../lib/api";

export default function MovieResumeTracker({ slug }) {
  useEffect(() => {
    let cancelled = false;
    async function markContinue() {
      if (!slug) return;
      const token = typeof window !== "undefined" ? window.localStorage.getItem("mirai_token") : null;
      if (!token || cancelled) return;
      try {
        await apiPostAuth(`/api/v1/movies/continue/${slug}`, {});
      } catch {
        // Optional signal only.
      }
    }
    markContinue();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return null;
}
