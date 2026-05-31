// ── Image collection & resolution ───────────────────────────────────────────────

import { App, FileSystemAdapter, TFile } from "obsidian";

export function vaultBasePath(app: App): string {
  const adapter = app.vault.adapter;
  if (adapter instanceof FileSystemAdapter) return adapter.getBasePath();
  return (adapter as unknown as { basePath?: string }).basePath ?? "";
}

export function sanitizeName(name: string): string {
  return name.replace(/ /g, "_").replace(/[<>:"/\\|?*]/g, "");
}

// Matches ![[image.ext]] and ![[image.ext|300]] and ![[image.ext|300x200]]
export const IMG_WIKI_RE = /!\[\[([^\]|]+\.(png|jpe?g|gif|webp|svg|bmp))(?:\|(\d+(?:x\d+)?))?\]\]/gi;

export function imgSizeAttrs(sizeStr?: string): string {
  if (!sizeStr) return "";
  const parts = sizeStr.split("x");
  return parts[1] ? ` width="${parts[0]}" height="${parts[1]}"` : ` width="${parts[0]}"`;
}

export interface CollectedImage {
  filename: string;
  vaultFile: TFile;
}

export function collectImages(md: string, app: App): CollectedImage[] {
  const results: CollectedImage[] = [];
  const seen = new Set<string>();
  const re = new RegExp(IMG_WIKI_RE.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    const filename = m[1];
    if (seen.has(filename)) continue;
    seen.add(filename);
    const vaultFile = app.vault.getFiles().find((f) => f.name === filename);
    if (vaultFile) results.push({ filename, vaultFile });
  }
  return results;
}

export function resolveImagesForExport(md: string, app: App, imgDirName: string): string {
  return md.replace(new RegExp(IMG_WIKI_RE.source, "gi"), (_m, filename, _ext, size) => {
    const vaultFile = app.vault.getFiles().find((f) => f.name === filename);
    if (!vaultFile) return `<span class="de-img-missing" title="${filename}">⚠ не найдено: ${filename}</span>`;
    return `<img src="${imgDirName}/${sanitizeName(filename)}" alt="${filename}"${imgSizeAttrs(size)}>`;
  });
}

export function resolveObsidianImages(md: string, app: App): string {
  return md.replace(new RegExp(IMG_WIKI_RE.source, "gi"), (_m, filename, _ext, size) => {
    const file = app.vault.getFiles().find((f) => f.name === filename);
    if (!file) return `<span class="de-img-missing" title="${filename}">⚠ не найдено: ${filename}</span>`;
    return `<img src="${app.vault.getResourcePath(file)}" alt="${filename}"${imgSizeAttrs(size)}>`;
  });
}
