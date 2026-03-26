export default function AdminPage() {
  return (
    <section>
      <h1 className="mb-4 text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2">
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
