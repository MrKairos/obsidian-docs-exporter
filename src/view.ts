// ── Live-preview view ───────────────────────────────────────────────────────────

import { App, ItemView, Modal, Notice, TFile, WorkspaceLeaf } from "obsidian";
import type DocsExporterPlugin from "./main";
import { ParseFn } from "./types";
import { BASE_DARK_VARS, getStyleById, getAllStyles } from "./styles";
import { HIGHLIGHT_CSS } from "./highlight";
import { buildParser } from "./parser";
import { resolveObsidianImages } from "./images";
import { buildExportHTML, exportNote } from "./export";

export const VIEW_TYPE = "docs-exporter-view";

export function getOpenView(app: App): DocsExporterView | null {
  const leaves = app.workspace.getLeavesOfType(VIEW_TYPE);
  return leaves.length ? (leaves[0].view as DocsExporterView) : null;
}

const PREVIEW_CSS = `
.de-preview { padding: 24px 28px; font-size: 14px; line-height: 1.7; }
.de-preview h1, .de-preview h2, .de-preview h3,
.de-preview h4, .de-preview h5, .de-preview h6 { padding-left: 0 !important; margin-left: 0 !important; text-indent: 0 !important; }
.de-preview h1::before, .de-preview h2::before, .de-preview h3::before,
.de-preview h4::before, .de-preview h5::before, .de-preview h6::before { content: none !important; display: none !important; }
.de-preview h1 { font-size: 1.75em; font-weight: 700; margin: 0 0 16px; padding-bottom: 10px; border-bottom: 1px solid var(--background-modifier-border); }
.de-preview h2 { font-size: 1.25em; font-weight: 600; margin: 28px 0 8px; }
.de-preview h3 { font-size: 0.8em; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin: 20px 0 6px; color: var(--text-muted); }
.de-preview p  { margin: 0 0 10px; }
.de-preview strong { font-weight: 600; }
.de-preview hr { border: none; border-top: 1px solid var(--background-modifier-border); margin: 20px 0; }
.de-preview a  { color: var(--link-color); text-decoration: none; }
.de-preview .de-wikilink { color: var(--link-color); text-decoration: none; border-bottom: 1px dashed currentColor; opacity: 0.85; }
.de-preview table { width: 100%; border-collapse: collapse; font-size: 0.875em; margin: 8px 0 14px; }
.de-preview th { font-weight: 600; text-align: left; padding: 7px 10px; border-bottom: 1px solid var(--background-modifier-border); }
.de-preview td { padding: 6px 10px; border-bottom: 1px solid var(--background-modifier-border-focus); }
.de-preview tr:last-child td { border-bottom: none; }
.de-preview ul, .de-preview ol { margin: 0 0 10px 20px; }
.de-preview li { margin-bottom: 3px; }
.de-preview blockquote { border-left: 3px solid var(--background-modifier-border); padding: 4px 14px; margin: 8px 0; opacity: 0.8; }
.de-preview pre { background: var(--background-secondary); border-radius: 5px; padding: 12px 16px; overflow-x: auto; margin: 8px 0 14px; }
.de-preview code { background: var(--background-secondary); padding: 1px 5px; border-radius: 3px; font-size: 85%; font-family: var(--font-monospace); }
.de-preview pre code { background: none; padding: 0; font-size: 12px; line-height: 1.5; }
.de-preview img { max-width: 100%; border-radius: 4px; display: block; margin: 8px 0; }
.de-preview .toc { background: var(--background-secondary); border-radius: 6px; padding: 14px 18px; margin-bottom: 20px; }
.de-preview .toc ul { list-style: none; margin: 0; padding: 0; }
.de-preview .toc-item { margin: 3px 0; }
.de-preview .toc-item a { font-size: 12px; color: var(--text-muted); text-decoration: none; }
.de-preview .toc-item a:hover { color: var(--text-normal); }
.de-preview .de-img-missing { color: var(--text-error); font-size: 12px; }
.de-preview s { opacity: 0.5; }
.de-preview li.task-unchecked, .de-preview li.task-done { list-style: none; }
.de-preview li.task-unchecked::before { content: '☐'; margin-right: 6px; margin-left: -18px; opacity: 0.5; }
.de-preview li.task-done { opacity: 0.55; text-decoration: line-through; }
.de-preview li.task-done::before { content: '☑'; margin-right: 6px; margin-left: -18px; color: var(--text-accent); }
.de-preview .callout { border-radius: 6px; padding: 12px 16px; margin: 12px 0; border-left: 4px solid var(--background-modifier-border); background: var(--background-secondary); }
.de-preview .callout-title { font-weight: 600; font-size: 0.75em; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 0 0 5px; padding: 0; }
.de-preview .callout-body { font-size: 0.9375em; }
`;

