// ── Style system ──────────────────────────────────────────────────────────────

import { DocStyle } from "./types";

export const BASE_DARK_VARS: Record<string, Record<string, string>> = {
  acid:     { "--de-bg": "#0f0f11", "--de-surface": "#16161a", "--de-border": "#2a2a32", "--de-accent": "#c8f55a", "--de-accent2": "#5af5c8", "--de-text": "#e8e8f0", "--de-code-bg": "#1e1e26" },
  mono:     { "--de-bg": "#111111", "--de-surface": "#191919", "--de-border": "#2e2e2e", "--de-accent": "#e8e8e8", "--de-accent2": "#a0a0a0", "--de-text": "#d8d8d8", "--de-code-bg": "#1e1e1e" },
  slate:    { "--de-bg": "#0d1117", "--de-surface": "#161b22", "--de-border": "#21262d", "--de-accent": "#5b8dee", "--de-accent2": "#79c0ff", "--de-text": "#cdd9e5", "--de-code-bg": "#1c2128" },
  graphite: { "--de-bg": "#0e0f0f", "--de-surface": "#161818", "--de-border": "#242626", "--de-accent": "#b0b8b8", "--de-accent2": "#8a9696", "--de-text": "#cdd4d4", "--de-code-bg": "#1a1c1c" },
};

export function darkCSS(vars: Record<string, string>): string {
  const cv = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join("\n");
  return `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;1,9..144,300&display=swap');
:root {
${cv}
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Fraunces', serif; background: var(--de-bg); color: var(--de-text); padding: 60px 24px; line-height: 1.75; }
.doc { max-width: 760px; margin: 0 auto; }
h1 { font-size: 2.4em; font-weight: 700; color: var(--de-accent); letter-spacing: -0.03em; border-bottom: 2px solid var(--de-border); padding-bottom: 16px; margin-bottom: 28px; }
h2 { font-size: 1.45em; font-weight: 700; color: var(--de-text); margin: 44px 0 14px; padding-left: 16px; position: relative; }
h2::before { content: ''; position: absolute; left: 0; top: 4px; bottom: 4px; width: 3px; background: var(--de-accent2); border-radius: 2px; }
h3 { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--de-accent2); margin: 28px 0 10px; }
p { margin-bottom: 14px; }
strong { color: var(--de-text); font-weight: 700; }
em { opacity: 0.75; }
a { color: var(--de-accent2); text-decoration: none; border-bottom: 1px solid currentColor; opacity: 0.8; }
code { font-family: 'JetBrains Mono', monospace; font-size: 12px; background: var(--de-code-bg); color: var(--de-accent); padding: 2px 7px; border-radius: 3px; border: 1px solid var(--de-border); }
pre { background: var(--de-code-bg); border: 1px solid var(--de-border); border-radius: 6px; padding: 16px 20px; overflow-x: auto; margin-bottom: 20px; }
pre code { background: none; border: none; padding: 0; color: var(--de-text); font-size: 12.5px; line-height: 1.5; white-space: pre; }
blockquote { margin: 0 0 20px; padding: 14px 20px; border-left: 3px solid var(--de-accent); border-radius: 0 6px 6px 0; opacity: 0.8; }
table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-family: 'JetBrains Mono', monospace; font-size: 12px; }
th { color: var(--de-accent2); font-weight: 600; text-align: left; padding: 10px 14px; border-bottom: 2px solid var(--de-border); }
td { padding: 9px 14px; border-bottom: 1px solid var(--de-border); }
ul, ol { margin: 0 0 16px 20px; }
li { margin-bottom: 6px; }
hr { border: none; border-top: 1px solid var(--de-border); margin: 32px 0; }
img { max-width: 100%; border-radius: 6px; display: block; margin: 12px 0; }
.de-img-missing { color: #ff6b6b; font-size: 12px; }
.hl-kw { color: #c792ea; }
.hl-string { color: #c3e88d; }
.hl-comment { color: #546e7a; font-style: italic; }
.hl-number { color: #f78c6c; }
.hl-fn { color: #82aaff; }
.hl-type { color: #ffcb6b; }
.toc { background: var(--de-code-bg); border: 1px solid var(--de-border); border-radius: 8px; padding: 20px 24px; margin-bottom: 32px; }
.toc ul { list-style: none; margin: 0; padding: 0; }
.toc-item { margin: 4px 0; line-height: 1.5; }
.toc-item a { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--de-text); text-decoration: none; border-bottom: none; opacity: 1; transition: color 0.15s; }
.toc-item a:hover { color: var(--de-accent); }
.toc-item a::before { content: '·'; margin-right: 7px; color: var(--de-border); }
.toc-h1 > a { font-weight: 700; color: var(--de-accent); font-size: 13px; }
.toc-h1 > a::before { content: ''; margin: 0; }
.toc-h2 > a { opacity: 0.85; }
.toc-h3 > a { opacity: 0.6; font-size: 11px; }
s { opacity: 0.5; }
li.task-unchecked, li.task-done { list-style: none; margin-left: -4px; }
li.task-unchecked::before { content: '☐'; margin-right: 7px; opacity: 0.6; }
li.task-done { opacity: 0.55; text-decoration: line-through; }
li.task-done::before { content: '☑'; margin-right: 7px; color: var(--de-accent2); }
.callout { border-radius: 6px; padding: 14px 18px; margin: 16px 0; border-left: 4px solid var(--de-accent2); background: var(--de-surface); }
.callout-title { font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--de-accent2); margin: 0 0 6px; padding: 0; }
.callout-body { font-size: 0.9375em; line-height: 1.6; }
.callout-note .callout-title, .callout-info .callout-title { color: #79c0ff; }
.callout-note, .callout-info { border-color: #79c0ff; }
.callout-warning .callout-title, .callout-caution .callout-title { color: #e3b341; }
.callout-warning, .callout-caution { border-color: #e3b341; }
.callout-danger .callout-title, .callout-error .callout-title { color: #ff7b72; }
.callout-danger, .callout-error { border-color: #ff7b72; }
.callout-tip .callout-title, .callout-success .callout-title { color: #56d364; }
.callout-tip, .callout-success { border-color: #56d364; }`;
}

