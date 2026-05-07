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
- `module.exports` and `exports` share the same initial object (`exp`), similar to real CommonJS
- `module.exports` receives setter priority over `exports` (line 60-61 in `loadPackage`)
- `new Function().call(ctx, ctx)` binds `this` to the package context; the `with(ctx)` wrapper provides `exports`, `module`, and `require`
- Promise-level caching by URL: concurrent imports of the same URL share one fetch promise; failed promises are evicted
- `import()` returns a shallow clone of the exports object to prevent caller mutation of cached modules
- Package name auto-extracted from URL filename (last segment before extension, query/hash stripped); must pass explicit name for `/index.js` URLs
- Constructor configures axios with `timeout: 30000` and `maxContentLength: 10MB`
- `loadingStack` tracks in-flight packages for circular dependency detection (line 84)
- `unload(packageName)` and `clear()` methods are available for cache management

## Known Traps

See `TODO.md` for the full list. Critical ones when modifying `execute()`:

- **`exports = {...}` reassignment is silently lost** — `with(ctx)` rebinds the local variable, not `ctx.exports`. Only property mutations (`exports.foo =`) work.
