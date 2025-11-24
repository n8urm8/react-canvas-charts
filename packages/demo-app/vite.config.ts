import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from 'path';

const chartSrcPath = '../chart-components/src/components/Chart';
const chartDistPath = resolve(__dirname, '../chart-components/dist');

const watchChartBuild = () => ({
  name: 'watch-react-canvas-charts-build',
  configureServer(server) {
    const onFsEvent = (changedPath: string) => {
      if (changedPath.startsWith(chartDistPath)) {
        server.ws.send({ type: 'full-reload' });
      }
    };

    server.watcher.add(chartDistPath);
    server.watcher.on('add', onFsEvent);
    server.watcher.on('change', onFsEvent);
    server.watcher.on('unlink', onFsEvent);

    server.httpServer?.once('close', () => {
      server.watcher.off('add', onFsEvent);
      server.watcher.off('change', onFsEvent);
      server.watcher.off('unlink', onFsEvent);
    });
  },
});

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const plugins = [react({
    babel: {
      plugins: [['babel-plugin-react-compiler']],
    },
  }), tailwindcss()];

  if (command === 'serve') {
    plugins.push(watchChartBuild());
  }

  return {
    plugins,
    resolve: {
      alias: {
        'react-canvas-charts': resolve(__dirname, '../chart-components/src/index.ts'),
        'react-canvas-charts/components': resolve(__dirname, '../chart-components/src/components/Chart/components/index.ts'),
      },
    },
    build: {
      lib: {
        entry: resolve(__dirname, `${chartSrcPath}/index.ts`),
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
  };
});
