import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Mirai Movies AI",
  description: "Movies directory style browsing experience.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-20 border-b border-slate-800 bg-brandBg/90 px-6 py-4 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl items-center justify-between">
            <Link href="/" className="text-xl font-bold text-white">
              Mirai Movies AI
            </Link>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href="/">HOME</Link>
              <Link href="/search?q=bollywood">Bollywood</Link>
              <Link href="/search?q=hollywood">Hollywood</Link>
              <Link href="/search?q=dual+audio">Dual Audio</Link>
              <Link href="/search?q=telugu">Telugu</Link>
              <Link href="/search?q=tamil">Tamil</Link>
              <Link href="/search?q=tv+shows">Tv Shows</Link>
              <Link href="/search?q=genre">Genre</Link>
              <Link href="/search?q=2025">By Year</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto min-h-screen max-w-7xl px-6 py-8">{children}</main>
        <footer className="border-t border-slate-800 px-6 py-6 text-sm text-slate-400">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-4">
            <Link href="/search?q=contact">Contact Us</Link>
            <Link href="/search?q=request">Request Us</Link>
            <Link href="/search?q=dmca">DMCA</Link>
            <Link href="/search?q=about">About Us</Link>
            <Link href="/search?q=sitemap">Sitemap</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
