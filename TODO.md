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

## Bug 修复

- [ ] **`unload()` 不同步清理 `cachedPromise`** — `unload()` 只从 `allPackages` 删除，不清 `cachedPromise`。调用 `unload()` 后再 import 同一个 URL 会因缓存 promise 还在而拿到旧结果。`clear()` 也需要一并检查。

## API 质量

- [ ] **`Options` 接口未导出，`external` 类型为 `any`** — 外部 TypeScript 消费者无法给配置对象做类型标注，`external` 完全丢失类型安全，应至少为 `Record<string, unknown>`。
- [ ] **`packageName === 'index'` 检查存在误伤** — `src/main.ts:36` 对 `index` 的警告对合法命名为 `index` 的库有影响，提示信息可以更清晰。
- [ ] **`with` 语句和 `new Function` 的运行时限制未在 README 说明** — `with` 在严格模式下被禁止，CSP 环境（浏览器扩展、Electron 安全模式）会禁止 `new Function`/`eval`，这些硬限制应在文档中明确告知。

## 代码整洁

- [ ] **`execute()` 有返回值但调用方忽略** — `execute()` 返回 `fn.call(ctx, ctx)`，但 `loadPackage()` 忽略该返回值，改为从 `this.allPackages` 读取。应统一为一种方式。

## 测试覆盖

- [ ] **补充核心路径测试** — 当前仅 5 个用例，以下路径零覆盖：
  - `unload()` / `clear()` 方法
  - `validateUrl()` 错误路径（非法 URL、非 http 协议、无 hostname）
  - ESM 模块警告降级路径
  - 循环依赖检测
  - `cache: false` 路径
  - `debug: false` 日志抑制
  - `sandbox: false` 默认路径（globals 继承行为）
  - `getName()` 的 query/hash 边界情况
  - 并发 import 去重
  - 失败后重试（缓存 eviction）

## 工程化

- [ ] **缺少 ESLint / Prettier** — 无代码规范和格式化工具。
- [ ] **缺少 CI/CD** — 无 `.github/workflows/`，无自动化测试和发布流程。
- [ ] **jest 缺少 coverage 阈值** — `jest.config.js` 未配置 `coverageThreshold`。
- [ ] **缺少 CHANGELOG** — 无版本变更记录。
- [ ] **依赖版本较老** — TypeScript 4.9 → 5.x, Vite 4.1 → 6.x。
- [ ] **`.yarn/` 目录残留** — 项目已迁移到 pnpm，`.yarn/` 可清理。
- [ ] **`.idea/` 被提交到 Git** — IDE 配置文件应在 `.gitignore` 中排除（已有规则但历史提交可能包含）。

## 文档

- [ ] **README 缺少 API 文档** — 无 `Options` 各字段说明、无方法签名列表。用户只能通过示例猜测用法。
