# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@boogoo/umd-importer` is a TypeScript library that dynamically loads UMD JavaScript packages from HTTP URLs at runtime. It fetches JS via axios, executes it in a sandboxed `with(ctx){eval(...)}` context simulating a UMD environment (`exports`, `module`, `require`), and returns the module's exports. Supports caching, debug mode, and external dependency injection.

## Commands

- **Build:** `pnpm build` (runs `tsc && vite build && tsc` — type-checks, bundles with Vite as a library, then emits declarations)
- **Dev server:** `pnpm dev` (Vite dev server with `index.html` + `index.ts` as entry)
- **Test:** `pnpm test` (Jest with ts-jest)
- **Test single file:** `pnpm test -- path/to/file.test.ts`
- **Test watch:** `pnpm test:watch`

## Architecture

Single-class library in `src/main.ts`. The `UmdImporter` class:
- Uses axios to fetch JS content from URLs
- Executes fetched code via `new Function` with a `with(ctx)` wrapper that provides `exports`, `module`, and `require` to simulate UMD loading
- `umdRequireFactory` resolves `require()` calls by checking external deps first, then previously loaded packages
- Promise-level caching: caches the loading promise (not the result), so concurrent imports of the same URL deduplicate. Failed promises are evicted.

Tests live in `src/__tests__/`. Jest runs with `ts-jest` preset in Node environment.

## Build Output

Vite produces `dist/main.umd.js` (UMD) and `dist/main.mjs` (ESM). TypeScript emits `dist/main.d.ts` declarations. Only `dist/` is published to npm.
