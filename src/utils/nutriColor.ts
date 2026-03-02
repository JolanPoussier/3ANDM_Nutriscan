type NutriTheme = {
  nutriA: string;
  nutriB: string;
  nutriC: string;
  nutriD: string;
  nutriE: string;
  nutriUnknown: string;
};

export function getNutriColor(theme: NutriTheme, grade?: string) {
  const g = (grade ?? "").toLowerCase();
  if (g === "a") return theme.nutriA;
  if (g === "b") return theme.nutriB;
  if (g === "c") return theme.nutriC;
  if (g === "d") return theme.nutriD;
  if (g === "e") return theme.nutriE;
  return theme.nutriUnknown;
}
