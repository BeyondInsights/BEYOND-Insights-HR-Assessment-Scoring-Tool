type Props = {
  field: string;
  value: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
};

function splitLabel(label: string) {
  const i = label.indexOf(":");
  if (i === -1) return { pre: null, post: label };
  return { pre: label.slice(0, i + 1), post: label.slice(i + 1) };
}

export default function OptionButton({
  value, selected, onClick, className = "",
}: Props) {
  const { pre, post } = splitLabel(value);

  return (
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
      {pre ? (<><span className="font-semibold text-black">{pre}</span>{post}</>) : value}
    </button>
  );
}
