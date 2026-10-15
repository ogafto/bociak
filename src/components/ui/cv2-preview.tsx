import type { ReactNode } from "react";
import { fillVars, type MessageTemplate } from "@/lib/message";
import { BRAND } from "@/lib/catalog";
import { BotAvatar } from "./bot-avatar";
import { LogoMark } from "./logo";

// Podgląd wiadomości Components V2 tak, jak wyświetli ją Discord.

const INLINE =
  /(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`|<@[^>]+>|<t:\d+:[a-zA-Z]>|\[[^\]]+\]\(https?:[^)\s]+\))/g;

function inline(text: string, keyBase: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={key} className="font-semibold text-white">{inline(part.slice(2, -2), key)}</strong>;
    if (part.startsWith("__") && part.endsWith("__")) return <u key={key}>{inline(part.slice(2, -2), key)}</u>;
    if (part.startsWith("~~") && part.endsWith("~~")) return <s key={key}>{inline(part.slice(2, -2), key)}</s>;
    if (part.length > 2 && ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))))
      return <em key={key}>{inline(part.slice(1, -1), key)}</em>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={key} className="rounded bg-black/30 px-1 py-px font-mono text-[0.85em]">{part.slice(1, -1)}</code>;
    if (part.startsWith("<@")) return <span key={key} className="rounded bg-[#5865f2]/30 px-0.5 font-medium text-[#c9cdfb]">@{part.slice(2, -1)}</span>;
    if (part.startsWith("<t:")) return <span key={key} className="rounded bg-white/10 px-1">za 2 dni</span>;
    const link = part.match(/^\[([^\]]+)\]\((https?:[^)\s]+)\)$/);
    if (link) return <span key={key} className="text-[#00a8fc] hover:underline">{link[1]}</span>;
    return part;
  });
}

/** Mini-markdown Discorda: nagłówki, podpis (-#), cytaty, listy i formatowanie w linii. */
export function DiscordMarkdown({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => {
        const key = `l${i}`;
        if (line.startsWith("### ")) return <div key={key} className="mt-1 text-[16px] font-bold text-white">{inline(line.slice(4), key)}</div>;
        if (line.startsWith("## ")) return <div key={key} className="mt-1 text-[19px] font-bold text-white">{inline(line.slice(3), key)}</div>;
        if (line.startsWith("# ")) return <div key={key} className="mt-1 text-[23px] font-bold leading-tight text-white">{inline(line.slice(2), key)}</div>;
        if (line.startsWith("-# ")) return <div key={key} className="text-[11.5px] text-white/45">{inline(line.slice(3), key)}</div>;
        if (line.startsWith("> ")) return <div key={key} className="border-l-4 border-white/20 pl-3">{inline(line.slice(2), key)}</div>;
        if (/^[-*] /.test(line)) return <div key={key} className="flex gap-2 pl-1"><span>•</span><span>{inline(line.slice(2), key)}</span></div>;
        if (!line.trim()) return <div key={key} className="h-3" />;
        return <div key={key}>{inline(line, key)}</div>;
      })}
    </>
  );
}

function Thumb({ value, vars }: { value: string; vars: Record<string, string> }) {
  if (value.includes("{avatar}")) return <BotAvatar name={vars.username || "K"} color="#eb459e" className="size-[72px] shrink-0 text-xl" />;
  if (value.includes("{server_icon}")) return <span className="grid size-[72px] shrink-0 place-items-center rounded-lg bg-[#eb459e] text-lg font-bold text-ink-950">KG</span>;
  if (/^https:\/\//.test(value))
    // eslint-disable-next-line @next/next/no-img-element -- podgląd linku wklejonego przez klienta
    return <img src={value} alt="" className="size-[72px] shrink-0 rounded-lg object-cover" />;
  return null;
}

export function CV2Preview({
  template,
  vars,
  botName,
  botColor,
  actions,
  footer,
}: {
  template: MessageTemplate;
  vars: Record<string, string>;
  botName: string;
  botColor: string;
  /** Przyciski dodawane przez moduł (np. „Otwórz ticket”). */
  actions?: string[];
  footer?: string;
}) {
  const fill = (t: string) => fillVars(t, vars);
  return (
    <div className="flex gap-3">
      {/* wspólny bot ma prawdziwe logo Bociaka zamiast literki */}
      {botName === BRAND.name ? <LogoMark round className="size-10" /> : <BotAvatar name={botName} color={botColor} className="size-10 text-xs" />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[14px] leading-tight">
          <span className="font-medium text-white">{botName}</span>
          <span className="rounded-[4px] bg-[#5865f2] px-1 py-px text-[9px] font-semibold uppercase text-white">✓ Bot</span>
          <span className="text-[11px] text-white/35">Dzisiaj o 18:42</span>
        </div>
        <div
          className="mt-1.5 max-w-[440px] overflow-hidden rounded-lg border border-white/[0.06] bg-[#393a41]/60 text-[14px] leading-[1.4] text-[#dbdee1]"
          style={template.accent ? { borderLeft: `4px solid ${template.accent}` } : undefined}
        >
          <div className="space-y-2 p-3.5">
            {template.blocks.map((b) => {
              if (b.type === "text") return b.content.trim() ? <div key={b.id}><DiscordMarkdown text={fill(b.content)} /></div> : null;
              if (b.type === "section")
                return (
                  <div key={b.id} className="flex gap-3">
                    <div className="min-w-0 flex-1">
                      <DiscordMarkdown text={fill(b.content)} />
                    </div>
                    <Thumb value={b.thumbnail} vars={vars} />
                  </div>
                );
              if (b.type === "image")
                return /^https:\/\//.test(b.url) ? (
                  // eslint-disable-next-line @next/next/no-img-element -- podgląd linku wklejonego przez klienta
                  <img key={b.id} src={b.url} alt="" className="max-h-56 w-full rounded-md object-cover" />
                ) : (
                  <div key={b.id} className="grid h-28 place-items-center rounded-md border border-dashed border-white/15 text-[12px] text-white/35">
                    Wklej link do obrazka lub GIF-a
                  </div>
                );
              if (b.type === "separator")
                return <div key={b.id} className={b.spacing === "large" ? "py-3" : "py-1"}>{b.divider && <div className="h-px bg-white/10" />}</div>;
              if (b.type === "buttons")
                return (
                  <div key={b.id} className="flex flex-wrap gap-2">
                    {b.buttons.filter((x) => x.label.trim()).map((x, i) =>
                      /^https:\/\/\S+$/.test(x.url.trim()) ? (
                        <span key={i} className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#4e5058] px-3.5 py-1.5 text-[13px] font-medium text-white">
                          {fill(x.label)} <span className="text-[10px] opacity-70">↗</span>
                        </span>
                      ) : (
                        // tak jak runner: przycisk bez poprawnego linku nie zostanie wysłany
                        <span key={i} title="Uzupełnij link (https://…) – bez niego przycisk się nie pokaże" className="inline-flex items-center gap-1.5 rounded-[4px] border border-dashed border-amber-400/60 px-3.5 py-1.5 text-[13px] font-medium text-amber-200/80">
                          {fill(x.label)} · brak linku
                        </span>
                      ),
                    )}
                  </div>
                );
              return null;
            })}
            {actions && actions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {actions.map((a) => (
                  <span key={a} className="inline-flex rounded-[4px] bg-[#5865f2] px-3.5 py-1.5 text-[13px] font-medium text-white">
                    {a}
                  </span>
                ))}
              </div>
            )}
            {footer && <div className="text-[11.5px] text-white/45">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
