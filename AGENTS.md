# umd-importer

Library that loads UMD JavaScript packages from HTTP URLs.

## Commands

```bash
npm run dev        # Vite dev server
npm run build      # tsc && vite build && tsc (tsc runs twice)
npm run test       # Jest
npm run test:watch # Jest watch mode
```

## Build

- Entry: `src/main.ts`
- Output: `dist/main.umd.js`, `dist/main.mjs`, `dist/main.d.ts`
- `dist/` is gitignored

## Testing

- Framework: Jest with ts-jest
- Location: `src/__tests__/*.test.ts`
- Environment: node

## Key Implementation Notes

- Uses `new Function()` with `with(ctx)` to execute UMD code in a simulated CommonJS context
- Package name auto-extracted from URL filename; must pass explicit name for `/index.js` URLs
- Failed requests are not cached; successful requests cached by package name (if `cache: true`)
