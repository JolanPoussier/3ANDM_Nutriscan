export async function OFFFetch<T>(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<T> {
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
  if (!BASE_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_URL");
  }

  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();
  const url = `${BASE_URL}${endpoint}.json${query ? `?${query}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenFoodFactAPI: ${res.status}`);
  return res.json();
}
