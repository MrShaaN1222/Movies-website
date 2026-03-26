const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
import { getMockData } from "./mockData";

export async function apiGet(path) {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return getMockData(path);

    const data = await res.json();
    if (data == null || (Array.isArray(data) && data.length === 0)) {
      const fallback = getMockData(path);
      return fallback ?? data;
    }

    return data;
  } catch (_error) {
    return getMockData(path);
  }
}
