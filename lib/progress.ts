/**
 * percentComplete
 * Accepts "loose" required spec (string | string[])[] and the older strict ([string,"array"])[].
 * - string            -> single-value field must be present/non-empty
 * - string[] (loose)  -> treat as [firstString,"array"] (array field must have length > 0)
 * - [string,"array"]  -> explicit array field
 */
type SingleKey = string;
type ArrayKeyTuple = [string, "array"];
type LooseRequired = SingleKey | string[];
type RequiredKey = SingleKey | ArrayKeyTuple;

function normalizeRequired(required: (LooseRequired | RequiredKey)[]): RequiredKey[] {
  return required.map((r) => {
    // If it's already explicit tuple: [key,"array"]
    if (Array.isArray(r) && r.length === 2 && r[1] === "array") {
      return r as ArrayKeyTuple;
    }
    // If it's a string[] (loose array indicator), treat first element as the key
    if (Array.isArray(r)) {
      const key = String(r[0] ?? "");
      return [key, "array"] as ArrayKeyTuple;
    }
    // Plain string key
    return r as SingleKey;
  });
}

function isNonEmpty(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (value === null || value === undefined) return false;
  const s = String(value).trim();
  return s.length > 0;
}

/**
 * data: record of answers (strings, numbers, booleans, arrays)
 * required: list of required fields using any of the accepted forms above
 * returns a 0-100 integer (% complete)
 */
export function percentComplete(
  data: Record<string, unknown>,
  required: (LooseRequired | RequiredKey)[]
): number {
  const req = normalizeRequired(required);
  const total = req.length || 1;
  let got = 0;

  for (const keySpec of req) {
    if (Array.isArray(keySpec)) {
      // array field
      const key = keySpec[0];
      const val = data?.[key];
      if (Array.isArray(val) && val.length > 0) got++;
    } else {
      // single field
      const val = data?.[keySpec];
      if (isNonEmpty(val)) got++;
    }
  }

  return Math.round((got / total) * 100);
}
