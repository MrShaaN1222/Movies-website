"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function MovieRow({ title, items = [] }) {
  return (
    <section className="mb-8">
      <h2 className="section-title">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((movie) => (
          <Link key={movie._id || movie.slug} href={`/movie/${movie.slug}`}>
            <motion.article
              whileHover={{ scale: 1.04 }}
              className="w-44 min-w-44 rounded-lg bg-brandCard p-3"
            >
              <div className="mb-2 h-56 rounded bg-slate-800" />
              <h3 className="line-clamp-2 text-sm font-medium">{movie.title}</h3>
            </motion.article>
          </Link>
        ))}
      </div>
    </section>
  );
}
