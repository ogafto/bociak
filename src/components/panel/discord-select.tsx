"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check, ChevronDown, Folder, Hash, Megaphone, Search, X } from "lucide-react";
import { groupChannels, type GuildSnapshot, type SnapshotChannel, type SnapshotRole } from "@/lib/guild";

// Lista wyboru kanału / kategorii / roli z prawdziwego serwera – zamiast wklejania ID.

export type SelectKind = "channel" | "category" | "role";

type Option = {
  id: string;
  label: string;
  group: string;
  icon: "text" | "announcement" | "category" | "role";
  color?: string;
  warning?: string;
};

function buildOptions(kind: SelectKind, guilds: GuildSnapshot[]): Option[] {
  const multi = guilds.length > 1;
  const out: Option[] = [];
  for (const g of guilds) {
    const prefix = multi ? `${g.name} · ` : "";
    if (kind === "role") {
      const roles = [...g.roles].filter((r) => !r.managed).sort((a, b) => b.position - a.position);
      for (const r of roles) out.push({ id: r.id, label: r.name, group: `${prefix}Role`, icon: "role", color: roleColor(r), warning: r.position >= g.botRolePosition ? "Rola jest wyżej niż rola bota – bot jej nie nada" : undefined });
      continue;
    }
    if (kind === "category") {
      const cats = g.channels.filter((c) => c.kind === "category").sort((a, b) => a.position - b.position);
      for (const c of cats) out.push({ id: c.id, label: c.name, group: `${prefix}Kategorie`, icon: "category" });
      continue;
    }
    for (const group of groupChannels(g.channels, ["text", "announcement"])) {
      for (const c of group.channels) {
        out.push({ id: c.id, label: c.name, group: `${prefix}${group.category?.name ?? "Bez kategorii"}`, icon: channelIcon(c) });
      }
    }
  }
  return out;
}

const roleColor = (r: SnapshotRole) => (r.color === "#000000" ? "#99aab5" : r.color);
const channelIcon = (c: SnapshotChannel): Option["icon"] => (c.kind === "announcement" ? "announcement" : "text");

const PLACEHOLDER: Record<SelectKind, string> = { channel: "Wybierz kanał", category: "Wybierz kategorię", role: "Wybierz rolę" };

export function DiscordSelect({
  kind,
  value,
  onChange,
  guilds,
  optional = true,
}: {
  kind: SelectKind;
  value: string;
  onChange: (id: string) => void;
  guilds: GuildSnapshot[];
  optional?: boolean;
}) {
  const options = useMemo(() => buildOptions(kind, guilds), [kind, guilds]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node) && !buttonRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const reposition = () => buttonRef.current && setRect(buttonRef.current.getBoundingClientRect());
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  // brak danych z serwera – zostawiamy ręczne wpisanie ID
  if (guilds.length === 0) {
    return (
      <div>
        <input className="input font-mono" placeholder="ID z Discorda" value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))} />
        <p className="mt-1.5 text-[12px] text-white/40">Lista pojawi się, gdy bot będzie online na serwerze. Na razie możesz wkleić ID.</p>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  const groups = [...new Set(filtered.map((o) => o.group))];

  return (
    <div>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setRect(buttonRef.current?.getBoundingClientRect() ?? null);
          setQuery("");
          setOpen((o) => !o);
        }}
        className={`input flex items-center gap-2 text-left ${open ? "!border-brand-400" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <>
            <OptionIcon option={selected} />
            <span className="flex-1 truncate">{selected.label}</span>
          </>
        ) : value ? (
          <span className="flex-1 truncate text-amber-300">Nie ma już na serwerze (ID {value})</span>
        ) : (
          <span className="flex-1 text-white/35">{PLACEHOLDER[kind]}</span>
        )}
        {optional && value && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Wyczyść"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            onKeyDown={(e) => e.key === "Enter" && onChange("")}
            className="grid size-5 place-items-center rounded text-white/40 hover:bg-white/10 hover:text-white"
          >
            <X className="size-3.5" />
          </span>
        )}
        <ChevronDown className={`size-4 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {selected?.warning && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-amber-300">
          <AlertTriangle className="size-3.5" /> {selected.warning}
        </p>
      )}

      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            className="fixed z-[70] overflow-hidden rounded-[14px] border border-white/[0.1] bg-[#18181b] shadow-[0_24px_60px_-12px_rgb(0_0_0/0.95)] animate-fade-up"
            style={{
              left: rect.left,
              width: Math.max(rect.width, 260),
              ...(window.innerHeight - rect.bottom > 320 ? { top: rect.bottom + 6 } : { bottom: window.innerHeight - rect.top + 6 }),
            }}
          >
            <div className="flex items-center gap-2 border-b border-white/[0.07] px-3 py-2.5">
              <Search className="size-4 text-white/40" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Szukaj…"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
            </div>
            <div className="max-h-72 overflow-y-auto p-1.5">
              {groups.length === 0 && <p className="px-3 py-4 text-center text-sm text-white/40">Nic nie znaleziono.</p>}
              {groups.map((g) => (
                <div key={g}>
                  <div className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wide text-white/35">{g}</div>
                  {filtered
                    .filter((o) => o.group === g)
                    .map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        role="option"
                        aria-selected={o.id === value}
                        onClick={() => {
                          onChange(o.id);
                          setOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left text-[14px] transition-colors ${
                          o.id === value ? "bg-brand-500/20 text-white" : "text-white/75 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        <OptionIcon option={o} />
                        <span className="flex-1 truncate">{o.label}</span>
                        {o.warning && <AlertTriangle className="size-3.5 text-amber-300" aria-label={o.warning} />}
                        {o.id === value && <Check className="size-4 text-brand-300" />}
                      </button>
                    ))}
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function OptionIcon({ option }: { option: Option }) {
  if (option.icon === "role") return <span className="size-3 shrink-0 rounded-full" style={{ background: option.color }} />;
  if (option.icon === "category") return <Folder className="size-4 shrink-0 text-white/45" />;
  if (option.icon === "announcement") return <Megaphone className="size-4 shrink-0 text-white/45" />;
  return <Hash className="size-4 shrink-0 text-white/45" />;
}
