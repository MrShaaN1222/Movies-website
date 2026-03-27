const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
import { getMockData } from "./mockData";

function getClientToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("mirai_token") || "";
}

async function apiRequest(path, options = {}) {
  const token = options.token || getClientToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const requestOptions = {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    next: options.next,
  };
  if (typeof options.cache !== "undefined") {
    requestOptions.cache = options.cache;
  }

  const res = await fetch(`${API_URL}${path}`, requestOptions);

  if (!res.ok) {
    let message = "Request failed";
    let code;
    let amountInr;
    try {
      const error = await res.json();
      message = error?.message || message;
      code = error?.code;
      if (error?.amountInr != null) amountInr = error.amountInr;
    } catch {}
    const err = new Error(message);
    err.status = res.status;
    if (code) err.code = code;
    if (amountInr != null) err.amountInr = amountInr;
    throw err;
  }

  return res.json();
}

export async function apiGet(path) {
  try {
    const data = await apiRequest(path, { next: { revalidate: 60 }, cache: "force-cache" });
    if (data == null || (Array.isArray(data) && data.length === 0)) {
      const fallback = getMockData(path);
      return fallback ?? data;
    }

    return data;
  } catch (_error) {
    return getMockData(path);
  }
}

export async function apiGetAuth(path) {
  return apiRequest(path, { cache: "no-store" });
}

export async function apiPost(path, body) {
  return apiRequest(path, { method: "POST", body, cache: "no-store" });
}

export async function apiPostAuth(path, body) {
  return apiRequest(path, { method: "POST", body, cache: "no-store" });
}

export async function apiPatchAuth(path, body) {
  return apiRequest(path, { method: "PATCH", body, cache: "no-store" });
}

export async function apiDeleteAuth(path, body) {
  return apiRequest(path, { method: "DELETE", body, cache: "no-store" });
}
