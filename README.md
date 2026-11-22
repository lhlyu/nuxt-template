# Nuxt Template

基于 Nuxt 4、Vue 3、TypeScript 和 Tailwind CSS 的应用模板，内置 GitHub 白名单登录、会话管理、响应式侧边栏，以及支持 OAuth 和访问令牌的 MCP 接入示例。

## 本地开发

```sh
bun install
bun run dev
```

启动前，将 `.env.example` 复制为 `.env`，填写 GitHub OAuth 配置、允许登录的用户名和应用密钥。可用配置如下：

| 变量                              | 说明                                                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `NUXT_APP_SECRET`                 | 应用密钥，用于派生会话加密密钥，至少 32 个字符，可使用 `openssl rand -hex 32` 生成                                                         |
| `NUXT_OAUTH_GITHUB_CLIENT_ID`     | GitHub OAuth App 的 Client ID                                                                                                              |
| `NUXT_OAUTH_GITHUB_CLIENT_SECRET` | GitHub OAuth App 的 Client Secret                                                                                                          |
| `NUXT_GITHUB_ALLOWED_USERS`       | 允许登录的 GitHub 用户名，以英文逗号分隔；留空时不允许任何账号登录                                                                         |
| `NUXT_OAUTH_GITHUB_REDIRECT_URL`  | GitHub OAuth 回调地址，本地为 `http://localhost:3000/api/auth/github`                                                                      |
| `NUXT_PUBLIC_SITE_URL`            | 对外站点源地址（不含路径、查询参数或凭据），本地为 `http://localhost:3000`，生产使用 HTTPS；留空时按请求源地址解析，显式配置错误时返回错误 |
| `NUXT_MCP_TOKEN_SECRET`           | 可选，MCP/OAuth 签名密钥；留空时从应用密钥派生                                                                                             |

在 GitHub OAuth App 中将 Authorization callback URL 设置为相同的回调地址。登录仅使用公开资料，不申请邮箱或仓库权限。

## 开发命令

| 命令              | 用途                |
| ----------------- | ------------------- |
| `bun run dev`     | 启动开发服务器      |
| `bun run lint`    | 运行类型检查和 Lint |
| `bun run fmt`     | 格式化代码          |
| `bun run build`   | 构建生产版本        |
| `bun run preview` | 预览生产版本        |

## 项目结构

- `app/pages/index.vue`：首页入口，根据会话状态展示登录页或工作空间。
- `app/layouts/workspace.vue`：登录后的工作空间布局，统一侧边栏、顶栏、跳转链接和 MCP 弹窗。
- `app/components/`：登录页、模板欢迎内容、用户菜单、MCP 接入弹窗、令牌表单和复制字段。
- `server/api/auth/`：GitHub OAuth 登录。
- `server/api/me.get.ts`：获取当前登录用户。
- `server/api/mcp.get.ts`：获取按统一站点地址生成的 MCP 接入信息。
- `server/api/health.get.ts`：需登录并通过白名单校验的健康检查，返回 `{ "status": "ok" }`。
- `server/api/oauth/`：MCP 客户端注册、授权与令牌交换。
- `server/mcp/`：MCP 授权中间件和工具示例。
- `server/utils/`：白名单校验、令牌签名及 OAuth 公共逻辑；`oauth-server.ts` 负责授权参数校验和签发，`oauth-response.ts` 负责 HTML 与错误响应。
- `server/types/`：服务端请求上下文类型，MCP 中间件写入 `event.context.mcpUser`，工具按同一类型读取。
- `shared/types/`：共享类型声明。
- `shared/utils/template.ts`：站点名称、描述、MCP 元信息、路径、权限范围、令牌环境变量和有效期的统一配置。

## 模板定制

项目默认名称为 `Nuxt Template`。创建新项目后，修改 `package.json` 中的包名，以及 `shared/utils/template.ts` 中的公共配置；页面标题、品牌文案、MCP 接入命令和授权页会复用这些配置。站点图标位于 `public/logo.svg`。

样式使用 Tailwind 默认工具类和色阶，不预置自定义主题配置。`app/assets/css/tailwind.css` 仅保留 Tailwind 指令，应用基础背景、字体和字号在 `app/app.vue` 设置。

新增登录后业务页面时使用 `definePageMeta({ layout: 'workspace', title: '页面标题' })`；布局统一管理视口高度、内容滚动、侧边栏和标题。模板欢迎内容位于 `app/components/HomeScreen.vue`；MCP 工具可参考 `server/mcp/tools/get-current-user.ts`。`server/utils/site-url.ts` 统一解析对外地址并生成接入信息，前端通过 `/api/mcp` 获取。

签名命名空间在 `server/utils/signed-token.ts` 中单独固定，修改显示名称不会影响它。令牌使用 Zod 校验载荷类型，OAuth 令牌绑定客户端标识的 SHA-256 摘要，授权码和 CSRF 数据同时绑定回调地址摘要，避免嵌套完整客户端配置或回调地址。签发与验签使用相同的长度上限，过大的注册配置会在入口被拒绝。

## MCP 接入

服务路径为 `/mcp`，支持 OAuth 或固定期限的访问令牌。以下命令以本地开发地址为例，部署后替换为实际站点地址。

### OAuth

```sh
pi mcp add nuxt-template --url http://localhost:3000/mcp
```

然后在 Pi 中执行 `/mcp login nuxt-template`，在浏览器登录并完成授权。

### 访问令牌

登录后，打开侧边栏底部用户菜单 → **MCP 接入**，选择有效期（7 / 30 / 90 天）并生成令牌。将令牌保存至本机环境变量：

```sh
export NUXT_TEMPLATE_MCP_TOKEN='替换为生成的令牌'
pi mcp add nuxt-template --url http://localhost:3000/mcp --bearer-token-env-var NUXT_TEMPLATE_MCP_TOKEN
```

### 示例工具

`get-current-user` 无需参数，返回当前授权用户的 `id`、`login` 和 `name`。OAuth 权限范围为 `mcp`。

访问令牌允许客户端以对应账号访问 MCP 工具，请妥善保管。轮换签名密钥会使已签发的令牌和 OAuth 签名数据失效。授权码与 CSRF 防重放记录保存在进程内存中，多实例部署时需要共享存储。
