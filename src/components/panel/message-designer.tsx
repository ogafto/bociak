"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  Crown,
  ArrowUp,
  Image as ImageIcon,
  LayoutPanelLeft,
  Link2,
  Minus,
  Paintbrush,
  Plus,
  Trash2,
  Type,
  X,
} from "lucide-react";
import Link from "next/link";
import { MAX_BLOCKS, MESSAGE_KINDS, parseTemplate, toFreeTemplate, type MessageBlock, type MessageKind, type MessageTemplate } from "@/lib/message";
import { CV2Preview } from "@/components/ui/cv2-preview";
import { btn } from "@/components/ui/button";
import { Curtain } from "@/components/landing/curtain";

// Kreator wyglądu wiadomości bota (Components V2) z podglądem na żywo.

const ACCENTS = ["#5865f2", "#eb459e", "#57f287", "#fee75c", "#ed4245", "#22d3ee", "#fb923c", "#ffffff"];

const BLOCK_TYPES: { type: MessageBlock["type"]; label: string; icon: typeof Type }[] = [
  { type: "text", label: "Tekst", icon: Type },
  { type: "section", label: "Tekst z miniaturką", icon: LayoutPanelLeft },
  { type: "image", label: "Obrazek / GIF", icon: ImageIcon },
  { type: "separator", label: "Separator", icon: Minus },
  { type: "buttons", label: "Przyciski-linki", icon: Link2 },
];

const ACTIONS: Partial<Record<MessageKind, string[]>> = {
  ticketPanel: ["📩 Otwórz ticket"],
  ticketOpened: ["🔒 Zamknij ticket"],
  giveaway: ["🎉 Biorę udział · 128"],
};

