import type { McpUser } from '#shared/types/mcp'

declare module 'h3' {
    interface H3EventContext {
        mcpUser?: McpUser
    }
}

export {}
