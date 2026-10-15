export function BotAvatar({ name, color, className = "size-10 text-sm" }: { name: string; color: string; className?: string }) {
  const initials = (name || "?")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${className}`}
      style={{ background: `linear-gradient(140deg, ${color}, color-mix(in oklab, ${color} 45%, #0a0a12))` }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
