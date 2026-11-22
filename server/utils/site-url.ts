import type { H3Event } from 'h3'

import { templateConfig } from '#shared/utils/template'

/** 站点只支持根路径 HTTPS，或本地回环地址上的 HTTP。显式配置错误时直接报错。 */
export function requireSiteUrl(event: H3Event) {
    const configured = useRuntimeConfig(event).public.siteUrl
    try {
        const url = new URL(configured || getRequestURL(event).origin)
        const localHttp =
            url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
        if (
            (url.protocol !== 'https:' && !localHttp) ||
            url.username ||
            url.password ||
            url.pathname !== '/' ||
            url.search ||
            url.hash
        )
            throw new Error('Invalid site URL')
        return url.origin
    } catch {
        throw createError({
            statusCode: 503,
            message:
                '站点地址无效，请将 NUXT_PUBLIC_SITE_URL 配置为 HTTPS 源地址；本地开发可使用 HTTP 回环地址',
        })
    }
}

export function getMcpConnectionInfo(event: H3Event) {
    const serverUrl = requireSiteUrl(event)
    const { name, route, tokenEnvVar } = templateConfig.mcp
    const command = `pi mcp add ${name} --url ${serverUrl}${route}`
    return {
        serverUrl,
        tokenEnvVar,
        oauthCommand: command,
        tokenCommand: `${command} --bearer-token-env-var ${tokenEnvVar}`,
        loginCommand: `/mcp login ${name}`,
    }
}
