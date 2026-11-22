import { templateConfig } from '#shared/utils/template'

export default defineEventHandler((event) => {
    setHeader(event, 'Cache-Control', 'no-store')
    const site = requireSiteUrl(event)
    return {
        issuer: site,
        authorization_endpoint: `${site}/api/oauth/authorize`,
        token_endpoint: `${site}/api/oauth/token`,
        registration_endpoint: `${site}/api/oauth/register`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: ['none'],
        scopes_supported: [templateConfig.mcp.scope],
    }
})
