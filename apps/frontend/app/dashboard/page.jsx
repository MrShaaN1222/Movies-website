export default function DashboardPage() {
  return (
    <section>
      <h1 className="mb-4 text-3xl font-bold">User Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded bg-brandCard p-4">
          <h2 className="mb-2 font-semibold">Watchlist</h2>
          <p className="text-slate-300">Saved movies will appear here.</p>
        </div>
        <div className="rounded bg-brandCard p-4">
          <h2 className="mb-2 font-semibold">Continue Watching</h2>
          <p className="text-slate-300">Resume OTT content across devices.</p>
        </div>
        <div className="rounded bg-brandCard p-4">
          <h2 className="mb-2 font-semibold">Subscription</h2>
          <p className="text-slate-300">Razorpay plan status will be shown here.</p>
        </div>
      </div>
    </section>
  );
}
