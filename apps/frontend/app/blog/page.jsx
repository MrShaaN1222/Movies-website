import Link from "next/link";
import { apiGet } from "../../lib/api";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await apiGet("/api/v1/blog/posts");
  return (
    <section>
      <h1 className="mb-4 text-3xl font-bold">Blog and Sponsored Content</h1>
      <div className="space-y-3">
        {(posts || []).map((p) => (
          <article key={p.slug} className="rounded bg-brandCard p-4">
            <Link href={`/blog/${p.slug}`} className="text-xl font-semibold">
              {p.title}
            </Link>
            <p className="mt-2 text-slate-300">{p.excerpt}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
