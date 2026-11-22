import { defineMcpHandler } from '@nuxtjs/mcp-toolkit/server'

export default defineMcpHandler({
    // 硬授权：MCP 请求必须携带静态令牌或 OAuth 访问令牌，否则在进入工具前返回 401。
    middleware: async (event) => {
        event.context.mcpUser = await requireMcpUser(event)
    },
})
