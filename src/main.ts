// ── Plugin entry ────────────────────────────────────────────────────────────────

import { Notice, Plugin, TFile } from "obsidian";
import { DocsExporterSettings } from "./types";
import { DEFAULT_SETTINGS, DocsExporterSettingTab } from "./settings";
import { VIEW_TYPE, DocsExporterView } from "./view";
import { getStyleById } from "./styles";
import { buildParser } from "./parser";
import { exportNote } from "./export";
import { vaultBasePath } from "./images";

export default class DocsExporterPlugin extends Plugin {
  settings!: DocsExporterSettings;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.registerView(VIEW_TYPE, (leaf) => new DocsExporterView(leaf, this));
    this.addSettingTab(new DocsExporterSettingTab(this.app, this));
    this.addRibbonIcon("file-output", "Docs Exporter", () => this.activateView());

    this.addCommand({
      id: "open-docs-exporter",
      name: "Открыть Docs Exporter",
      callback: () => this.activateView(),
    });

    this.addCommand({
      id: "export-current-note",
      name: "Экспортировать текущую заметку в HTML",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (file && file.extension === "md") {
          if (!checking) this._quickExport(file);
          return true;
        }
        return false;
      },
    });
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    // Migrate legacy 'theme' → 'styleId'
    if (this.settings.theme !== undefined && !this.settings.styleId) {
      this.settings.styleId = this.settings.theme || "slate";
    }
    delete this.settings.theme;
    if (!Array.isArray(this.settings.customStyles)) this.settings.customStyles = [];
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  resolveOutputDir(): string {
    const custom = (this.settings.outputDir || "").trim();
    return custom || vaultBasePath(this.app);
  }

  private async _quickExport(file: TFile): Promise<void> {
    const outputDir = this.resolveOutputDir();
    const style = getStyleById(this.settings.styleId, this.settings.customStyles);
    const parse = buildParser();
    try {
      const { htmlPath, copiedCount, imgDirName } = await exportNote(
        this.app,
        file,
        outputDir,
        style.css,
        this.settings.noindex,
        parse
      );
      let msg = `Экспортировано: ${htmlPath.split(/[\\/]/).pop()}`;
      if (copiedCount > 0) msg += `\n${copiedCount} изобр. → ${imgDirName}/`;
      new Notice(msg);
    } catch (e) {
      new Notice(`Ошибка экспорта: ${(e as Error).message}`);
      console.error("[DocsExporter]", e);
    }
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      const right = workspace.getRightLeaf(false);
      if (!right) return;
      leaf = right;
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
  }
}