export class DocsExporterView extends ItemView {
  private plugin: DocsExporterPlugin;
  currentStyleId: string;
  private noindex: boolean;
  private _parse: ParseFn;
  private _currentFile: TFile | null = null;
  private _currentContent = "";
  private _dotEls: Map<string, HTMLElement> = new Map();
  private _pickerEl: HTMLElement | null = null;

  private _fileLabel!: HTMLElement;
  private _preview!: HTMLElement;
  private _dynamicStyleEl!: HTMLElement;
  private _statChars!: HTMLElement;
  private _statWords!: HTMLElement;
  private _statLines!: HTMLElement;

  constructor(leaf: WorkspaceLeaf, plugin: DocsExporterPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.currentStyleId = plugin.settings.styleId || "slate";
    this.noindex = plugin.settings.noindex || false;
    this._parse = buildParser();
  }

  getViewType(): string {
    return VIEW_TYPE;
  }
  getDisplayText(): string {
    return "Docs Exporter";
  }
  getIcon(): string {
    return "file-output";
  }

  async onOpen(): Promise<void> {
    this._buildUI();
    this._registerWatchers();
    await this._loadFile(this.app.workspace.getActiveFile());
  }

  async onClose(): Promise<void> {}

  // ── UI ─────────────────────────────────────────────────────────────────────

  private _buildUI(): void {
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass("docs-exporter-view");

    const toolbar = root.createEl("div", { cls: "de-toolbar" });
    this._fileLabel = toolbar.createEl("span", { cls: "de-file-label", text: "—" });
    toolbar.createEl("div", { cls: "de-spacer" });

    this._pickerEl = toolbar.createEl("div", { cls: "de-theme-picker" });
    this._rebuildStylePicker();

    // noindex toggle
    const toggleLabel = toolbar.createEl("label", { cls: "de-toggle" });
    if (this.noindex) toggleLabel.addClass("active");
    const toggleInput = toggleLabel.createEl("input", { type: "checkbox" });
    toggleInput.checked = this.noindex;
    toggleLabel.createEl("span", { cls: "de-toggle-track" });
    toggleLabel.appendText("noindex");
    toggleInput.addEventListener("change", () => {
      this.noindex = toggleInput.checked;
      toggleLabel.classList.toggle("active", this.noindex);
      this.plugin.settings.noindex = this.noindex;
      this.plugin.saveSettings();
    });

    toolbar
      .createEl("button", { cls: "de-btn", text: "HTML-код" })
      .addEventListener("click", () => this._showHTMLModal());
    toolbar
      .createEl("button", { cls: "de-btn primary", text: "↓ .html" })
      .addEventListener("click", () => this._doExport());

    const scroll = root.createEl("div", { cls: "de-preview-scroll" });
    this._preview = scroll.createEl("div", { cls: "de-preview" });

    const styleEl = root.createEl("style");
    styleEl.textContent = PREVIEW_CSS + HIGHLIGHT_CSS;
    this._dynamicStyleEl = root.createEl("style");
    this._applyPreviewStyle();

    const sb = root.createEl("div", { cls: "de-statusbar" });
    sb.createEl("span").innerHTML = '<span class="de-live-dot"></span>live';
    this._statChars = sb.createEl("span", { text: "0 символов" });
    this._statWords = sb.createEl("span", { text: "0 слов" });
    this._statLines = sb.createEl("span", { text: "0 строк" });
  }

