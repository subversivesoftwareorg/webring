import * as esbuild from "esbuild";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isServe = process.argv.includes("--serve");

/** Plugin: inline CSS imports as string literals for Shadow DOM */
const cssInlinePlugin = {
  name: "css-inline",
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, (args) => {
      const css = readFileSync(args.path, "utf8");
      return {
        contents: `export default ${JSON.stringify(css)};`,
        loader: "js",
      };
    });
  },
};

const shared = {
  entryPoints: [resolve(__dirname, "src/index.ts")],
  bundle: true,
  sourcemap: true,
  plugins: [cssInlinePlugin],
};

if (isServe) {
  const ctx = await esbuild.context({
    ...shared,
    format: "esm",
    outfile: resolve(__dirname, "dist/webring-widget.esm.js"),
    target: "es2022",
  });
  const { host, port } = await ctx.serve({
    servedir: resolve(__dirname),
    port: 3000,
  });
  console.log(`Dev server running at http://${host}:${port}/demo/`);
} else {
  await Promise.all([
    esbuild.build({
      ...shared,
      format: "esm",
      outfile: resolve(__dirname, "dist/webring-widget.esm.js"),
      target: "es2022",
    }),
    esbuild.build({
      ...shared,
      format: "iife",
      globalName: "WebringWidget",
      outfile: resolve(__dirname, "dist/webring-widget.iife.js"),
      target: "es2020",
    }),
  ]);
  console.log("Built dist/webring-widget.esm.js and dist/webring-widget.iife.js");
}
