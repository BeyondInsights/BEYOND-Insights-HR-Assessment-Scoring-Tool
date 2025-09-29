"use client";

type Props = {
  /** Optional: not used for rendering; kept for consistency with callers */
  field?: string;
  /** Preferred: most of your pages pass value="..." */
  value?: string;
  /** Also supported: if some places pass label="..." this will still work */
  label?: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
};

/** Split at the first colon; render the prefix in bold */
function splitLabel(text: string) {
  const i = text.indexOf(":");
  if (i === -1) return { pre: null as string | null, post: text };
  return { pre: text.slice(0, i + 1), post: text.slice(i + 1) };
}

export default function OptionButton({
  value,
  label,
  selected,
  onClick,
  className = "",
}: Props) {
  // Accept either value or label so callers don’t break
  const text = (value ?? label ?? "").toString();
  const { pre, post } = splitLabel(text);

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={[
        // uniform tile footprint
        "w-full h-full px-4 py-2 rounded-lg border-2 text-left",
        "text-sm md:text-base leading-snug whitespace-normal break-words",
        "flex items-center justify-start",
        // strong selected state
        selected
          ? "border-blue-600 ring-1 ring-blue-300 bg-blue-50"
          : "border-gray-300 bg-white hover:border-gray-400",
        "shadow-sm hover:shadow transition focus-visible:ring-2 focus-visible:ring-blue-300",
        className,
      ].join(" ")}
    >
      {pre ? (
        <>
          <span className="font-semibold text-black">{pre}</span>
          {post}
        </>
      ) : (
        text
      )}
    </button>
  );
}
