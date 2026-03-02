import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_PREFERENCES, type Preferences } from "../types/preferences";

const KEY = "@nutriscan/preferences/v1";

export async function getPreferences(): Promise<Preferences> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return DEFAULT_PREFERENCES;

  try {
    const parsed = JSON.parse(raw) as Preferences;
    return {
      avoidAllergens: Array.isArray(parsed.avoidAllergens) ? parsed.avoidAllergens : [],
      diet: parsed.diet ?? "none",
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function setPreferences(prefs: Preferences): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
}

export async function updatePreferences(
  updater: (prev: Preferences) => Preferences
): Promise<Preferences> {
  const prev = await getPreferences();
  const next = updater(prev);
  await setPreferences(next);
  return next;
}