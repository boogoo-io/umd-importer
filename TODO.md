# TODO

## CJS 模拟不完整

- [x] **`exports` 重新赋值无法捕获** — `module.exports === exports` 链接已实现（line 67-70），与真实 CJS 行为一致：`exports = {...}` 在 Node.js 中同样无效，正确做法是 `module.exports = {...}` 或属性赋值。
- [x] **`module` 对象缺少 `exports` 属性初始化** — `src/main.ts:67` 中 `module: {}` 应为 `module: { exports: {} }`，与 `exports` 指向同一引用。
- [x] **`sourceURL` 写死为字面量** — `src/main.ts:63` 中 `//# sourceURL=[module]` 应替换为动态包名，否则 DevTools 中所有模块显示相同名称。

## 缓存策略

- [x] **缓存 key 是包名而非 URL** — `import()` 方法中缓存以 `packageName` 为 key，不同 URL 但同包名会碰撞缓存，应改为 URL 作为 key。
- [x] **缺少请求超时** — `src/main.ts:56` 中 `axios.get(url)` 无 timeout 配置，挂起的请求会永久阻塞。

## 安全与健壮性

- [x] **无响应大小限制** — 可能下载超大文件耗尽内存。
- [x] **无 URL 校验** — 无协议/域名/路径合法性检查。
- [x] **`eval()` 无沙箱保护** — 已通过在 `ctx` 中添加 `window`, `document`, `fetch` 等危险全局变量的 `undefined` 影子来处理。

## 依赖解析

- [x] **`umdRequireFactory` 重复检查** — `src/main.ts:76-77` 中 `this.external[depName] || this.external[depName]` 写了两次，疑似笔误。
- [x] **无循环依赖检测** — A `require('B')` + B `require('A')` 会导致无限递归。
- [x] **`require` 不会自动 fetch** — 已添加 `dependencyMap` 选项映射依赖名到 URL；`loadPackage` 执行前提取 `require()` 调用并预加载已注册的依赖。

## API 缺失

- [x] **`allPackages` 无法清理/重置** — 没有 `unload()` 或 `clear()` 方法，加载的包永远留存在内存中。
- [x] **返回值是内部引用** — 调用方修改返回值会污染已缓存的模块。

## 其他

- [x] **URL 包名提取不支持 query/hash** — `getName()` 只做简单的 `split('.')[0]`，对 `?ver=1`、`#hash` 等 URL 不健壮。
- [x] **ESM 模块不支持** — `eval()` 无法解析 `import`/`export`，遇到 ESM 链接会抛 `SyntaxError`。
