const movies = [
  {
    _id: "m1",
    slug: "interstellar",
    title: "Interstellar",
    releaseDate: "2014-11-07",
    language: "English",
    genre: "Sci-Fi",
    industry: "Hollywood",
    poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    overview: "A team travels through a wormhole to find humanity a new home.",
    trailers: [{ name: "Official Trailer", youtubeId: "zSWdZVtXT7E" }],
    providers: [
      { name: "Prime Video", url: "https://www.primevideo.com" },
      { name: "Apple TV", url: "https://tv.apple.com" },
    ],
  },
  {
    _id: "m2",
    slug: "inception",
    title: "Inception",
    releaseDate: "2010-07-16",
    language: "English",
    genre: "Sci-Fi",
    industry: "Hollywood",
    poster: "https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg",
    overview: "A skilled thief enters dreams to steal secrets from the subconscious.",
    trailers: [{ name: "Official Trailer", youtubeId: "YoHD9XEInc0" }],
    providers: [
      { name: "Netflix", url: "https://www.netflix.com" },
      { name: "Prime Video", url: "https://www.primevideo.com" },
    ],
  },
  {
    _id: "m3",
    slug: "dune-part-two",
    title: "Dune: Part Two",
    releaseDate: "2024-03-01",
    language: "English",
    genre: "Sci-Fi",
    industry: "Hollywood",
    poster: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
    overview: "Paul Atreides unites with the Fremen to challenge House Harkonnen.",
    trailers: [{ name: "Official Trailer", youtubeId: "Way9Dexny3w" }],
    providers: [
      { name: "Prime Video", url: "https://www.primevideo.com" },
      { name: "BookMyShow Stream", url: "https://in.bookmyshow.com/stream" },
    ],
  },
  {
    _id: "m4",
    slug: "oppenheimer",
    title: "Oppenheimer",
    releaseDate: "2023-07-21",
    language: "English",
    genre: "Drama",
    industry: "Hollywood",
    poster: "https://image.tmdb.org/t/p/w500/ptpr0kGAckfQkJeJIt8st5dglvd.jpg",
    overview: "A historical drama about J. Robert Oppenheimer and the Manhattan Project.",
    trailers: [{ name: "Official Trailer", youtubeId: "uYPbbksJxIg" }],
    providers: [
      { name: "JioHotstar", url: "https://www.hotstar.com" },
      { name: "Apple TV", url: "https://tv.apple.com" },
    ],
  },
  {
    _id: "m5",
    slug: "the-batman",
    title: "The Batman",
    releaseDate: "2022-03-04",
    language: "English",
    genre: "Action",
    industry: "Hollywood",
    poster: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
    overview: "Batman uncovers corruption in Gotham while hunting the Riddler.",
    trailers: [{ name: "Official Trailer", youtubeId: "mqqft2x_Aa4" }],
    providers: [
      { name: "JioHotstar", url: "https://www.hotstar.com" },
      { name: "Prime Video", url: "https://www.primevideo.com" },
    ],
  },
];

const freeMovies = [
  { _id: "f1", title: "Night of the Living Dead", category: "Public Domain", youtubeId: "H91BxkBXttE" },
  { _id: "f2", title: "His Girl Friday", category: "Classic", youtubeId: "5m3M6FWv0Q8" },
  { _id: "f3", title: "The General", category: "Silent Era", youtubeId: "Xde8fRofS5E" },
];

const blogPosts = [
  {
    slug: "best-sci-fi-movies-2026",
    title: "Best Sci-Fi Movies to Watch in 2026",
    excerpt: "A curated list of high-concept films across streaming platforms.",
    sponsored: false,
  },
  {
    slug: "streaming-bundle-guide",
    title: "How to Build the Right Streaming Bundle",
    excerpt: "Compare costs and find the most value across providers.",
    sponsored: true,
  },
];

const ottItems = [
  {
    _id: "o1",
    slug: "mirai-original-the-last-signal",
    title: "Mirai Original: The Last Signal",
    type: "Sci-Fi Series",
    description: "A deep-space rescue mystery spanning eight episodes.",
    hlsUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  },
  {
    _id: "o2",
    slug: "mirai-original-shadow-city",
    title: "Mirai Original: Shadow City",
    type: "Crime Thriller",
    description: "A detective drama set in a hyper-connected metropolis.",
    hlsUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  },
];

const reviewsBySlug = {
  interstellar: [
    { _id: "r1", rating: 9, content: "Emotional, ambitious, and visually stunning." },
    { _id: "r2", rating: 8, content: "Great score and world building." },
  ],
  inception: [{ _id: "r3", rating: 9, content: "A smart thriller with incredible set pieces." }],
};

function getMovie(slug) {
  return movies.find((m) => m.slug === slug) || null;
}

function searchMovies(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return movies.filter((m) =>
    [m.title, m.overview, m.genre, m.language, m.industry, m.releaseDate].join(" ").toLowerCase().includes(q)
  );
}

export function getMockData(path) {
  const [pathname, queryString] = path.split("?");
  const params = new URLSearchParams(queryString || "");

  if (pathname === "/api/v1/movies/trending") return movies.slice(0, 4);
  if (pathname === "/api/v1/movies/popular") return movies.slice(1, 5);
  if (pathname === "/api/v1/movies/upcoming") return movies.slice(2, 5);
  if (pathname === "/api/v1/movies/search") return searchMovies(params.get("q") || "");
  if (pathname === "/api/v1/free-movies") return freeMovies;
  if (pathname === "/api/v1/blog/posts") return blogPosts;
  if (pathname === "/api/v1/ott") return ottItems;

  if (pathname.startsWith("/api/v1/blog/posts/")) {
    const slug = pathname.replace("/api/v1/blog/posts/", "");
    return blogPosts.find((post) => post.slug === slug) || null;
  }

  if (pathname.startsWith("/api/v1/ott/")) {
    const slug = pathname.replace("/api/v1/ott/", "");
    return ottItems.find((item) => item.slug === slug) || null;
  }

  if (pathname.startsWith("/api/v1/movies/") && pathname.endsWith("/reviews")) {
    const slug = pathname.replace("/api/v1/movies/", "").replace("/reviews", "");
    return reviewsBySlug[slug] || [];
  }

  if (pathname.startsWith("/api/v1/movies/") && pathname.endsWith("/watch-providers")) {
    const slug = pathname.replace("/api/v1/movies/", "").replace("/watch-providers", "");
    const movie = getMovie(slug);
    return movie?.providers || [];
  }

  if (pathname.startsWith("/api/v1/movies/")) {
    const slug = pathname.replace("/api/v1/movies/", "");
    return getMovie(slug);
  }

  return null;
}
