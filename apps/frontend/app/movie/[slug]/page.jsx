import { apiGet } from "../../../lib/api";
import AdSlot from "../../../components/AdSlot";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MovieDetailsPage({ params }) {
  const { slug } = await params;

  const [movie, reviews, providers, latest] = await Promise.all([
    apiGet(`/api/v1/movies/${slug}`),
    apiGet(`/api/v1/movies/${slug}/reviews`),
    apiGet(`/api/v1/movies/${slug}/watch-providers`),
    apiGet("/api/v1/movies/popular"),
  ]);

  if (!movie) return <p>Movie not found.</p>;

  return (
    <section className="grid gap-5 lg:grid-cols-[260px,1fr]">
      <aside className="rounded-lg bg-brandCard p-3">
        <h2 className="mb-3 text-sm font-semibold text-slate-300">Recent Movies</h2>
        <div className="space-y-2">
          {(latest || []).map((item) => (
            <Link
              key={item._id || item.slug}
              href={`/movie/${item.slug}`}
              className="block rounded bg-slate-800 px-2 py-2 text-xs hover:bg-slate-700"
            >
              {item.title}
            </Link>
          ))}
        </div>
      </aside>

      <article className="rounded-lg bg-brandCard p-4">
        <h1 className="mb-2 text-2xl font-bold md:text-3xl">{movie.title}</h1>
        <p className="mb-4 text-sm text-slate-300">
          {movie.releaseDate} | {movie.language} | {movie.quality} | {movie.runtime}
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {providers && providers.length > 0 ? (
            providers.map((p) => (
              <a
                key={p.name}
                href={p.affiliateUrl || p.url}
                target="_blank"
                rel="noreferrer"
                className="rounded bg-brandAccent px-3 py-2 text-xs font-semibold"
              >
                Watch on {p.name}
              </a>
            ))
          ) : (
            <p className="text-sm text-slate-400">Official watch links are not available for this title yet.</p>
          )}
        </div>

        <AdSlot placement="movie-detail-top" />

        <div className="mb-5 rounded bg-slate-900 p-3">
          <h2 className="mb-2 text-sm font-semibold">Storyline</h2>
          <p className="text-sm text-slate-300">{movie.overview}</p>
        </div>

        <div className="mb-5 grid gap-2 text-sm md:grid-cols-2">
          <p>
            <span className="text-slate-400">Genre:</span> {movie.genre}
          </p>
          <p>
            <span className="text-slate-400">Industry:</span> {movie.industry}
          </p>
          <p>
            <span className="text-slate-400">Country:</span> {movie.country}
          </p>
          <p>
            <span className="text-slate-400">Quality:</span> {movie.quality}
          </p>
        </div>

        <div className="mb-5">
          <h2 className="section-title">Trailer</h2>
          {(movie.trailers || []).slice(0, 1).map((t) => (
            <iframe
              key={t.youtubeId}
              className="h-80 w-full rounded"
              src={`https://www.youtube.com/embed/${t.youtubeId}`}
              title={t.name}
              allowFullScreen
            />
          ))}
        </div>

        <div className="mb-5">
          <h2 className="section-title">Screenshots</h2>
          <div className="space-y-3">
            {(movie.screenshots || [movie.poster]).map((img, idx) => (
              <img
                key={`${movie.slug}-ss-${idx}`}
                src={img}
                alt={`${movie.title} screenshot ${idx + 1}`}
                className="w-full rounded"
                loading="lazy"
              />
            ))}
          </div>
        </div>

        <div className="mb-5 border-y border-slate-600 py-4 text-center">
          <p className="mb-3 text-xs text-slate-300">Watch Sources</p>
          <div className="mx-auto flex max-w-md flex-col gap-2">
            {providers && providers.length > 0 ? (
              providers.slice(0, 3).map((p, idx) => (
                <a
                  key={`source-${p.name}`}
                  href={p.affiliateUrl || p.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`rounded px-3 py-2 text-sm font-semibold ${
                    idx === 0 ? "bg-green-600 text-white" : idx === 1 ? "bg-red-600 text-white" : "bg-blue-600 text-white"
                  }`}
                >
                  {movie.quality || "HD"} - Watch on {p.name}
                </a>
              ))
            ) : (
              <p className="text-sm text-slate-400">Official watch sources not available yet.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="section-title">Reviews</h2>
          {reviews && reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((r) => (
                <article key={r._id} className="rounded bg-slate-900 p-3">
                  <p className="text-sm text-slate-400">Rating: {r.rating}/10</p>
                  <p className="text-sm">{r.content}</p>
                </article>
              ))}
            </div>
          ) : (
            <article className="rounded bg-slate-900 p-3">
              <p className="text-sm text-slate-300">No reviews yet for this title.</p>
            </article>
          )}
        </div>

        <div className="mt-6 rounded bg-slate-900 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">Leave Your Comment</h3>
          <form className="space-y-3">
            <textarea
              className="min-h-24 w-full rounded border border-slate-700 bg-slate-950 p-3 text-sm"
              placeholder="Your comment..."
            />
            <input
              className="w-full rounded border border-slate-700 bg-slate-950 p-3 text-sm"
              placeholder="Your name"
              type="text"
            />
            <button type="button" className="rounded bg-brandAccent px-4 py-2 text-xs font-semibold">
              Post Comment
            </button>
          </form>
        </div>
      </article>
    </section>
  );
}
