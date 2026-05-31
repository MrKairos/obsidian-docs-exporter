// ── Markdown parser ───────────────────────────────────────────────────────────
// Order-dependent regex transform pipeline. Markdown → HTML.

import { ParseFn } from "./types";
import { extractHeadings, buildTOCHTML, slugify } from "./toc";
import { highlight } from "./highlight";

export function buildParser(): ParseFn {
  return function parse(md: string): string {
    let html = md;

    // ── -1. Strip YAML frontmatter ──
    html = html.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");

    // ── 0. Stash mermaid blocks ──
    const mermaidStash: string[] = [];
    html = html.replace(/```mermaid\n([\s\S]*?)```/g, (_m, code) => {
      const idx = mermaidStash.length;
      mermaidStash.push(code.trim());
      return `<nav id="__mermaid_${idx}__"></nav>`;
    });

    // ── 1. Extract headings ──
    const headings = extractHeadings(html);

    // ── 2. table-of-contents block ──
    html = html.replace(/```table-of-contents[\s\S]*?```/g, buildTOCHTML(headings));

    // ── 3. Fenced code blocks ──
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
      const trimmed = code.replace(/\n$/, "");
      const esc = trimmed.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<pre><code${lang ? ` class="language-${lang}"` : ""}>${highlight(esc, lang)}</code></pre>\n`;
    });

    html = html.replace(/`([^`\n]+)`/g, (_m, c) =>
      `<code>${c.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code>`
    );
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

    // ── 4. Headings with id anchors ──
    const seenIds: Record<string, number> = {};
    [6, 5, 4, 3, 2, 1].forEach((n) => {
      html = html.replace(new RegExp(`^${"#".repeat(n)} (.+)$`, "gm"), (_m, text) => {
        let id = slugify(text);
        if (seenIds[id] !== undefined) {
          seenIds[id]++;
          id = `${id}-${seenIds[id]}`;
        } else {
          seenIds[id] = 0;
        }
        return `<h${n} id="${id}">${text}</h${n}>`;
      });
    });

    html = html.replace(/^---+$/gm, "<hr>");

    // ── 5. Tables ──
    html = html.replace(/^\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/gm, (_m, header, rows) => {
      const ths = header.split("|").map((c: string) => c.trim()).filter(Boolean).map((c: string) => `<th>${c}</th>`).join("");
      const trs = rows.trim().split("\n").map((row: string) => {
        const tds = row.split("|").map((c: string) => c.trim()).filter(Boolean).map((c: string) => `<td>${c}</td>`).join("");
        return `<tr>${tds}</tr>`;
      }).join("");
      return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>\n`;
    });

    // ── 6. Lists (with task list support) ──
    html = html.replace(/((?:^[*\-] .+\n?)+)/gm, (block) => {
      const items = block.trim().split("\n").map((l) => {
        const rest = l.replace(/^[*\-] /, "");
        if (/^\[ \] /.test(rest)) return `<li class="task-unchecked">${rest.slice(4)}</li>`;
        if (/^\[x\] /i.test(rest)) return `<li class="task-done">${rest.slice(4)}</li>`;
        return `<li>${rest}</li>`;
      }).join("");
      return `<ul>${items}</ul>\n`;
    });
    html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
      const items = block.trim().split("\n").map((l) => `<li>${l.replace(/^\d+\. /, "")}</li>`).join("");
      return `<ol>${items}</ol>\n`;
    });

    // ── 7. Inline: strikethrough, bold, italic, links ──
    html = html.replace(/~~(.+?)~~/g, "<s>$1</s>");
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // ── 7b. Wiki-links: [[Page]], [[Page|alias]], [[Page#Section]], [[#Section]] ──
    // Image embeds (![[img]]) are resolved before the parser runs; remaining
    // [[…]] (and any non-image ![[…]] embeds) become readable links here.
    html = html.replace(
      /!?\[\[([^\]\n|#]*)(?:#([^\]\n|]*))?(?:\|([^\]\n]*))?\]\]/g,
      (_m, page, section, alias) => {
        const p = (page || "").trim();
        const sec = (section || "").trim();
        const al = (alias || "").trim();
        let display = al;
        if (!display) {
          if (p && sec) display = `${p} › ${sec}`;
          else display = p || sec;
        }
        // Same-document section link → real in-page anchor.
        if (!p && sec) return `<a class="de-wikilink" href="#${slugify(sec)}">${display}</a>`;
        // Dangling note reference in a standalone export → non-navigating span.
        return `<span class="de-wikilink">${display}</span>`;
      }
    );

    // ── 8. Callouts (must run before blockquotes) ──
    html = html.replace(/^> \[!(\w+)\][+\-]?([^\n]*)\n((?:>[ \t]?[^\n]*\n?)*)/gm, (_m, type, title, body) => {
      const t = title.trim() || (type.charAt(0).toUpperCase() + type.slice(1).toLowerCase());
      const content = body.replace(/^>[ \t]?/gm, "").trim().replace(/\n/g, "<br>");
      return `<div class="callout callout-${type.toLowerCase()}"><p class="callout-title">${t}</p><div class="callout-body">${content}</div></div>\n`;
    });

    // ── 9. Blockquotes ──
    html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

    // ── 10. Paragraph grouping (blank lines = new paragraph) ──
    // Track <pre> depth so code block internals are never wrapped in <p>
    const blockTag = /^<(h[1-6]|ul|ol|pre|blockquote|table|hr|nav|img|div)/;
    const lines = html.split("\n");
    const out: string[] = [];
    let buf: string[] = [];
    let preDepth = 0;
    const flush = () => {
      if (buf.length) {
        out.push(`<p>${buf.join(" ")}</p>`);
        buf = [];
      }
    };
    for (const line of lines) {
      const t = line.trim();
      if (preDepth > 0) {
        out.push(line);
        preDepth += (t.match(/<pre/g) || []).length - (t.match(/<\/pre>/g) || []).length;
        continue;
      }
      if (!t) {
        flush();
        out.push("");
        continue;
      }
      if (blockTag.test(t)) {
        flush();
        out.push(line);
        if (/^<pre/.test(t) && !t.includes("</pre>")) preDepth = 1;
        continue;
      }
      buf.push(t);
    }
    flush();
    html = out.join("\n").replace(/<p><\/p>/g, "");

    // ── Final: restore mermaid blocks ──
    mermaidStash.forEach((code, idx) => {
      html = html.replace(`<nav id="__mermaid_${idx}__"></nav>`, `<div class="mermaid">${code}</div>`);
    });

    return html;
  };
}
