export const templateConfig = {
    name: 'Nuxt Template',
    description: '基于 Nuxt、Vue 和 TypeScript 的应用模板。',
    mcp: {
        name: 'nuxt-template',
        version: '1.0.0',
        description: 'Nuxt 模板项目，提供 GitHub 登录和 MCP 接入示例。',
        instructions: '调用 get-current-user 获取当前授权用户的基本资料。',
        route: '/mcp',
        scope: 'mcp',
        tokenEnvVar: 'NUXT_TEMPLATE_MCP_TOKEN',
    },
} as const

export const mcpTokenDays = [7, 30, 90] as const
export const defaultMcpTokenDays = 30 satisfies (typeof mcpTokenDays)[number]
export type McpTokenDays = (typeof mcpTokenDays)[number]

export function isMcpTokenDays(value: unknown): value is McpTokenDays {
    return mcpTokenDays.some((days) => days === value)
}
