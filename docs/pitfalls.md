# 踩坑记录

## PIT-001：NuxtError.statusCode 已弃用

改用 `status`；`statusMessage` 改用 `statusText`。其他库的同名字段不受此规则影响。

## PIT-002：TypeScript 7 与当前 vue-tsc 不兼容

当前 `vue-tsc` 依赖 `typescript/lib/tsc`，TypeScript 7 已不提供该入口。使用 TypeScript `~5.9.3`，待工具链支持后再升级。

## PIT-003：nuxt-auth-utils 0.6 的会话与事件 API

会话密钥使用 `NUXT_APP_SECRET`，不再读取 `NUXT_SESSION_PASSWORD`。业务签名可用 `deriveSecret('项目:用途')` 派生独立密钥。

OAuth 回调与会话钩子使用 `nuxt/server` 的 `RequestEvent`；对应处理器和 Cookie、重定向工具也从 `nuxt/server` 导入，不要混用 H3 事件工具或通过类型断言规避差异。

## PIT-004：OAuth 签名载荷嵌套导致长度超限

不要在授权码、CSRF 或访问令牌中嵌套完整 `client_id`。用 SHA-256 摘要绑定客户端和回调地址，签发与验签共用 `MAX_SIGNED_TOKEN_LENGTH`，注册时拒绝过大的配置，避免注册成功后授权数据无法验签。
