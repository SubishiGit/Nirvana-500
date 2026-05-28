export function extractVillaKey(id) {
  // For this project we join sheet rows to SVG plots by an *exact* id match.
  // We still ignore non-villa layers (canal/landscape/clubhouse) by convention.
  const s = String(id ?? "").trim();
  if (!s) return null;
  const upper = s.toUpperCase();
  if (/CANAL|LANDSCAPE|CLUBHOUSE/.test(upper)) return null;
  return upper;
}