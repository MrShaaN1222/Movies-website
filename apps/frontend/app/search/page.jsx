import { apiGet } from "../../lib/api";
import MovieCardsClient from "../../components/MovieCardsClient";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = params?.q || "";
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
      <MovieCardsClient movies={results || []} showDetailsButton />
    </section>
  );
}
