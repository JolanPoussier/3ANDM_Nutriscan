type OFFParams = Record<string, string | number | boolean | null | undefined>;

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error("Missing EXPO_PUBLIC_API_URL");
}
const WEBSITE_BASE_URL = new URL(API_BASE_URL).origin;

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

export function OFFSearch<T>(searchText: string) {
  const searchParams = new URLSearchParams({
    action: "process",
    json: "1",
    search_simple: "1",
    search_terms: searchText,
    page_size: "20",
    fields: "code,product_name,brands, unique_scans_n",
    sort_by: "unique_scans_n",
  });

  const url = `${WEBSITE_BASE_URL}/cgi/search.pl?${searchParams.toString()}`;
  return fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error(`OpenFoodFactAPI: ${res.status}`);
    }
    return res.json() as Promise<T>;
  });
}
