import { apiGet } from "../../../lib/api";
import AdSlot from "../../../components/AdSlot";

export const dynamic = "force-dynamic";

export default async function MovieDetailsPage({ params }) {
  const movie = await apiGet(`/api/v1/movies/${params.slug}`);
  const reviews = await apiGet(`/api/v1/movies/${params.slug}/reviews`);
  const providers = await apiGet(`/api/v1/movies/${params.slug}/watch-providers`);

  if (!movie) return <p>Movie not found.</p>;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">{movie.title}</h1>
        <p className="mt-2 text-slate-300">{movie.overview}</p>
      </div>

      <div>
        <h2 className="section-title">Where to Watch</h2>
        <AdSlot placement="movie-detail-top" />
        <div className="flex flex-wrap gap-3">
          {(providers || []).map((p) => (
            <a key={p.name} href={p.affiliateUrl || p.url} className="rounded bg-brandAccent px-3 py-2 text-sm">
              Watch on {p.name}
            </a>
          ))}
        </div>
      </div>

      <div>
        <h2 className="section-title">Trailers</h2>
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

      <div>
        <h2 className="section-title">Reviews</h2>
        <div className="space-y-3">
          {(reviews || []).map((r) => (
            <article key={r._id} className="rounded bg-brandCard p-3">
              <p className="text-sm text-slate-400">Rating: {r.rating}/10</p>
              <p>{r.content}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
