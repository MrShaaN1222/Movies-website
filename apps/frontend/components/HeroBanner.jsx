import Link from "next/link";

export default function HeroBanner() {
  return (
    <section className="mb-8 rounded-xl bg-gradient-to-r from-red-900 to-slate-900 p-8">
      <p className="mb-2 text-sm uppercase tracking-wider text-slate-300">Mirai Movies AI</p>
      <h1 className="mb-3 text-4xl font-bold">Discover. Search. Stream.</h1>
      <p className="mb-5 max-w-2xl text-slate-200">
        Find movies faster with smart search, legal streaming links, and curated free movie picks.
      </p>
      <div className="flex gap-3">
        <Link className="rounded bg-brandAccent px-4 py-2 font-semibold" href="/search">
          Explore Movies
        </Link>
        <Link className="rounded border border-slate-400 px-4 py-2" href="/ott">
          Start Streaming
        </Link>
      </div>
    </section>
  );
}
