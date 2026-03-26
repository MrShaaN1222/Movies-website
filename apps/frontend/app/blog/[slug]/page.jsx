import { apiGet } from "../../../lib/api";

export const dynamic = "force-dynamic";

export default async function BlogDetailPage({ params }) {
  const post = await apiGet(`/api/v1/blog/posts/${params.slug}`);
  if (!post) return <p>Post not found.</p>;
  return (
    <article className="rounded bg-brandCard p-6">
      <h1 className="text-3xl font-bold">{post.title}</h1>
      {post.sponsored ? <p className="mt-2 text-yellow-300">Sponsored Content</p> : null}
      <p className="mt-4 text-slate-200">{post.excerpt}</p>
    </article>
  );
}
