type Props = {
  /** Optional: not used for rendering; kept for consistency with callers */
  field?: string;
  /** Display label for the tile */
  value: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
  /** “Other (specify)” textbox value & change handler */
  otherValue?: string;
  onOtherChange?: (text: string) => void;
};

export default function MultiOptionButton({
  value,
  selected,
  onClick,
  className = "",
  otherValue,
  onOtherChange,
}: Props) {
  // auto-detect “(specify)” label case-insensitively
  const isOther = /other\s*\(specify\)/i.test(value) || /specify:/.test(value);
  const showOther = isOther && selected;

  return (
    <div className={showOther ? "space-y-2" : "space-y-0"}>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onClick}
        className={[
          "w-full h-full px-4 py-2 rounded-lg border-2 text-left",
          "text-sm md:text-base leading-snug whitespace-normal break-words",
          "flex items-center justify-start",
          selected
            ? "border-blue-600 ring-1 ring-blue-300 bg-blue-50"
            : "border-gray-300 bg-white hover:border-gray-400",
          "shadow-sm hover:shadow transition focus-visible:ring-2 focus-visible:ring-blue-300",
          className,
        ].join(" ")}
      >
        {value}
      </button>

      {showOther && (
        <input
          type="text"
          className="w-full border-2 rounded-lg px-3 py-2 text-sm md:text-base mt-2 mb-2"
          placeholder="Please specify"
          value={otherValue ?? ""}
          onChange={(e) => onOtherChange?.(e.target.value)}
        />
      )}
    </div>
  );
}
