type OFFParams = Record<string, string | number | boolean | null | undefined>;
type OFFSearchParams = {
  page?: number;
  size?: number;
  sort_by?: string;
  fields?: string;
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const OFF_SEARCH_BASE_URL = process.env.EXPO_PUBLIC_OFF_SEARCH_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("Missing EXPO_PUBLIC_API_URL");
}
if (!OFF_SEARCH_BASE_URL) {
  throw new Error("Missing EXPO_PUBLIC_OFF_SEARCH_BASE_URL");
}
const OFF_SEARCH_ROOT = OFF_SEARCH_BASE_URL.trim().replace(/[;]+$/, "").replace(/\/+$/, "");

function buildOFFUrl(path: string, params: OFFParams = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return `${API_BASE_URL}${path}${query ? `?${query}` : ""}`;
}

async function offRequest<T>(path: string, params: OFFParams = {}): Promise<T> {
  const url = buildOFFUrl(path, params);

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "NutriScanSUPINFO/1.0 (contact@supinfo.com)",
    },
  });

  if (!res.ok) {
    throw new Error(`OpenFoodFactAPI: ${res.status}`);
  }

  return res.json();
}

export function OFFFetch<T>(endpoint: string, params: OFFParams = {}) {
  const path = endpoint.endsWith(".json") ? endpoint : `${endpoint}.json`;
  return offRequest<T>(path, params);
}

export function OFFSearch<T>(searchText: string, params: OFFSearchParams = {}) {
  const searchParams = new URLSearchParams({
    q: searchText,
    page: String(params.page ?? 1),
    size: String(params.size ?? 20),
    sort_by: params.sort_by ?? "unique_scans_n",
  });

  if (params.fields) {
    searchParams.set("fields", params.fields);
  }

  const url = `${OFF_SEARCH_ROOT}/search?${searchParams.toString()}`;
  return fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "NutriScanSUPINFO/1.0 (contact@supinfo.com)",
    },
  }).then(async (res) => {
    if (!res.ok) {
      throw new Error(`OpenFoodFactAPI: ${res.status} (${url})`);
    }

    try {
      return (await res.json()) as T;
    } catch {
      throw new Error(`OpenFoodFactAPI: invalid JSON response (${url})`);
    }
  }).catch((e) => {
    const message = e instanceof Error ? e.message : String(e);
    throw new Error(`Search request failed: ${message}`);
  });
}
