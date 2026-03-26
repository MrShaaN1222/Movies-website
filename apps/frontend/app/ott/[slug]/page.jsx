import OttPlayerClient from "../../../components/OttPlayerClient";

export default async function OttPlayerPage({ params }) {
  const { slug } = await params;
  return <OttPlayerClient slug={slug} />;
}
