import HeroBanner from "../components/HeroBanner";
import MovieRow from "../components/MovieRow";
import AdSlot from "../components/AdSlot";
import { apiGet } from "../lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [trending, popular, upcoming] = await Promise.all([
    apiGet("/api/v1/movies/trending"),
    apiGet("/api/v1/movies/popular"),
    apiGet("/api/v1/movies/upcoming"),
  ]);

  return (
    <>
      <HeroBanner />
      <AdSlot placement="home-top-banner" />
      <MovieRow title="Trending" items={trending || []} />
      <MovieRow title="Popular" items={popular || []} />
      <AdSlot placement="home-mid-native" />
      <MovieRow title="Upcoming" items={upcoming || []} />
    </>
  );
}
