import { defineConfig } from "vite";
import { analyzer } from 'vite-bundle-analyzer';
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

const chartLibPath = 'src/components/Chart';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({
    babel: {
      plugins: [['babel-plugin-react-compiler']],
    },
  }), tailwindcss(), dts({ include: [chartLibPath] }), analyzer()],
  build: {
    lib: {
      entry: resolve(__dirname, `${chartLibPath}/index.ts`),
      name: 'ReactCanvasCharts',
      fileName: 'react-canvas-charts'
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
});
