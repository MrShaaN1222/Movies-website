import HeroBanner from "../components/HeroBanner";
import MovieCardsClient from "../components/MovieCardsClient";
import { apiGet } from "../lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }) {
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params?.page) || 1);
  const [trending, popular, upcoming] = await Promise.all([
    apiGet("/api/v1/movies/trending"),
    apiGet("/api/v1/movies/popular"),
    apiGet("/api/v1/movies/upcoming"),
  ]);

  const latestTitles = [...(upcoming || []), ...(popular || []), ...(trending || [])]
    .filter((movie, index, arr) => arr.findIndex((m) => (m._id || m.slug) === (movie._id || movie.slug)) === index)
    .slice(0, 16);
  const bollywood = ["Bollywood New Releases", "Bollywood Family Movies", "Bollywood Action", "Bollywood Drama"];
  const hollywood = ["Hollywood New Releases", "Hollywood Action", "Hollywood Sci-Fi", "Hollywood Thrillers"];
  const dualAudio = ["Hindi Dubbed", "Dual Audio Hindi-English", "Dual Audio Hindi-Telugu", "Dual Audio Latest"];
  const genres = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Drama", "Fantasy", "Horror", "Romance", "Thriller"];
  const itemsPerPage = 20;
  const totalItems = latestTitles.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const pagedMovies = latestTitles.slice(startIndex, startIndex + itemsPerPage);
  const maxVisiblePages = 10;
  const visiblePages = Array.from({ length: Math.min(totalPages, maxVisiblePages) }, (_, idx) => idx + 1);
  const hasMorePages = totalPages > maxVisiblePages;
  const nextPage = hasMorePages ? visiblePages[visiblePages.length - 1] + 1 : null;

  return (
    <>
      <HeroBanner />
      <section className="mb-8 rounded-xl bg-brandCard p-5">
        <h2 className="section-title">Categories</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">Bollywood</p>
            <div className="flex flex-wrap gap-2">
              {bollywood.map((item) => (
                <Link key={item} href={`/search?q=${encodeURIComponent(item)}`} className="rounded bg-slate-800 px-2 py-1 text-xs">
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">Hollywood</p>
            <div className="flex flex-wrap gap-2">
              {hollywood.map((item) => (
                <Link key={item} href={`/search?q=${encodeURIComponent(item)}`} className="rounded bg-slate-800 px-2 py-1 text-xs">
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">Dual Audio</p>
            <div className="flex flex-wrap gap-2">
              {dualAudio.map((item) => (
                <Link key={item} href={`/search?q=${encodeURIComponent(item)}`} className="rounded bg-slate-800 px-2 py-1 text-xs">
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">Genre</p>
            <div className="flex flex-wrap gap-2">
              {genres.map((item) => (
                <Link key={item} href={`/search?q=${encodeURIComponent(item)}`} className="rounded bg-slate-800 px-2 py-1 text-xs">
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="section-title">Latest Movies and Series</h2>
        <MovieCardsClient movies={pagedMovies} />
      </section>

      <section className="mb-8">
        <h2 className="section-title">Pages</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          {visiblePages.map((page) => (
            <Link
              key={page}
              href={`/?page=${page}`}
              className={`rounded px-3 py-1 ${page === safeCurrentPage ? "bg-brandAccent text-white" : "bg-brandCard"}`}
            >
              {page}
            </Link>
          ))}
          {hasMorePages && nextPage ? (
            <>
              <Link href={`/?page=${nextPage}`} className="rounded bg-brandCard px-3 py-1">
                ...
              </Link>
              <span className="rounded bg-brandCard px-3 py-1">{totalPages}</span>
            </>
          ) : null}
        </div>
      </section>

    </>
  );
}
