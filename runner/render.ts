import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from "discord.js";
import { fillVars, parseTemplate, type MessageKind } from "../src/lib/message.ts";
import { BRAND } from "../src/lib/catalog.ts";
import type { BotRuntime } from "./bot.ts";

// Szablon z panelu → wiadomość Components V2 (kontener z blokami).

const isUrl = (s: string) => /^https:\/\/\S+$/i.test(s.trim());

export type RenderOptions = {
  /** Przyciski modułu (np. „Otwórz ticket”) – doklejane na dole kontenera. */
  actions?: ActionRowBuilder<ButtonBuilder>;
  /** Kto może zostać oznaczony – domyślnie nikt poza osobami z {user}. */
  mentionUsers?: string[];
  /** Dodatkowy tekst modułu na dole (np. lista zwycięzców). */
  extraText?: string;
};

export function renderMessage(rt: BotRuntime, raw: string | undefined, kind: MessageKind, vars: Record<string, string>, opts: RenderOptions = {}) {
  const template = parseTemplate(raw, kind);
  const container = new ContainerBuilder();
  const accent = template.accent ? parseInt(template.accent.replace("#", ""), 16) : NaN;
  if (Number.isFinite(accent)) container.setAccentColor(accent);

  let blocks = 0;
  for (const block of template.blocks.slice(0, 10)) {
    if (block.type === "text") {
      const content = fillVars(block.content, vars).trim().slice(0, 4000);
      if (!content) continue;
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
    } else if (block.type === "section") {
      const content = fillVars(block.content, vars).trim().slice(0, 4000);
      if (!content) continue;
      const thumb = fillVars(block.thumbnail, vars).trim();
      if (isUrl(thumb)) {
        container.addSectionComponents(
          new SectionBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(content)).setThumbnailAccessory(new ThumbnailBuilder().setURL(thumb)),
        );
      } else {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
      }
    } else if (block.type === "image") {
      const url = fillVars(block.url, vars).trim();
      if (!isUrl(url)) continue;
      container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url)));
    } else if (block.type === "separator") {
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(block.divider).setSpacing(block.spacing === "large" ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small),
      );
    } else if (block.type === "buttons") {
      const buttons = block.buttons
        .filter((b) => b.label.trim() && isUrl(b.url))
        .slice(0, 5)
        .map((b) => new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(fillVars(b.label, vars).slice(0, 80)).setURL(b.url.trim()));
      if (!buttons.length) continue;
      container.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons));
    }
    blocks++;
  }

  if (blocks === 0) container.addTextDisplayComponents(new TextDisplayBuilder().setContent(fillVars("{server}", vars) || "—"));
  if (opts.extraText) container.addTextDisplayComponents(new TextDisplayBuilder().setContent(opts.extraText.slice(0, 2000)));
  if (opts.actions) container.addActionRowComponents(opts.actions);
  // darmowy pakiet: dyskretny podpis wspólnego bota
  if (rt.shared) container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${BRAND.name} · ${BRAND.domain}`));

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2 as const,
    allowedMentions: { users: opts.mentionUsers ?? [], roles: [] },
  };
}

/** Zmienne wspólne dla wiadomości o osobie na serwerze. */
export function memberVars(user: { id: string; username: string; displayAvatarURL: (o?: { size?: number }) => string }, guild: { name: string; memberCount: number; iconURL: (o?: { size?: number }) => string | null }) {
  return {
    user: `<@${user.id}>`,
    username: user.username,
    avatar: user.displayAvatarURL({ size: 256 }),
    server: guild.name,
    server_icon: guild.iconURL({ size: 256 }) ?? "",
    count: guild.memberCount.toLocaleString("pl-PL"),
  };
}

/** Stare ustawienie „Treść powitania” (zwykły tekst) jako szablon – żeby zapisane konfiguracje działały dalej. */
export function legacyText(text: string | undefined) {
  if (!text?.trim()) return undefined;
  return JSON.stringify({ v: 2, accent: null, blocks: [{ id: "b1", type: "text", content: text }] });
}
