interface TagProps {
  label: string;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function Tag({
  label,
  isSelected = false,
  onClick,
  className = "",
}: TagProps) {
  const baseStyles =
    "inline-flex items-center text-xs rounded px-1.5 py-0.5 tracking-tight transition-colors";

  if (onClick) {
    const interactiveStyles = isSelected
      ? "text-crimson border border-crimson/35 font-medium shadow-sm cursor-pointer"
      : "text-offwhite/50 border border-charcoal/80 hover:text-crimson hover:border-crimson/25 cursor-pointer";

    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseStyles} ${interactiveStyles} ${className}`}
      >
        {label}
      </button>
    );
  }

  // Display-only tag (e.g. on article pages)
  return (
    <span
      className={`${baseStyles} text-crimson border border-crimson/35 font-medium shadow-sm ${className}`}
    >
      {label}
    </span>
  );
}
