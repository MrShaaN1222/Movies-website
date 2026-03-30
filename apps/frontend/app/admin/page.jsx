export default function AdminPage() {
  return (
    <section>
      <h1 className="mb-4 text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded bg-brandCard p-4">
          <h2 className="mb-2 font-semibold">OTT demo data</h2>
          <p className="mb-3 text-slate-300">
            Load the full detail-page sample (genres, cast, Season 1 with seven episodes) into MongoDB for{" "}
            <code className="rounded bg-slate-800 px-1">mirai-original-the-last-signal</code>.
          </p>
          <p className="font-mono text-sm text-slate-200">npm run seed:ott-demo -w @mirai/backend</p>
          <p className="mt-2 text-xs text-slate-400">Requires <code className="rounded bg-slate-800 px-1">MONGODB_URI</code> in the repo <code className="rounded bg-slate-800 px-1">.env</code>.</p>
        </article>
        <article className="rounded bg-brandCard p-4">
          <h2 className="mb-2 font-semibold">Demo movies (non-OTT wishlist)</h2>
          <p className="mb-3 text-slate-300">
            Non-OTT favorites are stored as slugs that must exist as <code className="rounded bg-slate-800 px-1">Movie</code> documents. Seed the
            same slugs the site shows when the API is empty.
          </p>
          <p className="font-mono text-sm text-slate-200">npm run seed:demo-movies -w @mirai/backend</p>
        </article>
        <article className="rounded bg-brandCard p-4">
          <h2 className="mb-2 font-semibold">Content Management</h2>
          <p className="text-slate-300">Manage movies, free videos, and OTT content.</p>
        </article>
        <article className="rounded bg-brandCard p-4">
          <h2 className="mb-2 font-semibold">Analytics Overview</h2>
          <p className="text-slate-300">Traffic, affiliate CTR, ad engagement, and user trends.</p>
        </article>
      </div>
    </section>
  );
}
