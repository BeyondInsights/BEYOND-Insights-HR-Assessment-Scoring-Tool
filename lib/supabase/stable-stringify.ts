/**
 * STABLE STRINGIFY - Deterministic JSON with deep key sorting
 * Drop-in from ChatGPT review
 */

type JSONValue =
  | null
  | boolean
  | number
  | string
  | JSONValue[]
  | { [key: string]: JSONValue };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && (v as any).constructor === Object;
}

/**
 * canonicalize
 * - Drops undefined
 * - Optionally drops null
 * - Deep-sorts object keys
 * - Preserves array order (do NOT sort arrays; order may be meaningful)
 */
export function canonicalize(
  input: unknown,
  opts: { dropNull?: boolean } = {}
): JSONValue {
  const { dropNull = false } = opts;
  if (input === undefined) return null;
  if (input === null) return null;
  if (typeof input === "string" || typeof input === "number" || typeof input === "boolean") {
    return input;
  }
  if (Array.isArray(input)) {
    return input
      .map((x) => canonicalize(x, opts))
      .filter((x) => !(dropNull && x === null));
  }
  if (isPlainObject(input)) {
    const obj = input as Record<string, unknown>;
    const out: Record<string, JSONValue> = {};
    const keys = Object.keys(obj).sort();
    for (const k of keys) {
      const v = obj[k];
      if (v === undefined) continue;
      const cv = canonicalize(v, opts);
      if (dropNull && cv === null) continue;
      out[k] = cv;
    }
    return out;
  }
  return String(input);
}

/**
 * stableStringify
 * Deterministic string representation of (possibly nested) JSON-like objects.
 */
export function stableStringify(
  input: unknown,
  opts: { dropNull?: boolean } = {}
): string {
  const canonical = canonicalize(input, opts);
  return JSON.stringify(canonical);
}
