# TODO

## CJS 模拟不完整

- [ ] **`exports` 重新赋值无法捕获** — `with(ctx)` 中 `exports = {...}` 只会重绑定局部变量，不会修改 `ctx.exports`。需要类似真实 CJS 的 `module.exports === exports` 链接。
- [ ] **`module` 对象缺少 `exports` 属性初始化** — `src/main.ts:67` 中 `module: {}` 应为 `module: { exports: {} }`，与 `exports` 指向同一引用。
- [ ] **`sourceURL` 写死为字面量** — `src/main.ts:63` 中 `//# sourceURL=[module]` 应替换为动态包名，否则 DevTools 中所有模块显示相同名称。

## 缓存策略

- [ ] **缓存 key 是包名而非 URL** — `import()` 方法中缓存以 `packageName` 为 key（`src/main.ts:33,40`），不同 URL 但同包名会碰撞缓存，应改为 URL 作为 key 或增加冲突处理。
- [ ] **缺少请求超时** — `src/main.ts:56` 中 `axios.get(url)` 无 timeout 配置，挂起的请求会永久阻塞。

## 安全与健壮性

- [ ] **无响应大小限制** — 可能下载超大文件耗尽内存。
- [ ] **无 URL 校验** — 无协议/域名/路径合法性检查。
- [ ] **`eval()` 无沙箱保护** — UMD 代码可访问 `window`、`document` 等全部全局变量。

## 依赖解析

- [ ] **`umdRequireFactory` 重复检查** — `src/main.ts:76-77` 中 `this.external[depName] || this.external[depName]` 写了两次，疑似笔误。
- [ ] **无循环依赖检测** — A `require('B')` + B `require('A')` 会导致无限递归。
- [ ] **`require` 不会自动 fetch** — 未加载的依赖直接抛错，不会尝试从网络加载。

## API 缺失

- [ ] **`allPackages` 无法清理/重置** — 没有 `unload()` 或 `clear()` 方法，加载的包永远留存在内存中。
- [ ] **返回值是内部引用** — 调用方修改返回值会污染已缓存的模块。

## 其他

- [ ] **URL 包名提取不支持 query/hash** — `getName()` 只做简单的 `split('.')[0]`，对 `?ver=1`、`#hash` 等 URL 不健壮。
- [ ] **ESM 模块不支持** — `export` 语句在 `eval()` 中是语法错误。
