import { apiGet } from "../../lib/api";
import OttHomeClient from "../../components/OttHomeClient";

export const dynamic = "force-dynamic";

export default async function OttPage({ searchParams }) {
  const sp = await searchParams;
  const view = typeof sp?.view === "string" ? sp.view : "all";
  const items = await apiGet("/api/v1/ott");
  return <OttHomeClient items={Array.isArray(items) ? items : []} view={view} />;
}
