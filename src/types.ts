// Shared types for the Docs Exporter plugin.

export interface DocStyle {
  id: string;
  name: string;
  dotColor: string;
  previewBg?: string;
  previewText?: string;
  builtIn: boolean;
  css: string;
}

export interface DocsExporterSettings {
  styleId: string;
  noindex: boolean;
  outputDir: string;
  customStyles: DocStyle[];
  /** Legacy field, migrated to {@link DocsExporterSettings.styleId} on load. */
  theme?: string;
}

export type ParseFn = (md: string) => string;
