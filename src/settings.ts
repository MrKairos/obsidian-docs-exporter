// ── Settings tab & custom-style editor ──────────────────────────────────────────

import { App, Modal, Notice, PluginSettingTab, Setting } from "obsidian";
import type DocsExporterPlugin from "./main";
import { DocStyle, DocsExporterSettings } from "./types";
import { BASE_DARK_VARS, BUILTIN_STYLES, darkCSS } from "./styles";
import { getOpenView } from "./view";

export const DEFAULT_SETTINGS: DocsExporterSettings = {
  styleId: "slate",
  noindex: false,
  outputDir: "",
  customStyles: [],
};

type SaveStyleFn = (style: DocStyle) => void;

export class StyleEditModal extends Modal {
  private existingStyle: DocStyle | null;
  private onSave: SaveStyleFn;

  constructor(app: App, existingStyle: DocStyle | null, onSave: SaveStyleFn) {
    super(app);
    this.existingStyle = existingStyle || null;
    this.onSave = onSave;
  }

  onOpen(): void {
    const { contentEl } = this;
    this.titleEl.setText(this.existingStyle ? "Редактировать стиль" : "Новый стиль");

    // Name
    let nameVal = this.existingStyle?.name || "";
    new Setting(contentEl).setName("Название").addText((t) => {
      t.setValue(nameVal).onChange((v) => {
        nameVal = v;
      });
      t.inputEl.style.width = "100%";
    });

    // Dot color
    let dotVal = this.existingStyle?.dotColor || "#5b8dee";
    const dotRow = new Setting(contentEl).setName("Цвет точки");
    dotRow
      .addColorPicker((cp) => {
        cp.setValue(dotVal).onChange((v) => {
          dotVal = v;
        });
      })
      .addText((t) => {
        t.setValue(dotVal).onChange((v) => {
          dotVal = v;
        });
        t.inputEl.style.width = "80px";
      });

    // Preview bg/text
    let previewBg = this.existingStyle?.previewBg || "#0d1117";
    let previewText = this.existingStyle?.previewText || "#cdd9e5";
    new Setting(contentEl).setName("Фон превью").addText((t) => {
      t.setValue(previewBg).onChange((v) => {
        previewBg = v;
      });
    });
    new Setting(contentEl).setName("Текст превью").addText((t) => {
      t.setValue(previewText).onChange((v) => {
        previewText = v;
      });
    });

    // CSS
    const cssLabel = contentEl.createEl("div", { text: "CSS", cls: "setting-item-name" });
    cssLabel.style.cssText = "margin: 12px 0 4px; font-weight: 600;";
    const textarea = contentEl.createEl("textarea");
    textarea.value = this.existingStyle?.css || darkCSS(BASE_DARK_VARS.slate);
    textarea.style.cssText = "width:100%;height:280px;font-family:monospace;font-size:11px;resize:vertical;box-sizing:border-box;padding:8px;";

    // Buttons
    const footer = contentEl.createEl("div");
    footer.style.cssText = "display:flex;gap:8px;margin-top:16px;justify-content:flex-end;";
    footer.createEl("button", { text: "Отмена" }).addEventListener("click", () => this.close());
    const saveBtn = footer.createEl("button", { text: "Сохранить" });
    saveBtn.style.cssText = "background:var(--interactive-accent);color:var(--text-on-accent);border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:13px;";
    saveBtn.addEventListener("click", () => {
      const name = nameVal.trim();
      if (!name) {
        new Notice("Введите название");
        return;
      }
      this.onSave({
        id: this.existingStyle?.id || `custom-${Date.now()}`,
        name,
        dotColor: dotVal,
        previewBg,
        previewText,
        builtIn: false,
        css: textarea.value,
      });
      this.close();
    });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class DocsExporterSettingTab extends PluginSettingTab {
  private plugin: DocsExporterPlugin;

  constructor(app: App, plugin: DocsExporterPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Docs Exporter" });

    // ── Output folder ──
    new Setting(containerEl)
      .setName("Папка экспорта")
      .setDesc("Абсолютный путь куда сохранять .html и картинки. Пусто — корень vault.")
      .addText((text) => {
        text
          .setPlaceholder("/Users/you/Documents/exported")
          .setValue(this.plugin.settings.outputDir || "")
          .onChange(async (value) => {
            this.plugin.settings.outputDir = value.trim();
            await this.plugin.saveSettings();
          });
        text.inputEl.style.width = "100%";
      });

    // ── Styles ──
    const stylesHeader = containerEl.createEl("h3", { text: "Стили" });
    stylesHeader.style.cssText = "margin: 28px 0 4px;";
    containerEl
      .createEl("p", { text: "Встроенные стили нельзя изменить. Создавайте свои стили с произвольным CSS." })
      .style.cssText = "font-size:12px;opacity:0.6;margin-bottom:16px;";

    // Built-in styles list
    containerEl
      .createEl("div", { text: "Встроенные", cls: "setting-item-name" })
      .style.cssText = "font-size:11px;opacity:0.5;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;";

    const builtinList = containerEl.createEl("div");
    builtinList.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;";
    BUILTIN_STYLES.forEach((style) => {
      const chip = builtinList.createEl("div");
      chip.style.cssText = "display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;background:var(--background-modifier-border);font-size:12px;";
      const dot = chip.createEl("span");
      dot.style.cssText = `width:10px;height:10px;border-radius:50%;background:${style.dotColor};flex-shrink:0;`;
      if (style.id === "notion-light") dot.style.outline = "1px solid #ccc";
      chip.createEl("span", { text: style.name });
    });

    // Custom styles
    containerEl
      .createEl("div", { text: "Пользовательские", cls: "setting-item-name" })
      .style.cssText = "font-size:11px;opacity:0.5;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;";

    const customStyles = this.plugin.settings.customStyles || [];
    if (customStyles.length === 0) {
      containerEl
        .createEl("p", { text: "Нет пользовательских стилей." })
        .style.cssText = "font-size:12px;opacity:0.5;margin-bottom:12px;";
    } else {
      customStyles.forEach((style, idx) => {
        const row = new Setting(containerEl).setName(style.name);
        const dot = row.nameEl.createEl("span");
        dot.style.cssText = `display:inline-block;width:10px;height:10px;border-radius:50%;background:${style.dotColor};margin-right:8px;vertical-align:middle;`;
        row.nameEl.prepend(dot);
        row.addButton((btn) =>
          btn.setButtonText("Изменить").onClick(() => {
            new StyleEditModal(this.app, style, (updated) => {
              this.plugin.settings.customStyles[idx] = updated;
              this.plugin.saveSettings().then(() => {
                this.display();
                getOpenView(this.app)?._rebuildStylePicker();
              });
            }).open();
          })
        );
        row.addButton((btn) =>
          btn
            .setButtonText("Удалить")
            .setWarning()
            .onClick(async () => {
              this.plugin.settings.customStyles.splice(idx, 1);
              if (this.plugin.settings.styleId === style.id) {
                this.plugin.settings.styleId = "slate";
                const view = getOpenView(this.app);
                if (view) {
                  view.currentStyleId = "slate";
                  view._applyPreviewStyle();
                }
              }
              await this.plugin.saveSettings();
              this.display();
              getOpenView(this.app)?._rebuildStylePicker();
            })
        );
      });
    }

    // Add button
    new Setting(containerEl).addButton((btn) =>
      btn.setButtonText("+ Новый стиль").onClick(() => {
        new StyleEditModal(this.app, null, (newStyle) => {
          this.plugin.settings.customStyles.push(newStyle);
          this.plugin.saveSettings().then(() => {
            this.display();
            getOpenView(this.app)?._rebuildStylePicker();
          });
        }).open();
      })
    );
  }
}
