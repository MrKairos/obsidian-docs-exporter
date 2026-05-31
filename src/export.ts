// ── Export HTML builder & file writer ───────────────────────────────────────────

import { App, TFile } from "obsidian";
import * as fs from "fs";
import * as path from "path";
import { ParseFn } from "./types";
import { collectImages, resolveImagesForExport, vaultBasePath, sanitizeName } from "./images";
import { LIGHTBOX_CSS, LIGHTBOX_HTML, LIGHTBOX_JS } from "./lightbox";

export function buildExportHTML(bodyHTML: string, css: string, noindex: boolean, title = "Document"): string {
  const noindexTag = noindex ? '\n<meta name="robots" content="noindex,nofollow">' : "";
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>${noindexTag}
<style>
${css}
${LIGHTBOX_CSS}
</style>
</head>
<body>
<div class="doc">
${bodyHTML}
</div>
${LIGHTBOX_HTML}
${LIGHTBOX_JS}
</body>
</html>`;
}

export interface ExportResult {
  htmlPath: string;
  copiedCount: number;
  imgDirName: string;
}

export async function exportNote(
  app: App,
  mdFile: TFile,
  outputDir: string,
  css: string,
  noindex: boolean,
  parse: ParseFn
): Promise<ExportResult> {
  const content = await app.vault.read(mdFile);
  const basename = sanitizeName(mdFile.basename);
  const imgDirName = `${basename}_images`;
  const imgDirAbs = path.join(outputDir, imgDirName);

  const images = collectImages(content, app);
  const resolved = resolveImagesForExport(content, app, imgDirName);
  const bodyHTML = parse(resolved);
  const html = buildExportHTML(bodyHTML, css, noindex, mdFile.basename);

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const htmlPath = path.join(outputDir, `${basename}.html`);
  fs.writeFileSync(htmlPath, html, "utf8");

  let copiedCount = 0;
  if (images.length > 0) {
    if (!fs.existsSync(imgDirAbs)) fs.mkdirSync(imgDirAbs, { recursive: true });
    for (const { filename, vaultFile } of images) {
      const srcAbs = path.join(vaultBasePath(app), vaultFile.path);
      const destAbs = path.join(imgDirAbs, sanitizeName(filename));
      try {
        fs.copyFileSync(srcAbs, destAbs);
        copiedCount++;
      } catch (e) {
        console.warn(`[DocsExporter] Could not copy image ${filename}:`, e);
      }
    }
  }

  return { htmlPath, copiedCount, imgDirName };
}
