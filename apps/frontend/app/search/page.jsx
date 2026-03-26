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
      <div className="grid gap-4 md:grid-cols-4">
        {(results || []).map((movie) => (
          <a key={movie._id || movie.slug} href={`/movie/${movie.slug}`} className="rounded bg-brandCard p-4">
            <h3 className="font-semibold">{movie.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{movie.releaseDate}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
