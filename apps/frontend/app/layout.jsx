import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Mirai Movies AI",
  description: "Discover, search, and stream movies from legal sources.",
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
            <div className="flex gap-4 text-sm">
              <Link href="/">Discover</Link>
              <Link href="/search">Search</Link>
              <Link href="/ott">Stream</Link>
              <Link href="/free-movies">Free Movies</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto min-h-screen max-w-7xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
