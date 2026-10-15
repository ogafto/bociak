import type { ReactNode } from "react";
import { BotAvatar } from "./bot-avatar";

// Lekka imitacja interfejsu Discorda do podglądu wiadomości bota.

export function DiscordWindow({
  channel = "ogólny",
  server = "Mój serwer",
  children,
  className = "",
  bodyClassName = "",
}: {
  channel?: string;
  server?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-white/[0.07] bg-[#313338] text-left ${className}`}>
      <div className="flex items-center gap-2 border-b border-black/30 bg-[#2b2d31] px-4 py-2.5 text-[13px]">
        <span className="text-lg leading-none text-white/40">#</span>
        <span className="font-semibold text-white">{channel}</span>
        <span className="ml-auto truncate text-[11px] text-white/35">{server}</span>
      </div>
      <div className={`space-y-4 px-4 py-4 ${bodyClassName}`}>{children}</div>
    </div>
  );
}

export function DiscordMessage({
  author,
  color,
  bot = false,
  time = "Dzisiaj o 18:42",
  children,
}: {
  author: string;
  color: string;
  bot?: boolean;
  time?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 animate-fade-up">
      <BotAvatar name={author} color={color} className="size-9 text-[12px]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[13px] leading-tight">
          <span className="font-medium" style={{ color: bot ? "#fff" : color }}>
            {author}
          </span>
          {bot && (
            <span className="rounded-[4px] bg-blurple px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-white">
              ✓ Bot
            </span>
          )}
          <span className="text-[10px] text-white/35">{time}</span>
        </div>
        <div className="mt-1 text-[13px] leading-relaxed text-[#dbdee1]">{children}</div>
      </div>
    </div>
  );
}

export function DiscordEmbed({
  color,
  title,
  children,
  footer,
}: {
  color: string;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mt-1.5 max-w-sm rounded-[4px] border-l-4 bg-[#2b2d31] px-3.5 py-3" style={{ borderColor: color }}>
      {title && <div className="text-[13px] font-semibold text-white">{title}</div>}
      {children && <div className="mt-1 text-[12.5px] leading-relaxed text-[#dbdee1]">{children}</div>}
      {footer && <div className="mt-2 text-[10.5px] text-white/40">{footer}</div>}
    </div>
  );
}

export function SystemJoin({ user }: { user: string }) {
  return (
    <div className="flex items-center gap-3 pl-1 text-[12.5px] text-white/50 animate-fade-up">
      <span className="text-emerald-400">→</span>
      <span>
        <span className="font-medium text-white">{user}</span> dołączył(a) na serwer.
      </span>
    </div>
  );
}
