# Docs Exporter

Obsidian plugin to export notes as styled, self-contained HTML — theme picker, syntax highlighting, TOC, callouts and a click-to-zoom image lightbox.

## Features

- **Live preview** in a side panel that re-renders as you type.
- **Theme picker** — 6 built-in styles (Acid, Mono, Slate, Graphite, Notion, Notion Dark) plus your own custom CSS styles.
- **Self-contained export** — a single `.html` file with all CSS inlined; images are copied into a sibling `<note>_images/` folder.
- **Markdown support** — headings, tables, task lists, callouts, blockquotes, fenced code with syntax highlighting (JS/TS/C#/GDScript), `table-of-contents` blocks and Mermaid placeholders.
- **Image lightbox** — click any image in the exported HTML to open it full-size with zoom in/out, wheel zoom, drag-to-pan and close (Esc / backdrop).
- **`noindex` toggle** for documents you don't want indexed.
- Obsidian wiki-image syntax: `![[image.png]]`, `![[image.png|300]]`, `![[image.png|300x200]]`.

## Usage

Open the **Docs Exporter** view from the ribbon (or the command palette), pick a style, and hit `↓ .html`. There's also a command to export the current note directly.

## Development

```bash
npm install      # install deps
npm run dev      # esbuild watch — rebuilds main.js and deploys it into the vault
npm run build    # type-check + production bundle
```

`esbuild.config.mjs` deploys `main.js`, `manifest.json` and `styles.css` into the vault plugin folder. Override the target with the `OBSIDIAN_PLUGIN_DIR` environment variable.

Source lives in `src/`:

| File | Responsibility |
|---|---|
| `main.ts` | Plugin entry, commands, settings lifecycle |
| `view.ts` | The live-preview `ItemView` |
| `settings.ts` | Settings tab + custom-style editor modal |
| `parser.ts` | Markdown → HTML |
| `highlight.ts` | Code syntax highlighting |
| `styles.ts` | Built-in style definitions |
| `lightbox.ts` | Injected image-lightbox CSS/HTML/JS |
| `toc.ts` | Heading extraction + table of contents |
| `images.ts` | Wiki-image collection and resolution |
| `export.ts` | HTML document assembly + file export |

## License

[MIT](LICENSE) © MrKairos
