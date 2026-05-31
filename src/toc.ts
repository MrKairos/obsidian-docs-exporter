// ── Table of Contents ─────────────────────────────────────────────────────────

export interface Heading {
  level: number;
  text: string;
  id: string;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\wа-яёa-z0-9\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function extractHeadings(md: string): Heading[] {
  const stripped = md.replace(/```[\s\S]*?```/g, "");
  const headings: Heading[] = [];
  const seen: Record<string, number> = {};
  const re = /^(#{1,3}) (.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped)) !== null) {
    const level = m[1].length;
    const text = m[2].trim();
    let id = slugify(text);
    if (seen[id] !== undefined) {
      seen[id]++;
      id = `${id}-${seen[id]}`;
    } else {
      seen[id] = 0;
    }
    headings.push({ level, text, id });
  }
  return headings;
}

export function buildTOCHTML(headings: Heading[]): string {
  if (!headings.length) return "";
  const items = headings
    .map(({ level, text, id }) => {
      const indent = level - 1;
      return (
        `<li class="toc-item toc-h${level}" style="padding-left:${indent * 16}px">` +
        `<a href="#${id}">${text}</a></li>`
      );
    })
    .join("\n");
  return `<nav class="toc"><ul>${items}</ul></nav>`;
}
