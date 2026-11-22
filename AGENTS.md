# 项目协作规则

## 设计原则

- 你是本代码库的负责人和长期维护者，应在用户需求与本文件约定的范围内，自主决定架构与实现方案，并对代码质量和长期可维护性负责。
- 遵循 KISS 原则，选择简单、成熟、可维护的方案，降低未来开发成本；不因编码工作量牺牲设计质量，不引入技术债。
- 保持统一架构和单一真相源（SSOT）：写入口唯一，其他位置派生或复用；类型定义统一，采用适度的强类型。
- 先阅读代码，优先复用和改造现有实现；需要引入外部能力时，优先使用成熟第三方库。
- 结构性问题通过重构解决，替换实现后删除旧代码，避免架构分叉、补丁和特例绕过；修改聚焦需求，不做过度兜底。除非特别要求，不保留兼容逻辑和历史包袱。
- 将复杂度封装在组件内部，只暴露调用方必需的生命周期和 API。
- 如实报告实现和验证结果，不以表面通过代替实际解决问题。

## 工作流程

- 禁止读取 `.env` 文件内容，禁止编写测试。
- 开发及审查前查阅 [踩坑记录](./docs/pitfalls.md)。
- 使用 Bun 管理依赖和执行命令。
- 修改后运行 `bun run lint` 和 `bun run build`；涉及登录、会话或鉴权逻辑时，验证相关接口行为。
- 检查相关 API 的编辑器提示和当前安装版本的类型声明；类型检查、Lint 和构建通过不能替代弃用检查。

## 项目约定

- 使用 Nuxt 4、Vue 3、TypeScript、Tailwind CSS 和 `nuxt-auth-utils`。TypeScript 暂使用 `~5.9.3`，升级前确认 `vue-tsc` 兼容性，详见 [PIT-002](./docs/pitfalls.md#pit-002typescript-7-与当前-vue-tsc-不兼容)。
- 站点和 MCP 公共配置统一维护在 `shared/utils/template.ts`；接入地址和命令统一由 `server/utils/site-url.ts` 生成。签名命名空间独立于显示名称，不随项目改名而修改。
- 页面样式使用 Tailwind 默认工具类和色阶；全局 CSS 仅保留 Tailwind 指令，基础外观在 `app/app.vue` 设置。不预置自定义主题变量、字体或全局样式覆盖。
- 图标使用 `@nuxt/icon`，在 `nuxt.config.ts` 的 `icon.clientBundle.icons` 中显式维护；关闭自动扫描（`scan: false`）和 API 加载（`provider: 'none'`、`serverBundle: false`）。新增或替换图标时同步更新列表，动态切换须列出所有可能值；删除列表项前确认项目内已无引用。
- 登录后的页面使用 `app/layouts/workspace.vue`，通过 `definePageMeta({ title })` 提供标题；侧边栏、MCP 弹窗和主内容区域由布局统一管理。
- `nuxt-auth-utils` 会话密钥使用 `NUXT_APP_SECRET`；OAuth 回调和会话钩子按 `nuxt/server` 的 `RequestEvent` 类型处理，详见 [PIT-003](./docs/pitfalls.md#pit-003nuxt-auth-utils-06-的会话与事件-api)。
- OAuth 签名数据用摘要绑定客户端和回调地址，不嵌套完整 `client_id`；签发与验签共用长度上限，详见 [PIT-004](./docs/pitfalls.md#pit-004oauth-签名载荷嵌套导致长度超限)。

## API 与踩坑记录

- 不得新增已标记 `@deprecated` 且已有替代项的 API 用法，以当前安装版本的类型声明和实现为准；不得通过类型断言、忽略诊断或读取旧字段作为回退来规避弃用提示。
- 本项目 `useFetch` 返回的 `NuxtError` 使用 `status` 和 `statusText`，禁止使用已弃用的 `statusCode` 和 `statusMessage`。先确认对象类型，不机械替换 H3、Nitro、Node HTTP 或其他库中仍合法的同名字段，详见 [PIT-001](./docs/pitfalls.md#pit-001nuxterrorstatuscode-已弃用)。
- 踩坑记录只写问题、正确用法和必要注意事项；长期规则同步更新本文件。
