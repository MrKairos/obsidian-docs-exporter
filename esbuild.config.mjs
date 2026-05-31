import esbuild from "esbuild";
import process from "process";
import fs from "fs";
import path from "path";
import builtins from "builtin-modules";

const prod = process.argv.includes("production");

// Where the built plugin is deployed for live use. Override with OBSIDIAN_PLUGIN_DIR.
const VAULT_PLUGIN_DIR =
  process.env.OBSIDIAN_PLUGIN_DIR ||
  "D:/Obsidian_base/kairos/.obsidian/plugins/docs-exporter";

const banner =
  "/* docs-exporter — bundled by esbuild, do not edit directly.\n" +
  "   Source: https://github.com/MrKairos/obsidian-docs-exporter */";

// Copy the build artifacts into the vault plugin folder so Obsidian picks them up.
function deploy() {
  try {
    if (!fs.existsSync(VAULT_PLUGIN_DIR)) {
      fs.mkdirSync(VAULT_PLUGIN_DIR, { recursive: true });
    }
    for (const file of ["main.js", "manifest.json", "styles.css"]) {
      if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(VAULT_PLUGIN_DIR, file));
      }
    }
    console.log(`[docs-exporter] deployed → ${VAULT_PLUGIN_DIR}`);
  } catch (e) {
    console.warn(`[docs-exporter] deploy skipped: ${e.message}`);
  }
}

const deployPlugin = {
  name: "deploy",
  setup(build) {
    build.onEnd((result) => {
      if (result.errors.length === 0) deploy();
    });
  },
};

const ctx = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", "@codemirror/*", ...builtins],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  minify: prod,
  banner: { js: banner },
  outfile: "main.js",
  plugins: [deployPlugin],
});

if (prod) {
  await ctx.rebuild();
  await ctx.dispose();
} else {
  await ctx.watch();
  console.log("[docs-exporter] watching for changes…");
}
