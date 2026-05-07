# umd-importer

Library that loads UMD JavaScript packages from HTTP URLs.

## Commands

```bash
pnpm dev           # Vite dev server (entry: index.html + index.ts)
pnpm build         # tsc (type-check) → vite build → tsc (declaration emit)
pnpm test          # Jest (all)
pnpm test -- src/__tests__/main.test.ts  # single file
pnpm test:watch    # Jest watch mode
```

## Build

- Entry: `src/main.ts`
- Output: `dist/main.umd.js`, `dist/main.mjs`, `dist/main.d.ts`
- `dist/` is gitignored
- `tsc` runs twice: first pass type-checks only, second pass emits declarations (`emitDeclarationOnly: true`). The first pass catches `noUnusedLocals` / `noUnusedParameters` / `strict` errors before Vite builds.
- Vite config: library mode (`name: 'UmdImporter'`, `fileName: 'main'`)

## Testing

- Framework: Jest with `ts-jest` preset, node environment
- Location: `src/__tests__/main.test.ts`
- Axios is mocked globally; `axios.create` returns a mock with `get: jest.fn()`

## Key Implementation Notes

- Uses `new Function()` with `with(ctx)` to execute UMD code in a simulated CommonJS context
- `define` is intentionally not provided so AMD checks fall through to the CommonJS branch
- `module.exports` and `exports` are separate objects on `ctx` — they are **not linked** like real CommonJS
- Package name auto-extracted from URL filename (last segment before extension); must pass explicit name for `/index.js` URLs
- Failed requests are not cached; successful requests cached by package name (if `cache: true`)

## Known Traps

See `TODO.md` for the full list. Critical ones when modifying `execute()`:

- **`exports = {...}` reassignment is silently lost** — `with(ctx)` rebinds the local variable, not `ctx.exports`. Only property mutations (`exports.foo =`) work.
- **`module` is initialized as `{}`** not `{ exports: {} }` — code that reads `module.exports` before it is set gets `undefined`.
- **Cache key is package name, not URL** — two different URLs resolving to the same package name share one cache entry.
- **No request timeout** — `axios.get()` in `loadPackage` has no timeout, so hanging URLs block the promise forever.
- **`sourceURL` is literal `'[module]'`** — not replaced with the actual package name, so DevTools shows the same label for all modules.
