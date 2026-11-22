import { defineMcpTool } from '@nuxtjs/mcp-toolkit/server'

export default defineMcpTool({
    name: 'get-current-user',
    description: '获取当前授权用户的基本资料。',
    inputSchema: {},
    handler: async () => {
        const event = useEvent()
        const user = event.context.mcpUser
        if (!user)
            return {
                isError: true,
                content: [{ type: 'text', text: '当前请求未获得 MCP 授权。' }],
            }
        return {
            content: [{ type: 'text', text: JSON.stringify(user) }],
        }
    },
})