export function notionCSS(dark: boolean): string {
  const c = dark
    ? {
        bg: "#191919", surface: "#252525", border: "#333333", borderLight: "#2c2c2c",
        text: "#f0efea", textSec: "#9b9a97", link: "#5b9bd5", codeBg: "#2d2d2d", codeText: "#e06c75",
      }
    : {
        bg: "#ffffff", surface: "#f7f6f3", border: "#e9e9e7", borderLight: "#f0efed",
        text: "#37352f", textSec: "#9b9a97", link: "#2383e2", codeBg: "#f0f0ef", codeText: "#eb5757",
      };
  return `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.75; -webkit-font-smoothing: antialiased; background: ${c.bg}; color: ${c.text}; padding: 60px 24px; }
.doc { max-width: 720px; margin: 0 auto; }
h1 { font-size: 2.5em; font-weight: 700; line-height: 1.2; color: ${c.text}; margin-bottom: 28px; letter-spacing: -0.02em; }
h2 { font-size: 1.5em; font-weight: 600; line-height: 1.3; color: ${c.text}; margin: 2.2em 0 0.5em; }
h3 { font-size: 1.15em; font-weight: 600; line-height: 1.4; color: ${c.text}; margin: 1.6em 0 0.3em; }
p { margin-bottom: 0.75em; }
strong { font-weight: 600; color: ${c.text}; }
em { color: ${c.textSec}; }
hr { border: none; border-top: 1px solid ${c.border}; margin: 2em 0; }
a { color: ${c.link}; text-decoration: none; border-bottom: 1px solid ${c.link}; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 85%; background: ${c.codeBg}; color: ${c.codeText}; padding: 2px 6px; border-radius: 3px; }
pre { background: ${c.surface}; border-radius: 4px; padding: 16px 20px; overflow-x: auto; margin-bottom: 20px; }
pre code { background: none; color: ${c.text}; font-size: 13px; line-height: 1.5; white-space: pre; }
blockquote { margin: 0 0 20px; padding: 12px 16px; border-left: 3px solid ${c.textSec}; background: ${c.surface}; border-radius: 0 3px 3px 0; }
table { width: 100%; border-collapse: collapse; font-size: 0.875em; margin: 0.75em 0 1.25em; }
th { text-align: left; font-weight: 600; padding: 8px 12px; border-bottom: 1px solid ${c.border}; background: ${c.surface}; color: ${c.text}; }
td { padding: 8px 12px; border-bottom: 1px solid ${c.borderLight}; vertical-align: top; color: ${c.text}; }
tr:last-child td { border-bottom: none; }
ul, ol { margin: 0 0 16px 20px; }
li { margin-bottom: 0.25em; }
img { max-width: 100%; border-radius: 4px; display: block; margin: 12px 0; }
.de-img-missing { color: #eb5757; font-size: 12px; }
.toc { background: ${c.surface}; border: 1px solid ${c.border}; border-radius: 6px; padding: 20px 24px; margin-bottom: 32px; }
.toc ul { list-style: none; margin: 0; padding: 0; }
.toc-item { margin: 4px 0; }
.toc-item a { font-size: 13px; color: ${c.text}; text-decoration: none; border-bottom: none; }
.toc-item a:hover { color: ${c.link}; }
.toc-h2 > a { opacity: 0.7; }
.toc-h3 > a { opacity: 0.5; font-size: 12px; }
s { opacity: 0.5; }
li.task-unchecked, li.task-done { list-style: none; margin-left: -4px; }
li.task-unchecked::before { content: '☐'; margin-right: 7px; opacity: 0.5; }
li.task-done { opacity: 0.5; text-decoration: line-through; }
li.task-done::before { content: '☑'; margin-right: 7px; color: ${c.link}; }
.callout { border-radius: 4px; padding: 14px 18px; margin: 16px 0; border-left: 4px solid ${c.textSec}; background: ${c.surface}; }
.callout-title { font-weight: 600; font-size: 0.8125em; text-transform: uppercase; letter-spacing: 0.06em; color: ${c.textSec}; margin: 0 0 6px; padding: 0; }
.callout-body { font-size: 0.9375em; line-height: 1.65; }
.callout-note, .callout-info { border-color: ${c.link}; }
.callout-note .callout-title, .callout-info .callout-title { color: ${c.link}; }
.callout-warning, .callout-caution { border-color: #d4a017; }
.callout-warning .callout-title, .callout-caution .callout-title { color: #d4a017; }
.callout-danger, .callout-error { border-color: #e03e3e; }
.callout-danger .callout-title, .callout-error .callout-title { color: #e03e3e; }
.callout-tip, .callout-success { border-color: #0f7b6c; }
.callout-tip .callout-title, .callout-success .callout-title { color: #0f7b6c; }`;
}