  _rebuildStylePicker(): void {
    if (!this._pickerEl) return;
    this._pickerEl.empty();
    this._dotEls.clear();
    const allStyles = getAllStyles(this.plugin.settings.customStyles);
    allStyles.forEach((style) => {
      const dot = this._pickerEl!.createEl("span", { cls: "de-dot", attr: { title: style.name } });
      dot.style.background = style.dotColor;
      if (style.id === "notion-light") dot.style.outline = "1px solid #ccc";
      if (style.id === this.currentStyleId) dot.addClass("active");
      dot.addEventListener("click", () => this._setStyle(style.id));
      this._dotEls.set(style.id, dot);
    });
  }

  _applyPreviewStyle(): void {
    if (this._dynamicStyleEl) {
      this._dynamicStyleEl.textContent = this._getPreviewStyleCSS();
    }
  }

  private _getPreviewStyleCSS(): string {
    const id = this.currentStyleId;
    const v = BASE_DARK_VARS[id];
    if (v) {
      return `.de-preview { background:${v["--de-bg"]}; color:${v["--de-text"]}; }
.de-preview h1 { color:${v["--de-accent"]}; border-bottom-color:${v["--de-border"]}; }
.de-preview h2 { color:${v["--de-text"]}; }
.de-preview h3 { color:${v["--de-accent2"]}; }
.de-preview a  { color:${v["--de-accent2"]}; }
.de-preview .de-wikilink { color:${v["--de-accent2"]}; border-bottom-color:${v["--de-accent2"]}; }
.de-preview strong { color:${v["--de-text"]}; }
.de-preview hr { border-top-color:${v["--de-border"]}; }
.de-preview th { border-bottom-color:${v["--de-border"]}; color:${v["--de-accent2"]}; }
.de-preview td { border-bottom-color:${v["--de-border"]}; }
.de-preview code { background:${v["--de-code-bg"]}; color:${v["--de-accent"]}; border-color:${v["--de-border"]}; }
.de-preview pre { background:${v["--de-code-bg"]}; border-color:${v["--de-border"]}; }
.de-preview blockquote { border-left-color:${v["--de-accent"]}; }
.de-preview .toc { background:${v["--de-code-bg"]}; border-color:${v["--de-border"]}; }
.de-preview .toc-item a { color:${v["--de-text"]}; }
.de-preview .callout { background:${v["--de-surface"]}; border-left-color:${v["--de-border"]}; }
.de-preview .callout-title { color:${v["--de-accent2"]}; }`;
    }
    const n =
      id === "notion-dark"
        ? { bg: "#191919", surface: "#252525", border: "#333333", text: "#f0efea", textSec: "#9b9a97", link: "#5b9bd5", accent: "#f0efea", codeBg: "#2d2d2d" }
        : { bg: "#ffffff", surface: "#f7f6f3", border: "#e9e9e7", text: "#37352f", textSec: "#9b9a97", link: "#2383e2", accent: "#37352f", codeBg: "#f0f0ef" };
    if (id === "notion-light" || id === "notion-dark") {
      return `.de-preview { background:${n.bg}; color:${n.text}; }
.de-preview h1 { color:${n.text}; border-bottom-color:${n.border}; }
.de-preview h2 { color:${n.text}; }
.de-preview h3 { color:${n.textSec}; }
.de-preview a  { color:${n.link}; }
.de-preview .de-wikilink { color:${n.link}; border-bottom-color:${n.link}; }
.de-preview strong { color:${n.text}; }
.de-preview hr { border-top-color:${n.border}; }
.de-preview th { background:${n.surface}; border-bottom-color:${n.border}; color:${n.text}; }
.de-preview td { border-bottom-color:${n.border}; color:${n.text}; }
.de-preview code { background:${n.codeBg}; color:${n.text}; border-color:${n.border}; }
.de-preview pre { background:${n.surface}; border-color:${n.border}; }
.de-preview blockquote { border-left-color:${n.textSec}; background:${n.surface}; }
.de-preview .toc { background:${n.surface}; border-color:${n.border}; }
.de-preview .toc-item a { color:${n.text}; }
.de-preview .callout { background:${n.surface}; border-left-color:${n.border}; }
.de-preview .callout-title { color:${n.textSec}; }`;
    }
    // Custom style fallback
    const style = getStyleById(id, this.plugin.settings.customStyles);
    return `.de-preview { background:${style.previewBg || "#0d1117"}; color:${style.previewText || "#cdd9e5"}; }`;
  }

