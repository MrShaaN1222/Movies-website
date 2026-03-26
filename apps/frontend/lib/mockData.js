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
    quality: "1080p",
    runtime: "2h 49m",
    country: "USA",
    overview: "A team travels through a wormhole to find humanity a new home.",
    trailers: [{ name: "Official Trailer", youtubeId: "zSWdZVtXT7E" }],
    screenshots: [
      "https://image.tmdb.org/t/p/w780/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
      "https://image.tmdb.org/t/p/w780/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
      "https://image.tmdb.org/t/p/w780/8qv6f9Y3jN1M8x8M9vDOMkMt2rt.jpg",
    ],
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
    quality: "1080p",
    runtime: "2h 28m",
    country: "USA",
    overview: "A skilled thief enters dreams to steal secrets from the subconscious.",
    trailers: [{ name: "Official Trailer", youtubeId: "YoHD9XEInc0" }],
    screenshots: [
      "https://image.tmdb.org/t/p/w780/s2bT29y0ngXxxu2IA8AOzzXTRhd.jpg",
      "https://image.tmdb.org/t/p/w780/qmDpIHrmpJINaRKAfWQfftjCdyi.jpg",
      "https://image.tmdb.org/t/p/w780/wg7jM3nJ2fX3mQ9t6Jv4cGr0qfA.jpg",
    ],
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
    quality: "1080p",
    runtime: "2h 46m",
    country: "USA",
    overview: "Paul Atreides unites with the Fremen to challenge House Harkonnen.",
    trailers: [{ name: "Official Trailer", youtubeId: "Way9Dexny3w" }],
    screenshots: [
      "https://image.tmdb.org/t/p/w780/caQp2MhwlkJ3V9D4Tr5kL5M4u9Y.jpg",
      "https://image.tmdb.org/t/p/w780/oBIQDKcqNxKckjugtmzpIIOgoc4.jpg",
      "https://image.tmdb.org/t/p/w780/lY6kY06lYxGvU8gjDo0M2ICf8hQ.jpg",
    ],
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
    quality: "1080p",
    runtime: "3h 0m",
    country: "USA",
    overview: "A historical drama about J. Robert Oppenheimer and the Manhattan Project.",
    trailers: [{ name: "Official Trailer", youtubeId: "uYPbbksJxIg" }],
    screenshots: [
      "https://image.tmdb.org/t/p/w780/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
      "https://image.tmdb.org/t/p/w780/aEIh1qfK3f6oFQ6Y5uABm0f4MJa.jpg",
      "https://image.tmdb.org/t/p/w780/e0M3OjW6f7H8k2x1lS4qXv8W2cA.jpg",
    ],
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
    quality: "1080p",
    runtime: "2h 56m",
    country: "USA",
    overview: "Batman uncovers corruption in Gotham while hunting the Riddler.",
    trailers: [{ name: "Official Trailer", youtubeId: "mqqft2x_Aa4" }],
    screenshots: [
      "https://image.tmdb.org/t/p/w780/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg",
      "https://image.tmdb.org/t/p/w780/tRS6jvPM9qPrrnx2KRp3ew96Yot.jpg",
      "https://image.tmdb.org/t/p/w780/5P8SmMzSNYikXpxil6BYzJ16611.jpg",
    ],
    providers: [
      { name: "JioHotstar", url: "https://www.hotstar.com" },
      { name: "Prime Video", url: "https://www.primevideo.com" },
    ],
  },
  {
    _id: "m6",
    slug: "pathaan",
    title: "Pathaan",
    releaseDate: "2023-01-25",
    language: "Hindi",
    genre: "Action, Thriller",
    industry: "Bollywood",
    poster: "https://image.tmdb.org/t/p/w500/rm2oMykm5nX6SzXFr7TGHkO6r8Z.jpg",
    quality: "1080p",
    runtime: "2h 26m",
    country: "India",
    overview: "An exiled field agent returns for a high-stakes mission.",
    trailers: [{ name: "Official Trailer", youtubeId: "vqu4z34wENw" }],
    screenshots: ["https://image.tmdb.org/t/p/w780/8f9dnOtpArDrOMEylpSN9Sc6fuz.jpg"],
    providers: [
      { name: "Prime Video", url: "https://www.primevideo.com" },
      { name: "Apple TV", url: "https://tv.apple.com" },
    ],
    tags: ["bollywood", "dual audio", "action"],
  },
  {
    _id: "m7",
    slug: "jawan",
    title: "Jawan",
    releaseDate: "2023-09-07",
    language: "Hindi",
    genre: "Action, Drama",
    industry: "Bollywood",
    poster: "https://image.tmdb.org/t/p/w500/jFt1gS4BGHlK8xt76Y81Alp4dbt.jpg",
    quality: "1080p",
    runtime: "2h 49m",
    country: "India",
    overview: "A vigilante takes on systemic corruption with a personal mission.",
    trailers: [{ name: "Official Trailer", youtubeId: "COv52Qyctws" }],
    screenshots: ["https://image.tmdb.org/t/p/w780/7fveaM9g2RkQkYH3fYf8ifN0b8B.jpg"],
    providers: [
      { name: "Netflix", url: "https://www.netflix.com" },
      { name: "Prime Video", url: "https://www.primevideo.com" },
    ],
    tags: ["bollywood", "dual audio", "action"],
  },
  {
    _id: "m8",
    slug: "rrr",
    title: "RRR",
    releaseDate: "2022-03-25",
    language: "Telugu, Dual Audio",
    genre: "Action, Adventure, Drama",
    industry: "Tollywood",
    poster: "https://image.tmdb.org/t/p/w500/lrWj4MV56aM2zJ3ohozw3VfY0AH.jpg",
    quality: "1080p",
    runtime: "3h 2m",
    country: "India",
    overview: "Two revolutionaries forge a powerful friendship against colonial rule.",
    trailers: [{ name: "Official Trailer", youtubeId: "f_vbAtFSEc0" }],
    screenshots: ["https://image.tmdb.org/t/p/w780/qfB6QNaCtmGDy9ujvBOUs7UaPx.jpg"],
    providers: [
      { name: "Netflix", url: "https://www.netflix.com" },
      { name: "ZEE5", url: "https://www.zee5.com" },
    ],
    tags: ["telugu", "dual audio", "action", "adventure"],
  },
  {
    _id: "m9",
    slug: "pushpa-the-rise",
    title: "Pushpa: The Rise",
    releaseDate: "2021-12-17",
    language: "Telugu, Dual Audio",
    genre: "Action, Crime",
    industry: "Tollywood",
    poster: "https://image.tmdb.org/t/p/w500/uLw7fS5Yg7f2f2Y9n6L6u3z6N0x.jpg",
    quality: "1080p",
    runtime: "2h 59m",
    country: "India",
    overview: "A laborer rises in the red sandalwood smuggling underworld.",
    trailers: [{ name: "Official Trailer", youtubeId: "Q1NKMPhP8PY" }],
    screenshots: ["https://image.tmdb.org/t/p/w780/5vUux2vNUTl9fP5qZxB2S7R5CVv.jpg"],
    providers: [
      { name: "Prime Video", url: "https://www.primevideo.com" },
      { name: "JioHotstar", url: "https://www.hotstar.com" },
    ],
    tags: ["telugu", "dual audio", "action"],
  },
  {
    _id: "m10",
    slug: "leo",
    title: "Leo",
    releaseDate: "2023-10-19",
    language: "Tamil, Dual Audio",
    genre: "Action, Thriller",
    industry: "Kollywood",
    poster: "https://image.tmdb.org/t/p/w500/kotQ4DdehJbhTQexg5g0CW7L3u8.jpg",
    quality: "1080p",
    runtime: "2h 44m",
    country: "India",
    overview: "A cafe owner with a hidden past is pulled into a violent conflict.",
    trailers: [{ name: "Official Trailer", youtubeId: "Po3jStA673E" }],
    screenshots: ["https://image.tmdb.org/t/p/w780/8NqL9xM0xW6W2m9Lx2D7D0j2y9j.jpg"],
    providers: [
      { name: "Netflix", url: "https://www.netflix.com" },
      { name: "Sun NXT", url: "https://www.sunnxt.com" },
    ],
    tags: ["tamil", "dual audio", "action"],
  },
  {
    _id: "m11",
    slug: "vikram",
    title: "Vikram",
    releaseDate: "2022-06-03",
    language: "Tamil, Dual Audio",
    genre: "Action, Thriller",
    industry: "Kollywood",
    poster: "https://image.tmdb.org/t/p/w500/8fCjK2Yg0GfG6Q4zvQ2tM2A5VYt.jpg",
    quality: "1080p",
    runtime: "2h 54m",
    country: "India",
    overview: "A black-ops squad uncovers a high-risk drug syndicate conspiracy.",
    trailers: [{ name: "Official Trailer", youtubeId: "OKBMCL-frPU" }],
    screenshots: ["https://image.tmdb.org/t/p/w780/sfCs6r4oHfYQfQJZp6b3X6kM3nL.jpg"],
    providers: [
      { name: "JioHotstar", url: "https://www.hotstar.com" },
      { name: "Prime Video", url: "https://www.primevideo.com" },
    ],
    tags: ["tamil", "dual audio", "action"],
  },
  {
    _id: "m12",
    slug: "the-family-man-season-1",
    title: "The Family Man - Season 1",
    releaseDate: "2019-09-20",
    language: "Hindi",
    genre: "Action, Thriller",
    industry: "Bollywood",
    poster: "https://image.tmdb.org/t/p/w500/5fU5vYxA3J4bq0xq5C3Y5y8kW4n.jpg",
    quality: "1080p",
    runtime: "8 Episodes",
    country: "India",
    overview: "A middle-class man secretly works as an intelligence officer.",
    trailers: [{ name: "Official Trailer", youtubeId: "XatRGut65VI" }],
    screenshots: ["https://image.tmdb.org/t/p/w780/o9LkK6vTQ6fYV6KxS2w6d7C7e6q.jpg"],
    providers: [{ name: "Prime Video", url: "https://www.primevideo.com" }],
    tags: ["tv shows", "web series", "bollywood", "hindi"],
  },
  {
    _id: "m13",
    slug: "sacred-games-season-1",
    title: "Sacred Games - Season 1",
    releaseDate: "2018-07-06",
    language: "Hindi",
    genre: "Crime, Thriller",
    industry: "Bollywood",
    poster: "https://image.tmdb.org/t/p/w500/8SRr8vT8f4Q5vXv2F7H9B7J8g2k.jpg",
    quality: "1080p",
    runtime: "8 Episodes",
    country: "India",
    overview: "A cop and a crime boss get trapped in a city-wide conspiracy.",
    trailers: [{ name: "Official Trailer", youtubeId: "28j8h0RRov4" }],
    screenshots: ["https://image.tmdb.org/t/p/w780/7fR4VqfXqzJ9S4d4xjQf2QqY3vK.jpg"],
    providers: [{ name: "Netflix", url: "https://www.netflix.com" }],
    tags: ["tv shows", "web series", "bollywood", "crime"],
  },
  {
    _id: "m14",
    slug: "dark-season-1",
    title: "Dark - Season 1",
    releaseDate: "2017-12-01",
    language: "German, Dual Audio",
    genre: "Sci-Fi, Mystery",
    industry: "Hollywood",
    poster: "https://image.tmdb.org/t/p/w500/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg",
    quality: "1080p",
    runtime: "10 Episodes",
    country: "Germany",
    overview: "Time-travel secrets unravel after children disappear in a small town.",
    trailers: [{ name: "Official Trailer", youtubeId: "rrwycJ08PSA" }],
    screenshots: ["https://image.tmdb.org/t/p/w780/eTKduWLtvWw2Jv13M3qvS1V2M0K.jpg"],
    providers: [{ name: "Netflix", url: "https://www.netflix.com" }],
    tags: ["tv shows", "web series", "hollywood", "dual audio", "sci-fi"],
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
  inception: [
    { _id: "r3", rating: 9, content: "A smart thriller with incredible set pieces." },
    { _id: "r4", rating: 8, content: "Complex story, strong performances, and top visuals." },
  ],
  "dune-part-two": [
    { _id: "r5", rating: 9, content: "Massive scale with incredible world building and action." },
    { _id: "r6", rating: 8, content: "Great continuation with strong visuals and soundtrack." },
  ],
  oppenheimer: [
    { _id: "r7", rating: 9, content: "Powerful performances and an intense cinematic experience." },
    { _id: "r8", rating: 8, content: "Rich dialogue and excellent direction throughout." },
  ],
  "the-batman": [
    { _id: "r9", rating: 8, content: "Dark detective tone with strong atmosphere and score." },
    { _id: "r10", rating: 8, content: "Gritty Gotham and a compelling new Batman style." },
  ],
};

function getMovie(slug) {
  return movies.find((m) => m.slug === slug) || null;
}

function searchMovies(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  if (q === "genre") return movies;
  return movies.filter((m) =>
    [m.title, m.overview, m.genre, m.language, m.industry, m.releaseDate, ...(m.tags || [])]
      .join(" ")
      .toLowerCase()
      .includes(q)
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
