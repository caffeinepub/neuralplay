interface AvatarCircleProps {
  name: string;
  initials: string;
  color: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showOnlineRing?: boolean;
  isOnline?: boolean;
}

const SIZE_MAP = {
  xs: "w-7 h-7 text-[10px]",
  sm: "w-9 h-9 text-xs",
  md: "w-11 h-11 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-xl",
};

export default function AvatarCircle({
  initials,
  color,
  size = "md",
  className = "",
  showOnlineRing = false,
  isOnline = false,
}: AvatarCircleProps) {
  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <div
        className={`${SIZE_MAP[size]} rounded-full flex items-center justify-center font-bold text-white select-none`}
        style={{ background: color }}
      >
        {initials}
      </div>
      {showOnlineRing && (
        <span
          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
          style={{
            background: isOnline
              ? "oklch(0.52 0.155 152)"
              : "oklch(0.70 0.02 145)",
          }}
        />
      )}
    </div>
  );
}
