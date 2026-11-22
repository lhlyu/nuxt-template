import type { H3Event } from 'h3'

import type { McpUser } from '#shared/types/mcp'
import type { McpTokenDays } from '#shared/utils/template'

import { templateConfig } from '#shared/utils/template'

import {
    hashBinding,
    signPayload,
    tokenPrefixes,
    tokenSchemas,
    verifyPayload,
} from './signed-token'

const ACCESS_TTL = 60 * 60
const REFRESH_TTL = 30 * 24 * 60 * 60

export async function signMcpToken(event: H3Event, user: McpUser, days: McpTokenDays) {
    const expiresAt = Math.floor(Date.now() / 1000) + days * 86_400
    const token = await signPayload(event, { kind: 'mcp-token', user, exp: expiresAt })
    return { token: `${tokenPrefixes.static}${token}`, expiresAt: expiresAt * 1000 }
}

export async function issueAccessToken(event: H3Event, user: McpUser, clientId: string) {
    const now = Math.floor(Date.now() / 1000)
    const clientIdHash = hashBinding(clientId)
    return {
        access_token: `${tokenPrefixes.access}${await signPayload(event, {
            kind: 'mcp-access',
            user,
            clientIdHash,
            exp: now + ACCESS_TTL,
        })}`,
        token_type: 'bearer' as const,
        expires_in: ACCESS_TTL,
        refresh_token: `${tokenPrefixes.refresh}${await signPayload(event, {
            kind: 'mcp-refresh',
            user,
            clientIdHash,
            exp: now + REFRESH_TTL,
        })}`,
        scope: templateConfig.mcp.scope,
    }
}

/** 校验 Bearer 令牌，并在每次请求中复查白名单。 */
export async function requireMcpUser(event: H3Event): Promise<McpUser> {
    const header = getHeader(event, 'authorization') || ''
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
    const payload = token.startsWith(tokenPrefixes.access)
        ? await verifyPayload(event, token.slice(tokenPrefixes.access.length), tokenSchemas.access)
        : token.startsWith(tokenPrefixes.static)
          ? await verifyPayload(
                event,
                token.slice(tokenPrefixes.static.length),
                tokenSchemas.static,
            )
          : null
    if (!payload) {
        setHeader(
            event,
            'WWW-Authenticate',
            `Bearer resource_metadata="${requireSiteUrl(event)}/.well-known/oauth-protected-resource"`,
        )
        throw createError({
            statusCode: 401,
            message: '需要 MCP 授权：请使用 OAuth 登录或提供访问令牌',
        })
    }
    if (!isGitHubUserAllowed(payload.user.login))
        throw createError({ statusCode: 403, message: '该 GitHub 账号已不在白名单内' })
    return payload.user
}
