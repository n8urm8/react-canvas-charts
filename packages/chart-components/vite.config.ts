import { defineConfig } from 'vite'
import { analyzer } from 'vite-bundle-analyzer'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { copyFileSync } from 'fs'
import { resolve } from 'path'
import { env } from 'process'
import pkg from './package.json' with { type: 'json' }

const analyze = !!env.ANALYZE_VISUALIZE

// React, react-dom and runtime dependencies are imported by the consumer's app, never bundled.
// Bundling them would ship a second copy of React (and its JSX runtime), which breaks hooks and
// React 18 apps.
const externalPackages = [...Object.keys(pkg.peerDependencies ?? {}), ...Object.keys(pkg.dependencies ?? {})]
const isExternal = (id: string) => externalPackages.some((name) => id === name || id.startsWith(`${name}/`))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        // Target React 18 so compiled output imports `react-compiler-runtime`, which works with
        // both React 18 and 19 (React 19's built-in `react/compiler-runtime` does not exist in 18).
        plugins: [['babel-plugin-react-compiler', { target: '18' }]]
      }
    }),
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      entryRoot: 'src',
      // One bundled index.d.ts: no extensionless relative imports, so it works under
      // moduleResolution node16/nodenext as well as bundler.
      rollupTypes: true,
      tsconfigPath: resolve(__dirname, 'tsconfig.app.json'),
      // The package is "type": "module", so index.d.ts describes the ESM build. CommonJS consumers
      // resolving the "require" export need a .d.cts next to the UMD/CJS build.
      afterBuild: () => copyFileSync(resolve(__dirname, 'dist/index.d.ts'), resolve(__dirname, 'dist/index.d.cts'))
    }),
    analyzer({ enabled: analyze })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ReactCanvasCharts',
      fileName: 'react-canvas-charts'
    },
    rollupOptions: {
      external: isExternal,
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'ReactJSXRuntime',
          'react-compiler-runtime': 'ReactCompilerRuntime',
          'lucide-react': 'LucideReact',
          '@openrouter/sdk': 'OpenRouterSDK'
        }
      }
    }
  }
})
