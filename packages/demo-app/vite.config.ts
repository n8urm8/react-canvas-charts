import { defaultClientConditions, defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";

const libVersion: string = JSON.parse(
  readFileSync(new URL("../chart-components/package.json", import.meta.url), "utf-8")
).version;

// https://vite.dev/config/
export default defineConfig(() => {
  const plugins = [react({
    babel: {
      plugins: [['babel-plugin-react-compiler']],
    },
  }), tailwindcss()];

  return {
    envPrefix: ['VITE_', 'CHART_'],
    define: { __LIB_VERSION__: JSON.stringify(libVersion) },
    // Resolve react-canvas-charts to its TypeScript source (its "react-canvas-charts:source" export) so the
    // demo always runs the workspace code, not a stale dist build.
    resolve: { conditions: ["react-canvas-charts:source", ...defaultClientConditions] },
    plugins
  };
});
