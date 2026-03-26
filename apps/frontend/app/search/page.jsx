import Link from "next/link";
import { apiGet } from "../../lib/api";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }) {
  const query = searchParams?.q || "";
  const results = query ? await apiGet(`/api/v1/movies/search?q=${encodeURIComponent(query)}`) : [];

  return (
    <section>
      <h1 className="mb-4 text-3xl font-bold">Search Movies</h1>
      <form className="mb-6">
        <input
          className="w-full rounded bg-brandCard p-3"
          name="q"
          placeholder="Search by movie, actor, genre, mood"
          defaultValue={query}
        />
      </form>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
        {(results || []).map((movie) => (
          <article key={movie._id || movie.slug} className="overflow-hidden rounded-lg bg-brandCard">
            <Link href={`/movie/${movie.slug}`} className="block">
              <div className="relative h-64 w-full bg-slate-800">
                <img src={movie.poster} alt={movie.title} className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                <div className="absolute bottom-0 p-3">
                  <p className="text-xs text-slate-300">{movie.releaseDate}</p>
                  <h3 className="line-clamp-2 font-semibold text-white">{movie.title}</h3>
                </div>
              </div>
            </Link>
            <div className="p-3">
              <Link href={`/movie/${movie.slug}`} className="rounded bg-slate-700 px-2 py-1 text-xs">
                View Details
              </Link>
              {(movie.providers || []).slice(0, 1).map((provider) => (
                <a
                  key={`${movie.slug}-${provider.name}`}
                  href={provider.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded bg-brandAccent px-2 py-1 text-xs"
                >
                  Watch on {provider.name}
                </a>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
