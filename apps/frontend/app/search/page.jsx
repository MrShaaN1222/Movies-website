import { apiGet } from "../../lib/api";
import MovieCardsClient from "../../components/MovieCardsClient";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = params?.q || "";
  const trimmedQuery = query.trim();
  let results = [];

  if (trimmedQuery) {
    results = await apiGet(`/api/v1/movies/search?q=${encodeURIComponent(trimmedQuery)}`);
  } else {
    const [trending, popular, upcoming] = await Promise.all([
      apiGet("/api/v1/movies/trending"),
      apiGet("/api/v1/movies/popular"),
      apiGet("/api/v1/movies/upcoming"),
    ]);

    results = [...(upcoming || []), ...(popular || []), ...(trending || [])].filter(
      (movie, index, arr) => arr.findIndex((m) => (m._id || m.slug) === (movie._id || movie.slug)) === index
    );
  }

  return (
    <section>
      <h1 className="mb-4 text-3xl font-bold">{trimmedQuery ? "Search Movies" : "Explore Movies"}</h1>
      <form className="mb-6">
        <input
          className="w-full rounded bg-brandCard p-3"
          name="q"
          placeholder="Search by movie, actor, genre, mood"
          defaultValue={trimmedQuery}
        />
      </form>
      {!trimmedQuery ? (
        <p className="mb-4 text-sm text-slate-300">Showing trending and popular picks to help you discover movies.</p>
      ) : null}
      <MovieCardsClient movies={results || []} showDetailsButton />
    </section>
  );
}
