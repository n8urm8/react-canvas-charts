# React Canvas Charts Monorepo

This repository contains the library, the demo website, and the documentation that ties them together.

If you are trying to understand how to use the library, start with the package in [packages/chart-components](packages/chart-components). The demo app in [packages/demo-app](packages/demo-app) is a showcase for the website, not the source of truth for the API.

## What lives where

- [packages/chart-components](packages/chart-components) - the actual chart library and primary API surface.
- [docs](docs) - conceptual and pattern docs that explain how to use the library.
- [packages/demo-app](packages/demo-app) - the public website and interactive examples.

## Start here

1. Read [docs/README.md](docs/README.md) for the doc map and recommended learning order.
2. Read [packages/chart-components/README.md](packages/chart-components/README.md) for the library quick start.
3. Browse [docs/zooming-and-streaming.md](docs/zooming-and-streaming.md) and [docs/annotations.md](docs/annotations.md) for advanced usage patterns.
4. Use the demo app to explore examples once you know the API basics.

## Workspace commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
```

## Package summary

- `react-canvas-charts` is the published library package.
- `charts-demo` is the website package that depends on the library via the workspace.

## AI guidance

If an AI assistant is answering questions about the library, it should prefer:

1. The library package source in [packages/chart-components](packages/chart-components).
2. The docs in [docs](docs).
3. The demo app only as a source of examples and screenshots.

## License

MIT. See [LICENSE](LICENSE).