export const BUILTIN_STYLES: DocStyle[] = [
  { id: "acid",         name: "Acid",        dotColor: "#c8f55a", previewBg: "#0f0f11", previewText: "#e8e8f0", builtIn: true, css: darkCSS(BASE_DARK_VARS.acid) },
  { id: "mono",         name: "Mono",        dotColor: "#e8e8e8", previewBg: "#111111", previewText: "#d8d8d8", builtIn: true, css: darkCSS(BASE_DARK_VARS.mono) },
  { id: "slate",        name: "Slate",       dotColor: "#5b8dee", previewBg: "#0d1117", previewText: "#cdd9e5", builtIn: true, css: darkCSS(BASE_DARK_VARS.slate) },
  { id: "graphite",     name: "Graphite",    dotColor: "#7a8a8a", previewBg: "#0e0f0f", previewText: "#cdd4d4", builtIn: true, css: darkCSS(BASE_DARK_VARS.graphite) },
  { id: "notion-light", name: "Notion",      dotColor: "#2383e2", previewBg: "#ffffff", previewText: "#37352f", builtIn: true, css: notionCSS(false) },
  { id: "notion-dark",  name: "Notion Dark", dotColor: "#9b9a97", previewBg: "#191919", previewText: "#f0efea", builtIn: true, css: notionCSS(true) },
];

export function getAllStyles(customStyles?: DocStyle[]): DocStyle[] {
  return [...BUILTIN_STYLES, ...(customStyles || [])];
}

export function getStyleById(id: string, customStyles?: DocStyle[]): DocStyle {
  return getAllStyles(customStyles).find((s) => s.id === id) || BUILTIN_STYLES[2];
}
