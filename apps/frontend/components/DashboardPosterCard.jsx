"use client";

import Image from "next/image";
import Link from "next/link";

export function movieCardImageUrl(item) {
  if (!item) return "";
  return item.posterUrl || item.poster || "";
}

export default function DashboardPosterCard({ href, title, subtitle, imageUrl, imageAlt }) {
  const src = imageUrl || "";
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-lg bg-brandCard ring-1 ring-white/5 transition hover:ring-brandAccent/50"
    >
      <div className="relative aspect-[2/3] w-full bg-slate-800">
        {src ? (
          <Image
            src={src}
            alt={imageAlt || title || "Poster"}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-slate-500">No poster</div>
        )}
      </div>
      <div className="border-t border-white/5 p-3">
        <p className="line-clamp-2 font-semibold text-white">{title}</p>
        {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
      </div>
    </Link>
  );
}
