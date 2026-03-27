import "./globals.css";
import Link from "next/link";
import { Suspense } from "react";
import NewsletterBox from "../components/NewsletterBox";
import NavMenu from "../components/NavMenu";
import AuthActions from "../components/AuthActions";

export const metadata = {
  title: "Mirai Movies AI",
  description: "Movies directory style browsing experience.",
};

export default function RootLayout({ children }) {
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/ott", label: "OTT" },
    { href: "/ott?view=shows", label: "Shows" },
    { href: "/ott?view=movies", label: "Movies" },
    { href: "/ott?view=new", label: "New" },
    { href: "/free-movies", label: "Trailers" },
    { href: "/search?q=telugu", label: "Telugu" },
    { href: "/search?q=tamil", label: "Tamil" },
  ];
  const dropdownMenus = [
    {
      label: "Bollywood",
      items: [
        "1080p Bollywood Movies",
        "720p Bollywood Movies",
        "[300MB] Bollywood Movies",
        "(New) Bollywood Movies",
        "Bollywood Latest Movies",
      ],
    },
    {
      label: "Hollywood",
      items: [
        "1080p Hollywood Movies",
        "720p Hollywood Movies",
        "Hollywood Movies 300MB",
        "Hollywood Movies (New)",
        "Hollywood Latest Movies",
      ],
    },
    {
      label: "Dual Audio",
      items: [
        "Dual Audio [Hindi] Movies [300MB]",
        "Dual Audio [Hindi] Movies [100MB]",
        "Dual Audio [Hindi] Movies Mkv 1080p",
        "Dual Audio [Hindi-Telugu] Movie",
        "Dual Audio [Hindi] Latest Movies",
      ],
    },
    {
      label: "TV Shows",
      items: [
        "Web Series Hindi",
        "[Hindi Dubbed] Tv Series (Season)",
        "(WWE) Wrestling",
        "Beyond Season 1",
        "Awards Shows",
      ],
    },
    {
      label: "Genre",
      items: ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Horror", "Thriller"],
    },
  ];
  const yearOptions = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019"];

  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-20 border-b border-slate-800 bg-brandBg/95 px-4 py-4 backdrop-blur md:px-6">
          <nav className="mx-auto flex max-w-7xl flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href="/" className="text-xl font-bold text-white transition hover:text-brandAccent">
                Mirai Movies AI
              </Link>
              <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                <Link
                  href="/subscription"
                  className="hidden shrink-0 items-center gap-2 rounded-md border border-mxGold/70 bg-gradient-to-r from-mxGold/15 to-yellow-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-mxGold shadow-[0_0_0_1px_rgba(212,164,23,0.35)_inset] sm:inline-flex"
                >
                  <span aria-hidden className="text-sm leading-none">
                    ◆
                  </span>
                  Join Mirai Gold
                </Link>
                <form action="/search" method="get" className="w-full md:w-auto">
                  <input
                    type="text"
                    name="q"
                    placeholder="Search movies, genre, year..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brandAccent md:min-w-72"
                  />
                </form>
                <AuthActions />
              </div>
            </div>
            <Suspense fallback={<div className="h-9 animate-pulse rounded-full bg-slate-900/80" aria-hidden />}>
              <NavMenu navItems={navItems} dropdownMenus={dropdownMenus} yearOptions={yearOptions} />
            </Suspense>
          </nav>
        </header>
        <main className="mx-auto min-h-screen max-w-7xl px-6 py-8">{children}</main>
        <footer className="border-t border-slate-800 bg-slate-950/70 px-6 py-5 text-sm text-slate-400">
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Quick Links</p>
              <div className="space-y-1.5">
                <Link href="/search?q=contact" className="block hover:text-white">Contact Us</Link>
                <Link href="/search?q=request" className="block hover:text-white">Request Us</Link>
                <Link href="/search?q=dmca" className="block hover:text-white">DMCA</Link>
                <Link href="/search?q=about" className="block hover:text-white">About Us</Link>
                <Link href="/search?q=sitemap" className="block hover:text-white">Sitemap</Link>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Browse</p>
              <div className="space-y-1.5">
                <Link href="/search?q=bollywood" className="block hover:text-white">Bollywood</Link>
                <Link href="/search?q=hollywood" className="block hover:text-white">Hollywood</Link>
                <Link href="/search?q=dual+audio" className="block hover:text-white">Dual Audio</Link>
                <Link href="/search?q=tv+shows" className="block hover:text-white">TV Shows</Link>
                <Link href="/search?q=web+series" className="block hover:text-white">Web Series</Link>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Follow Us</p>
              <div className="flex flex-wrap gap-2">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full border border-slate-700 bg-slate-900 p-2 text-slate-200 transition hover:border-brandAccent hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5a4.25 4.25 0 0 0 4.25 4.25h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5a4.25 4.25 0 0 0-4.25-4.25h-8.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm5.25-2a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z" /></svg>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="rounded-full border border-slate-700 bg-slate-900 p-2 text-slate-200 transition hover:border-brandAccent hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M23.5 7.2a3 3 0 0 0-2.1-2.1C19.5 4.5 12 4.5 12 4.5s-7.5 0-9.4.6A3 3 0 0 0 .5 7.2C0 9.1 0 12 0 12s0 2.9.5 4.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-4.8.5-4.8s0-2.9-.5-4.8ZM9.5 15.5v-7l6 3.5-6 3.5Z" /></svg>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="rounded-full border border-slate-700 bg-slate-900 p-2 text-slate-200 transition hover:border-brandAccent hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M13.5 22v-8h2.7l.5-3h-3.2V9.1c0-.9.3-1.6 1.6-1.6h1.7V4.8c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2V11H8v3h2.3v8h3.2Z" /></svg>
                </a>
                <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X (Twitter)" className="rounded-full border border-slate-700 bg-slate-900 p-2 text-slate-200 transition hover:border-brandAccent hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M18.9 2h3l-6.6 7.6L23 22h-6l-4.7-6.1L6.9 22H4l7.1-8.2L1 2h6.1l4.2 5.5L18.9 2Zm-1.1 18h1.7L6.2 3.9H4.5L17.8 20Z" /></svg>
                </a>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Subscribe</p>
              <NewsletterBox />
            </div>
          </div>
          <div className="mx-auto mt-5 flex max-w-7xl flex-col gap-1 border-t border-slate-800 pt-3 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
            <p>Copyright {new Date().getFullYear()} Mirai Movies AI. All rights reserved.</p>
            <p>Made for movie discovery and updates.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