const newId = () => `b${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

function newBlock(type: MessageBlock["type"]): MessageBlock {
  const id = newId();
  if (type === "text") return { id, type, content: "" };
  if (type === "section") return { id, type, content: "", thumbnail: "{avatar}" };
  if (type === "image") return { id, type, url: "" };
  if (type === "separator") return { id, type, divider: true, spacing: "small" };
  return { id, type, buttons: [{ label: "Regulamin", url: "https://" }] };
}

function exampleVars(kind: MessageKind) {
  return Object.fromEntries(MESSAGE_KINDS[kind].vars.map((v) => [v.key, v.example]));
}

/** Pole w siatce modułów: miniatura podglądu + przycisk otwierający kreator. */
export function MessageField({
  kind,
  value,
  onChange,
  botName,
  botColor,
  fullEditor,
}: {
  kind: MessageKind;
  value: string;
  onChange: (v: string) => void;
  botName: string;
  botColor: string;
  /** Pro: pełny kreator bloków. Darmowy: tylko gotowe style i kolor. */
  fullEditor: boolean;
}) {
  const [open, setOpen] = useState(false);
  const template = fullEditor ? parseTemplate(value || undefined, kind) : toFreeTemplate(value || undefined, kind);
  return (
    <div className="group/msg overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#313338] p-3 transition-colors hover:border-brand-400/30">
      <div className="pointer-events-none relative max-h-44 overflow-hidden transition-transform duration-500 [mask-image:linear-gradient(#000_70%,transparent)] group-hover/msg:scale-[1.02]">
        <CV2Preview template={template} vars={exampleVars(kind)} botName={botName} botColor={botColor} actions={ACTIONS[kind]} />
      </div>
      <button type="button" onClick={() => setOpen(true)} className={btn("secondary", "sm", "mt-2 w-full")}>
        <Paintbrush className="size-3.5" /> {fullEditor ? "Dostosuj wygląd" : "Wybierz styl i kolor"}
      </button>
      {open && (
        <MessageDesigner
          kind={kind}
          initial={template}
          botName={botName}
          botColor={botColor}
          fullEditor={fullEditor}
          onClose={() => setOpen(false)}
          onSave={(t) => {
            onChange(JSON.stringify(t));
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function MessageDesigner({
  kind,
  initial,
  botName,
  botColor,
  fullEditor,
  onClose,
  onSave,
}: {
  kind: MessageKind;
  initial: MessageTemplate;
  botName: string;
  botColor: string;
  fullEditor: boolean;
  onClose: () => void;
  onSave: (t: MessageTemplate) => void;
}) {
  const def = MESSAGE_KINDS[kind];
  const [t, setT] = useState<MessageTemplate>(initial);
  const focused = useRef<{ blockId: string; el: HTMLTextAreaElement } | null>(null);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const update = (id: string, patch: Partial<MessageBlock>) =>
    setT((s) => ({ ...s, blocks: s.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as MessageBlock) : b)) }));
  const move = (i: number, dir: -1 | 1) =>
    setT((s) => {
      const blocks = [...s.blocks];
      const j = i + dir;
      if (j < 0 || j >= blocks.length) return s;
      [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
      return { ...s, blocks };
    });
  const remove = (id: string) => setT((s) => ({ ...s, blocks: s.blocks.filter((b) => b.id !== id) }));

  function insertVar(key: string) {
    const f = focused.current;
    const token = `{${key}}`;
    if (!f) {
      // brak aktywnego pola – dopisujemy do ostatniego bloku tekstowego
      const last = [...t.blocks].reverse().find((b) => b.type === "text" || b.type === "section");
      if (last && "content" in last) update(last.id, { content: `${last.content}${token}` });
      return;
    }
    const { el, blockId } = f;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const next = el.value.slice(0, start) + token + el.value.slice(end);
    update(blockId, { content: next });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  const textarea = (b: Extract<MessageBlock, { content: string }>) => (
    <textarea
      rows={3}
      className="input resize-y font-mono text-[13px]"
      placeholder="Tekst z formatowaniem Discorda: **pogrubienie**, # Nagłówek, -# mały podpis, > cytat"
      value={b.content}
      onFocus={(e) => (focused.current = { blockId: b.id, el: e.currentTarget })}
      onChange={(e) => update(b.id, { content: e.target.value })}
    />
  );

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-6" role="dialog" aria-modal="true" aria-label={`Wygląd: ${def.label}`}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-[fade-up_0.3s_both]" onClick={onClose} />
      <div className="relative flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#111113] shadow-[0_40px_100px_-20px_rgb(0_0_0/1)] animate-fade-up">
        {/* nagłówek */}
        <div className="relative flex flex-wrap items-center gap-3 overflow-hidden border-b border-white/[0.07] px-5 py-4">
          <Curtain base="17 17 19" className="inset-0 opacity-40" />
          <span className="relative grid size-9 place-items-center rounded-[10px] bg-brand-500 text-white shadow-[0_0_20px_-4px_rgb(88_101_242/0.9)]">
            <Paintbrush className="size-4" />
          </span>
          <h2 className="relative text-[1.2rem] font-medium tracking-[-0.02em] text-white">Wygląd: {def.label}</h2>
          <div className="relative ml-auto flex gap-2">
            <button type="button" onClick={onClose} className={btn("ghost", "sm")}>
              Anuluj
            </button>
            <button type="button" onClick={() => onSave(t)} className={btn("primary", "sm")}>
              Zapisz wygląd
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_460px]">
          {/* edytor */}
          <div className="min-h-0 space-y-6 overflow-y-auto p-5">
            <div>
              <div className="label">Gotowe style</div>
              <div className="flex flex-wrap gap-2">
                {def.presets
                  // w Darmowym pomijamy style, które wymagają wklejenia własnego obrazka
                  .filter((p) => fullEditor || !p.template.blocks.some((b) => b.type === "image" && !b.url))
                  .map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setT(structuredClone(p.template))}
                    className={btn(JSON.stringify(p.template.blocks) === JSON.stringify(t.blocks) ? "primary" : "secondary", "sm")}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="label">Kolor paska</div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setT((s) => ({ ...s, accent: null }))}
                  className={`grid size-8 place-items-center rounded-full border border-white/20 text-white/50 ${t.accent === null ? "ring-2 ring-white ring-offset-2 ring-offset-[#111113]" : ""}`}
                  aria-label="Bez paska"
                >
                  <X className="size-3.5" />
                </button>
                {ACCENTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setT((s) => ({ ...s, accent: c }))}
                    aria-label={`Kolor ${c}`}
                    className={`size-8 rounded-full ${t.accent === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#111113]" : ""}`}
                    style={{ background: c }}
                  />
                ))}
                <input
                  type="color"
                  value={t.accent ?? "#5865f2"}
                  onChange={(e) => setT((s) => ({ ...s, accent: e.target.value }))}
                  className="size-8 cursor-pointer rounded-full border-0 bg-transparent"
                  aria-label="Własny kolor"
                />
              </div>
            </div>

            {fullEditor ? (
              <>
            <div>
              <div className="label">Zmienne – kliknij, aby wstawić w miejscu kursora</div>
              <div className="flex flex-wrap gap-1.5">
                {def.vars.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()} // nie zabieraj fokusu z pola tekstowego
                    onClick={() => insertVar(v.key)}
                    className="rounded-[8px] border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 font-mono text-[12px] text-brand-300 transition-colors hover:bg-brand-500/20"
                    title={v.label}
                  >
                    {`{${v.key}}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="label">Bloki ({t.blocks.length}/{MAX_BLOCKS})</div>
              {t.blocks.map((b, i) => {
                const meta = BLOCK_TYPES.find((x) => x.type === b.type)!;
                return (
                  <div key={b.id} className="rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-4 animate-fade-up">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                      <meta.icon className="size-4 text-brand-300" />
                      {meta.label}
                      <span className="ml-auto flex gap-1">
                        <IconBtn label="W górę" onClick={() => move(i, -1)} disabled={i === 0}>
                          <ArrowUp className="size-3.5" />
                        </IconBtn>
                        <IconBtn label="W dół" onClick={() => move(i, 1)} disabled={i === t.blocks.length - 1}>
                          <ArrowDown className="size-3.5" />
                        </IconBtn>
                        <IconBtn label="Usuń" onClick={() => remove(b.id)}>
                          <Trash2 className="size-3.5" />
                        </IconBtn>
                      </span>
                    </div>

                    {b.type === "text" && textarea(b)}
                    {b.type === "section" && (
                      <div className="space-y-3">
                        {textarea(b)}
                        <div className="flex flex-wrap gap-2">
                          {[
                            ["{avatar}", "Avatar osoby"],
                            ["{server_icon}", "Ikona serwera"],
                          ].map(([val, label]) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => update(b.id, { thumbnail: val })}
                              className={btn(b.thumbnail === val ? "primary" : "secondary", "sm")}
                            >
                              {label}
                            </button>
                          ))}
                          <input
                            className="input h-9 min-w-48 flex-1 py-1 text-[13px]"
                            placeholder="…albo link do obrazka (https://)"
                            value={b.thumbnail.startsWith("{") ? "" : b.thumbnail}
                            onChange={(e) => update(b.id, { thumbnail: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                    {b.type === "image" && (
                      <input className="input" placeholder="https://… (PNG, JPG, GIF)" value={b.url} onChange={(e) => update(b.id, { url: e.target.value })} />
                    )}
                    {b.type === "separator" && (
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => update(b.id, { divider: !b.divider })} className={btn(b.divider ? "primary" : "secondary", "sm")}>
                          {b.divider ? "Z linią" : "Bez linii"}
                        </button>
                        <button type="button" onClick={() => update(b.id, { spacing: b.spacing === "small" ? "large" : "small" })} className={btn("secondary", "sm")}>
                          Odstęp: {b.spacing === "small" ? "mały" : "duży"}
                        </button>
                      </div>
                    )}
                    {b.type === "buttons" && (
                      <div className="space-y-2">
                        {b.buttons.map((x, n) => (
                          <div key={n} className="flex gap-2">
                            <input
                              className="input w-40"
                              placeholder="Napis"
                              maxLength={80}
                              value={x.label}
                              onChange={(e) => update(b.id, { buttons: b.buttons.map((y, k) => (k === n ? { ...y, label: e.target.value } : y)) })}
                            />
                            <input
                              className="input flex-1"
                              placeholder="https://"
                              value={x.url}
                              onChange={(e) => update(b.id, { buttons: b.buttons.map((y, k) => (k === n ? { ...y, url: e.target.value } : y)) })}
                            />
                            <IconBtn label="Usuń przycisk" onClick={() => update(b.id, { buttons: b.buttons.filter((_, k) => k !== n) })}>
                              <X className="size-3.5" />
                            </IconBtn>
                          </div>
                        ))}
                        {b.buttons.length < 5 && (
                          <button type="button" onClick={() => update(b.id, { buttons: [...b.buttons, { label: "", url: "https://" }] })} className={btn("ghost", "sm")}>
                            <Plus className="size-3.5" /> Dodaj przycisk
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {t.blocks.length < MAX_BLOCKS && (
                <div className="flex flex-wrap gap-2 rounded-[14px] border border-dashed border-white/15 p-3">
                  {BLOCK_TYPES.map((x) => (
                    <button key={x.type} type="button" onClick={() => setT((s) => ({ ...s, blocks: [...s.blocks, newBlock(x.type)] }))} className={btn("ghost", "sm")}>
                      <Plus className="size-3.5" /> {x.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

              </>
            ) : (
              <div className="relative overflow-hidden rounded-[16px] border border-white/[0.07] bg-[#0d0d0f] p-6">
                <Curtain base="13 13 15" className="inset-0 opacity-70" />
                <span className="relative inline-flex items-center gap-1.5 rounded-[6px] border border-dc-yellow/30 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-dc-yellow">
                  <Crown className="size-3.5" /> PRO
                </span>
                <h3 className="relative mt-3 text-[1.3rem] font-medium tracking-[-0.02em] text-white">Własny wygląd od zera</h3>
                <p className="relative mt-1.5 max-w-md text-[14px] leading-relaxed text-white/65">
                  W Pro układasz wiadomość z bloków: własne teksty ze zmiennymi, obrazki i GIF-y, miniatury, separatory i przyciski z linkami. W
                  pakiecie Darmowym wybierasz gotowy styl i kolor paska.
                </p>
                <Link href="/panel/pakiety" className={btn("primary", "sm", "relative mt-5")}>
                  <Crown className="size-3.5" /> Odblokuj w Pro
                </Link>
              </div>
            )}
          </div>

          {/* podgląd */}
          <div className="min-h-0 overflow-y-auto border-t border-white/[0.07] bg-[#313338] p-5 lg:border-l lg:border-t-0">
            <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
              <span className="size-1.5 rounded-full bg-dc-green" /> Podgląd na żywo
            </div>
            <CV2Preview template={t} vars={exampleVars(kind)} botName={botName} botColor={botColor} actions={ACTIONS[kind]} />
            {def.note && <p className="mt-5 text-[12.5px] text-white/45">ℹ️ {def.note}</p>}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function IconBtn({ children, label, onClick, disabled }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-7 place-items-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30"
    >
      {children}
    </button>
  );
}
