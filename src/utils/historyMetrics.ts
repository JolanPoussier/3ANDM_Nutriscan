import type { HistoryItem } from "../types/history";
import { nutriGradeToScore, nutriScoreNumberToGrade, nutriScoreToGrade } from "./nutriScore";

export type WeeklyScorePoint = {
  key: string;
  label: string;
  average: number;
};

export type HistoryMetrics = {
  scannedCount: number;
  averageScore: number | null;
  globalGrade: string | null;
  bestGrade: string | null;
  worstGrade: string | null;
  weeklyScores: WeeklyScorePoint[];
};

export function formatHistoryDate(ts: number) {
  const d = new Date(ts);
  return `${d.toLocaleDateString()} • ${d.toLocaleTimeString().slice(0, 5)}`;
}

export function getWeekStartTimestamp(timestamp: number) {
  const d = new Date(timestamp);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d.getTime();
}

export function formatWeekLabel(timestamp: number) {
  const d = new Date(timestamp);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function computeHistoryMetrics(items: HistoryItem[]): HistoryMetrics {
  const scoredItems = items
    .map((item) => ({ ...item, score: nutriGradeToScore(item.nutriScore) }))
    .filter((item) => item.score !== null) as Array<HistoryItem & { score: number }>;

  const averageScore =
    scoredItems.length === 0
      ? null
      : scoredItems.reduce((acc, item) => acc + item.score, 0) / scoredItems.length;

  const bestGrade =
    scoredItems.length === 0
      ? null
      : nutriScoreNumberToGrade(scoredItems.reduce((max, item) => Math.max(max, item.score), 1));

  const worstGrade =
    scoredItems.length === 0
      ? null
      : nutriScoreNumberToGrade(scoredItems.reduce((min, item) => Math.min(min, item.score), 5));

  const buckets = new Map<number, { total: number; count: number }>();
  scoredItems.forEach((item) => {
    const weekStart = getWeekStartTimestamp(item.scannedAt);
    const existing = buckets.get(weekStart) ?? { total: 0, count: 0 };
    existing.total += item.score;
    existing.count += 1;
    buckets.set(weekStart, existing);
  });

  const weeklyScores = [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(-8)
    .map(([weekStart, value]) => ({
      key: String(weekStart),
      label: formatWeekLabel(weekStart),
      average: value.total / value.count,
    }));

  return {
    scannedCount: items.length,
    averageScore,
    globalGrade: nutriScoreToGrade(averageScore ?? undefined),
    bestGrade,
    worstGrade,
    weeklyScores,
  };
}
