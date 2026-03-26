import { apiGet } from "../../lib/api";

export const dynamic = "force-dynamic";

export default async function FreeMoviesPage() {
  const videos = await apiGet("/api/v1/free-movies");
  return (
    <section>
      <h1 className="mb-4 text-3xl font-bold">Free Movies (Legal)</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {(videos || []).map((v) => (
          <article key={v._id} className="rounded bg-brandCard p-4">
            <p className="mb-2 text-xs uppercase text-slate-400">{v.category}</p>
            <h2 className="mb-3 font-semibold">{v.title}</h2>
            <iframe
              className="h-52 w-full rounded"
              src={`https://www.youtube.com/embed/${v.youtubeId}`}
              title={v.title}
              allowFullScreen
            />
          </article>
        ))}
      </div>
    </section>
  );
}
