import { defineConfig } from "vite";
import { analyzer } from 'vite-bundle-analyzer';
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

const chartLibPath = '../chart-components/src/components/Chart';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({
    babel: {
      plugins: [['babel-plugin-react-compiler']],
    },
  }), tailwindcss(), dts({ include: [chartLibPath] }), analyzer()],
  resolve: {
    alias: {
      'react-canvas-charts': resolve(__dirname, '../chart-components/src/index.ts'),
      'react-canvas-charts/components': resolve(__dirname, '../chart-components/src/components/Chart/components/index.ts'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, `${chartLibPath}/index.ts`),
      name: 'ReactCanvasChartsDemo',
      fileName: 'react-canvas-charts-demo'
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
