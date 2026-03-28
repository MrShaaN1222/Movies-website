/**
 * Upserts demo Movie docs so home/search slugs match the API (non-OTT favorites require Movie in MongoDB).
 * Run: npm run seed:demo-movies -w @mirai/backend
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in .env");
  process.exit(1);
}

const { Movie } = await import("../src/models/Movie.js");

/** Aligns with frontend mock catalog slugs used when the API is empty or unreachable. */
const DEMO_MOVIES = [
  {
    slug: "interstellar",
    title: "Interstellar",
    overview: "A team travels through a wormhole to find humanity a new home.",
    releaseDate: "2014-11-07",
    posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    genres: ["Sci-Fi"],
    ratings: { tmdb: 8.7 },
    providers: [
      { name: "Prime Video", url: "https://www.primevideo.com" },
      { name: "Apple TV", url: "https://tv.apple.com" },
    ],
    trailers: [{ name: "Official Trailer", youtubeId: "zSWdZVtXT7E" }],
  },
  {
    slug: "inception",
    title: "Inception",
    overview: "A skilled thief enters dreams to steal secrets from the subconscious.",
    releaseDate: "2010-07-16",
    posterUrl: "https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg",
    genres: ["Sci-Fi"],
    ratings: { tmdb: 8.8 },
    providers: [
      { name: "Netflix", url: "https://www.netflix.com" },
      { name: "Prime Video", url: "https://www.primevideo.com" },
    ],
    trailers: [{ name: "Official Trailer", youtubeId: "YoHD9XEInc0" }],
  },
  {
    slug: "dune-part-two",
    title: "Dune: Part Two",
    overview: "Paul Atreides unites with the Fremen to challenge House Harkonnen.",
    releaseDate: "2024-03-01",
    posterUrl: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
    genres: ["Sci-Fi"],
    ratings: { tmdb: 8.5 },
    providers: [
      { name: "Prime Video", url: "https://www.primevideo.com" },
      { name: "BookMyShow Stream", url: "https://in.bookmyshow.com/stream" },
    ],
    trailers: [{ name: "Official Trailer", youtubeId: "Way9Dexny3w" }],
  },
  {
    slug: "oppenheimer",
    title: "Oppenheimer",
    overview: "A historical drama about J. Robert Oppenheimer and the Manhattan Project.",
    releaseDate: "2023-07-21",
    posterUrl: "https://image.tmdb.org/t/p/w500/ptpr0kGAckfQkJeJIt8st5dglvd.jpg",
    genres: ["Drama"],
    ratings: { tmdb: 8.4 },
    providers: [
      { name: "JioHotstar", url: "https://www.hotstar.com" },
      { name: "Apple TV", url: "https://tv.apple.com" },
    ],
    trailers: [{ name: "Official Trailer", youtubeId: "uYPbbksJxIg" }],
  },
  {
    slug: "the-batman",
    title: "The Batman",
    overview: "Batman uncovers corruption in Gotham while hunting the Riddler.",
    releaseDate: "2022-03-04",
    posterUrl: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
    genres: ["Action"],
    ratings: { tmdb: 7.8 },
    providers: [
      { name: "JioHotstar", url: "https://www.hotstar.com" },
      { name: "Prime Video", url: "https://www.primevideo.com" },
    ],
    trailers: [{ name: "Official Trailer", youtubeId: "mqqft2x_Aa4" }],
  },
  {
    slug: "pathaan",
    title: "Pathaan",
    overview: "An exiled field agent returns for a high-stakes mission.",
    releaseDate: "2023-01-25",
    posterUrl: "https://image.tmdb.org/t/p/w500/rm2oMykm5nX6SzXFr7TGHkO6r8Z.jpg",
    genres: ["Action", "Thriller"],
    ratings: { tmdb: 6.9 },
    providers: [
      { name: "Prime Video", url: "https://www.primevideo.com" },
      { name: "Apple TV", url: "https://tv.apple.com" },
    ],
    trailers: [{ name: "Official Trailer", youtubeId: "vqu4z34wENw" }],
  },
  {
    slug: "jawan",
    title: "Jawan",
    overview: "A vigilante takes on systemic corruption with a personal mission.",
    releaseDate: "2023-09-07",
    posterUrl: "https://image.tmdb.org/t/p/w500/jFt1gS4BGHlK8xt76Y81Alp4dbt.jpg",
    genres: ["Action", "Drama"],
    ratings: { tmdb: 7.0 },
    providers: [
      { name: "Netflix", url: "https://www.netflix.com" },
      { name: "Prime Video", url: "https://www.primevideo.com" },
    ],
    trailers: [{ name: "Official Trailer", youtubeId: "COv52Qyctws" }],
  },
  {
    slug: "rrr",
    title: "RRR",
    overview: "Two revolutionaries forge a powerful friendship against colonial rule.",
    releaseDate: "2022-03-25",
    posterUrl: "https://image.tmdb.org/t/p/w500/lrWj4MV56aM2zJ3ohozw3VfY0AH.jpg",
    genres: ["Action", "Adventure", "Drama"],
    ratings: { tmdb: 7.8 },
    providers: [
      { name: "Netflix", url: "https://www.netflix.com" },
      { name: "ZEE5", url: "https://www.zee5.com" },
    ],
    trailers: [{ name: "Official Trailer", youtubeId: "f_vbAtFSEc0" }],
  },
  {
    slug: "pushpa-the-rise",
    title: "Pushpa: The Rise",
    overview: "A laborer rises in the red sandalwood smuggling underworld.",
    releaseDate: "2021-12-17",
    posterUrl: "https://image.tmdb.org/t/p/w500/uLw7fS5Yg7f2f2Y9n6L6u3z6N0x.jpg",
    genres: ["Action", "Crime"],
    ratings: { tmdb: 7.6 },
    providers: [
      { name: "Prime Video", url: "https://www.primevideo.com" },
      { name: "JioHotstar", url: "https://www.hotstar.com" },
    ],
    trailers: [{ name: "Official Trailer", youtubeId: "Q1NKMPhP8PY" }],
  },
  {
    slug: "leo",
    title: "Leo",
    overview: "A cafe owner with a hidden past is pulled into a violent conflict.",
    releaseDate: "2023-10-19",
    posterUrl: "https://image.tmdb.org/t/p/w500/kotQ4DdehJbhTQexg5g0CW7L3u8.jpg",
    genres: ["Action", "Thriller"],
    ratings: { tmdb: 7.2 },
    providers: [
      { name: "Netflix", url: "https://www.netflix.com" },
      { name: "Sun NXT", url: "https://www.sunnxt.com" },
    ],
    trailers: [{ name: "Official Trailer", youtubeId: "Po3jStA673E" }],
  },
  {
    slug: "vikram",
    title: "Vikram",
    overview: "A black-ops squad uncovers a high-risk drug syndicate conspiracy.",
    releaseDate: "2022-06-03",
    posterUrl: "https://image.tmdb.org/t/p/w500/8fCjK2Yg0GfG6Q4zvQ2tM2A5VYt.jpg",
    genres: ["Action", "Thriller"],
    ratings: { tmdb: 8.3 },
    providers: [
      { name: "JioHotstar", url: "https://www.hotstar.com" },
      { name: "Prime Video", url: "https://www.primevideo.com" },
    ],
    trailers: [{ name: "Official Trailer", youtubeId: "OKBMCL-frPU" }],
  },
  {
    slug: "the-family-man-season-1",
    title: "The Family Man - Season 1",
    overview: "A middle-class man secretly works as an intelligence officer.",
    releaseDate: "2019-09-20",
    posterUrl: "https://image.tmdb.org/t/p/w500/5fU5vYxA3J4bq0xq5C3Y5y8kW4n.jpg",
    genres: ["Action", "Thriller"],
    ratings: { tmdb: 8.7 },
    providers: [{ name: "Prime Video", url: "https://www.primevideo.com" }],
    trailers: [{ name: "Official Trailer", youtubeId: "XatRGut65VI" }],
  },
  {
    slug: "sacred-games-season-1",
    title: "Sacred Games - Season 1",
    overview: "A cop and a crime boss get trapped in a city-wide conspiracy.",
    releaseDate: "2018-07-06",
    posterUrl: "https://image.tmdb.org/t/p/w500/8SRr8vT8f4Q5vXv2F7H9B7J8g2k.jpg",
    genres: ["Crime", "Thriller"],
    ratings: { tmdb: 8.5 },
    providers: [{ name: "Netflix", url: "https://www.netflix.com" }],
    trailers: [{ name: "Official Trailer", youtubeId: "28j8h0RRov4" }],
  },
  {
    slug: "dark-season-1",
    title: "Dark - Season 1",
    overview: "Time-travel secrets unravel after children disappear in a small town.",
    releaseDate: "2017-12-01",
    posterUrl: "https://image.tmdb.org/t/p/w500/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg",
    genres: ["Sci-Fi", "Mystery"],
    ratings: { tmdb: 8.7 },
    providers: [{ name: "Netflix", url: "https://www.netflix.com" }],
    trailers: [{ name: "Official Trailer", youtubeId: "rrwycJ08PSA" }],
  },
];

await mongoose.connect(MONGODB_URI);
let n = 0;
for (const row of DEMO_MOVIES) {
  await Movie.findOneAndUpdate({ slug: row.slug }, { $set: row }, { upsert: true });
  n += 1;
}
console.log(`Upserted ${n} demo movies (non-OTT favorites will resolve for these slugs).`);
await mongoose.disconnect();
