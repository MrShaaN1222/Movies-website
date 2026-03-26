import { apiGet } from "../../../lib/api";

export const dynamic = "force-dynamic";

export default async function OttPlayerPage({ params }) {
  const content = await apiGet(`/api/v1/ott/${params.slug}`);
  if (!content) return <p>OTT content not found.</p>;
  return (
    <section>
      <h1 className="mb-4 text-3xl font-bold">{content.title}</h1>
      <video controls className="mb-4 w-full rounded bg-black">
        <source src={content.hlsUrl} type="application/x-mpegURL" />
      </video>
      <p className="text-slate-300">{content.description}</p>
    </section>
  );
}
