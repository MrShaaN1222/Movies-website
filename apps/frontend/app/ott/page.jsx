import Link from "next/link";
import { apiGet } from "../../lib/api";

export const dynamic = "force-dynamic";

export default async function OttPage() {
  const items = await apiGet("/api/v1/ott");
  return (
    <section>
      <h1 className="mb-4 text-3xl font-bold">Premium OTT</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {(items || []).map((item) => (
          <article key={item._id} className="rounded bg-brandCard p-4">
            <h2 className="font-semibold">{item.title}</h2>
            <p className="my-2 text-sm text-slate-300">{item.type}</p>
            <div className="flex items-center gap-3">
              <Link href={`/ott/${item.slug}`} className="text-brandAccent">
                Watch now
              </Link>
              {item.isPremium ? (
                <Link href="/purchase" className="rounded border border-slate-700 px-2 py-1 text-xs text-white">
                  Purchase
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