  // ── Watchers ──────────────────────────────────────────────────────────────

  private _registerWatchers(): void {
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        const file = this.app.workspace.getActiveFile();
        if (file && file !== this._currentFile) this._loadFile(file);
      })
    );
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file === this._currentFile) {
          this.app.vault.read(file as TFile).then((content) => {
            this._currentContent = content;
            this._render();
          });
        }
      })
    );
  }

  private async _loadFile(file: TFile | null): Promise<void> {
    if (!file || file.extension !== "md") {
      this._currentFile = null;
      this._currentContent = "";
      this._fileLabel.textContent = "—";
      this._preview.innerHTML =
        '<p style="opacity:0.35;font-size:12px;font-family:monospace">Откройте .md заметку</p>';
      this._resetStats();
      return;
    }
    this._currentFile = file;
    this._fileLabel.textContent = file.basename + ".md";
    this._currentContent = await this.app.vault.read(file);
    this._render();
  }

  private _render(): void {
    const raw = this._currentContent;
    const resolved = resolveObsidianImages(raw, this.app);
    this._preview.innerHTML = this._parse(resolved);
    const words = raw.trim() ? raw.trim().split(/\s+/).length : 0;
    this._statChars.textContent = raw.length + " символов";
    this._statWords.textContent = words + " слов";
    this._statLines.textContent = raw.split("\n").length + " строк";
  }

  private _resetStats(): void {
    this._statChars.textContent = "0 символов";
    this._statWords.textContent = "0 слов";
    this._statLines.textContent = "0 строк";
  }

  private _setStyle(id: string): void {
    this.currentStyleId = id;
    this._applyPreviewStyle();
    this._dotEls.forEach((el, sid) => el.classList.toggle("active", sid === id));
    this.plugin.settings.styleId = id;
    this.plugin.saveSettings();
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  private async _doExport(): Promise<void> {
    if (!this._currentFile) {
      new Notice("Нет активной заметки");
      return;
    }
    const outputDir = this.plugin.resolveOutputDir();
    const style = getStyleById(this.currentStyleId, this.plugin.settings.customStyles);
    try {
      const { htmlPath, copiedCount, imgDirName } = await exportNote(
        this.app,
        this._currentFile,
        outputDir,
        style.css,
        this.noindex,
        this._parse
      );
      let msg = `Сохранено: ${htmlPath.split(/[\\/]/).pop()}`;
      if (copiedCount > 0) msg += `\n${copiedCount} изобр. → ${imgDirName}/`;
      new Notice(msg);
    } catch (e) {
      new Notice(`Ошибка экспорта: ${(e as Error).message}`);
      console.error("[DocsExporter]", e);
    }
  }

  private _showHTMLModal(): void {
    if (!this._currentFile) {
      new Notice("Нет активной заметки");
      return;
    }
    const style = getStyleById(this.currentStyleId, this.plugin.settings.customStyles);
    const resolved = resolveObsidianImages(this._currentContent, this.app);
    const html = buildExportHTML(
      this._parse(resolved),
      style.css,
      this.noindex,
      this._currentFile?.basename || "Document"
    );

    const modal = new Modal(this.app);
    modal.titleEl.setText("HTML — исходник");
    const pre = modal.contentEl.createEl("pre");
    pre.style.cssText = "font-size:11px;overflow:auto;max-height:60vh;white-space:pre-wrap;word-break:break-all;";
    pre.textContent = html;
    const footer = modal.contentEl.createEl("div");
    footer.style.cssText = "display:flex;gap:8px;margin-top:12px;justify-content:flex-end;";
    footer
      .createEl("button", { text: "Копировать" })
      .addEventListener("click", () => {
        navigator.clipboard.writeText(html);
        new Notice("Скопировано");
      });
    const btnDl = footer.createEl("button", { text: "↓ Экспортировать" });
    btnDl.style.cssText = "background:var(--interactive-accent);color:var(--text-on-accent);border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:12px;";
    btnDl.addEventListener("click", () => {
      this._doExport();
      modal.close();
    });
    modal.open();
  }
}
