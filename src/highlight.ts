// ── Syntax highlighter ────────────────────────────────────────────────────────
// Lightweight regex highlighter for JS/TS/C#/GDScript fenced code blocks.

export function highlight(code: string, lang?: string): string {
  const l = (lang || "").toLowerCase();
  const isCS = l === "csharp" || l === "cs";
  const isGD = l === "gdscript" || l === "gd";
  const isTS = l === "ts" || l === "typescript";
  const isJS = l === "js" || l === "javascript";
  if (!isCS && !isGD && !isTS && !isJS) return code;

  let h = code;
  h = h.replace(/(\/\/[^\n]*)/g, '<span class="hl-comment">$1</span>');
  h = h.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>');
  h = h.replace(
    /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g,
    '<span class="hl-string">$1</span>'
  );
  h = h.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>');

  const kwJSTS = ["const", "let", "var", "function", "return", "if", "else", "for", "while",
    "do", "switch", "case", "break", "continue", "new", "delete", "typeof", "instanceof",
    "import", "export", "default", "from", "class", "extends", "super", "this", "null",
    "undefined", "true", "false", "async", "await", "try", "catch", "finally", "throw",
    "of", "in", "static", "get", "set", "yield", "void"];
  const kwTS = ["interface", "type", "enum", "namespace", "declare", "abstract",
    "readonly", "as", "is", "implements", "keyof", "infer", "never", "any", "unknown",
    "string", "number", "boolean", "object", "symbol", "bigint"];
  const kwCS = ["using", "namespace", "class", "interface", "struct", "enum", "public",
    "private", "protected", "internal", "static", "readonly", "const", "new", "return",
    "if", "else", "for", "foreach", "while", "do", "switch", "case", "break", "continue",
    "try", "catch", "finally", "throw", "void", "null", "true", "false", "this", "base",
    "override", "virtual", "abstract", "sealed", "partial", "async", "await", "var",
    "string", "int", "bool", "float", "double", "decimal", "long", "short", "byte",
    "char", "object", "dynamic", "in", "out", "ref", "params", "get", "set", "value",
    "is", "as", "typeof", "nameof", "sizeof", "lock", "event", "delegate", "where", "yield"];
  const kwGD = ["func", "var", "const", "class", "extends", "return", "if", "elif",
    "else", "for", "while", "match", "break", "continue", "pass", "self", "null", "true",
    "false", "and", "or", "not", "in", "is", "as", "static", "enum", "signal",
    "export", "onready", "tool", "await", "yield", "super", "preload", "load",
    "print", "int", "float", "bool", "String", "Array", "Dictionary", "Vector2",
    "Vector3", "Color", "NodePath", "Callable", "void"];

  let kws = [...kwJSTS];
  if (isTS) kws = [...kws, ...kwTS];
  if (isCS) kws = [...kwCS];
  if (isGD) kws = [...kwGD];

  const kwRe = new RegExp(`(?<![\\w.])\\b(${kws.join("|")})\\b(?![\\w])`, "g");
  h = h.replace(kwRe, (_, kw) => `<span class="hl-kw">${kw}</span>`);
  h = h.replace(/\b([a-zA-Z_]\w*)(?=\s*\()/g, '<span class="hl-fn">$1</span>');
  h = h.replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, '<span class="hl-type">$1</span>');
  return h;
}

export const HIGHLIGHT_CSS = `
.hl-kw      { color: #c792ea; }
.hl-string  { color: #c3e88d; }
.hl-comment { color: #546e7a; font-style: italic; }
.hl-number  { color: #f78c6c; }
.hl-fn      { color: #82aaff; }
.hl-type    { color: #ffcb6b; }
`;
