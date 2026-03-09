const SCORE_BY_GRADE: Record<string, number> = {
  a: 5,
  b: 4,
  c: 3,
  d: 2,
  e: 1,
};

const GRADE_BY_SCORE: Record<number, string> = {
  5: "A",
  4: "B",
  3: "C",
  2: "D",
  1: "E",
};

export function nutriGradeToScore(grade?: string): number | null {
  if (!grade) return null;
  const value = SCORE_BY_GRADE[grade.toLowerCase()];
  return Number.isFinite(value) ? value : null;
}

export function nutriScoreToGrade(score?: number): string | null {
  if (typeof score !== "number" || Number.isNaN(score)) return null;
  if (score >= 4.5) return "A";
  if (score >= 3.5) return "B";
  if (score >= 2.5) return "C";
  if (score >= 1.5) return "D";
  return "E";
}

export function nutriScoreNumberToGrade(score?: number): string | null {
  if (typeof score !== "number" || Number.isNaN(score)) return null;
  const rounded = Math.round(score);
  return GRADE_BY_SCORE[rounded] ?? null;
}

export function normalizeNutriGrade(grade?: string | null): string | null {
  if (!grade) return null;
  const value = grade.trim().toUpperCase();
  return SCORE_BY_GRADE[value.toLowerCase()] ? value : null;
}
