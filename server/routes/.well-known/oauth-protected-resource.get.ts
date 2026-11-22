import { templateConfig } from '#shared/utils/template'

export default defineEventHandler((event) => {
    setHeader(event, 'Cache-Control', 'no-store')
    const site = requireSiteUrl(event)
    return {
        resource: `${site}${templateConfig.mcp.route}`,
        authorization_servers: [site],
        bearer_methods_supported: ['header'],
        scopes_supported: [templateConfig.mcp.scope],
    }
})
