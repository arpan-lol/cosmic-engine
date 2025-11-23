import { build } from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await build({
  entryPoints: ["src/index.ts"],
  outdir: "dist",
  platform: "node",
  bundle: true,
  sourcemap: true,
  target: "node18",
  format: "cjs",
  external: ["google-creds.json"]
});

fs.copyFileSync(
  path.join(__dirname, "google-creds.json"),
  path.join(__dirname, "dist/google-creds.json")
);

console.log("Copied google-creds.json -> dist/");
