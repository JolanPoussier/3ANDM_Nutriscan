import AsyncStorage from "@react-native-async-storage/async-storage";
import type { HistoryItem } from "../types/history";

const HISTORY_KEY = "@nutriscan/history_v1";
const MAX_ITEMS = 100; 

export async function getHistory(): Promise<HistoryItem[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function setHistory(items: HistoryItem[]) {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

export async function addToHistory(item: HistoryItem): Promise<HistoryItem[]> {
  const current = await getHistory();

  const filtered = current.filter((x) => x.barcode !== item.barcode);

  const next = [
    { ...item, scannedAt: item.scannedAt ?? Date.now() },
    ...filtered,
  ].slice(0, MAX_ITEMS);

  await setHistory(next);
  return next;
}

export async function removeFromHistory(barcode: string): Promise<HistoryItem[]> {
  const current = await getHistory();
  const next = current.filter((x) => x.barcode !== barcode);
  await setHistory(next);
  return next;
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}