import type { H3Event } from 'h3'

import { createHash } from 'node:crypto'
import { z } from 'zod'

import type { McpUser } from '#shared/types/mcp'

import {
    hashBinding,
    MAX_SIGNED_TOKEN_LENGTH,
    signPayload,
    signedPayloadFits,
    tokenSchemas,
    verifyPayload,
} from './signed-token'

// 客户端标识、授权码与 CSRF 字段都是 HMAC 签名串，服务端不保存客户端与授权码。
const CLIENT_TTL = 365 * 24 * 60 * 60
const CODE_TTL = 5 * 60
const CSRF_TTL = 10 * 60
const REPLAY_TTL = 10 * 60
const MAX_REDIRECT_URI_LENGTH = 2048
export const MAX_REDIRECT_URIS = 5
export const MAX_CLIENT_NAME_LENGTH = 100
const MAX_OAUTH_STATE_LENGTH = 512

const authorizationRequestSchema = z
    .object({
        client_id: z.string().min(1).max(MAX_SIGNED_TOKEN_LENGTH),
        redirect_uri: z.string().min(1).max(MAX_REDIRECT_URI_LENGTH),
        response_type: z.literal('code'),
        code_challenge_method: z.literal('S256'),
        code_challenge: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
        state: z.string().max(MAX_OAUTH_STATE_LENGTH).default(''),
    })
    .transform(({ client_id, redirect_uri, code_challenge, state }) => ({
        request: {
            clientId: client_id,
            redirectUri: redirect_uri,
            codeChallenge: code_challenge,
        },
        state,
    }))

const usedCodes = new Map<string, number>()
const usedCsrfTokens = new Map<string, number>()

export interface OAuthClient {
    name: string
    redirectUris: string[]
}

export type OAuthAuthorizationRequest = z.output<typeof authorizationRequestSchema>['request']

export interface OAuthAuthorizationCode extends OAuthAuthorizationRequest {
    user: McpUser
}

function now() {
    return Math.floor(Date.now() / 1000)
}

/** 只允许公网 HTTPS，或本机回环地址上的 HTTP 回调。 */
export function isAllowedRedirectUri(value: string) {
    if (!value || value.length > MAX_REDIRECT_URI_LENGTH) return false
    // 回调地址使用已编码的 ASCII URI，避免重定向前后的规范化差异。
    if (!/^[\x21-\x7e]+$/.test(value)) return false
    let url: URL
    try {
        url = new URL(value)
    } catch {
        return false
    }
    if (url.username || url.password || url.hash) return false
    if (url.protocol === 'https:') return true
    return (
        url.protocol === 'http:' && (url.hostname === '127.0.0.1' || url.hostname === 'localhost')
    )
}

export async function verifyPkce(verifier: string, challenge: string) {
    if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(verifier)) return false
    return createHash('sha256').update(verifier).digest('base64url') === challenge
}

/** 一次性标记：内存去重，进程重启后失效，与无状态签名的定位一致。 */
function claimOnce(used: Map<string, number>, key: string, ttl: number) {
    const current = now()
    for (const [value, expires] of used) if (expires <= current) used.delete(value)
    if (used.has(key)) return false
    used.set(key, current + ttl)
    return true
}

export async function signClientId(event: H3Event, client: OAuthClient) {
    const payload = { kind: 'oauth-client' as const, ...client, exp: now() + CLIENT_TTL }
    return signedPayloadFits(payload) ? signPayload(event, payload) : null
}

export async function verifyClient(event: H3Event, clientId: string): Promise<OAuthClient | null> {
    const payload = await verifyPayload(event, clientId, tokenSchemas.client)
    if (
        !payload ||
        !payload.redirectUris.length ||
        payload.redirectUris.length > MAX_REDIRECT_URIS ||
        !payload.redirectUris.every(isAllowedRedirectUri)
    )
        return null
    return { name: payload.name, redirectUris: payload.redirectUris }
}

/** GET 授权页与 POST 同意表单共用参数校验，并校验已签名客户端的回调地址。 */
export async function verifyAuthorizationRequest(event: H3Event, input: unknown) {
    const parsed = authorizationRequestSchema.safeParse(input)
    if (!parsed.success) return null
    const { request, state } = parsed.data
    const client = await verifyClient(event, request.clientId)
    if (!client || !client.redirectUris.includes(request.redirectUri)) return null
    return { client, request, state }
}

function authorizationPayload(grant: OAuthAuthorizationCode) {
    return {
        user: grant.user,
        clientIdHash: hashBinding(grant.clientId),
        redirectUriHash: hashBinding(grant.redirectUri),
        codeChallenge: grant.codeChallenge,
    }
}

export function signAuthorizationCode(event: H3Event, grant: OAuthAuthorizationCode) {
    return signPayload(event, {
        kind: 'oauth-code',
        ...authorizationPayload(grant),
        exp: now() + CODE_TTL,
    })
}

/** 兑换授权码：签名有效就先占用，失败的兑换也不能重试，避免逐个尝试 PKCE。 */
export async function redeemAuthorizationCode(event: H3Event, code: string) {
    const payload = await verifyPayload(event, code, tokenSchemas.code)
    return payload && claimOnce(usedCodes, code, REPLAY_TTL) ? payload : null
}

export function signCsrfToken(event: H3Event, grant: OAuthAuthorizationCode) {
    return signPayload(event, {
        kind: 'oauth-csrf',
        ...authorizationPayload(grant),
        exp: now() + CSRF_TTL,
    })
}

/** 校验同意页表单：签名有效、参数一致、账户一致，且只能提交一次。 */
export async function claimCsrfToken(
    event: H3Event,
    token: string,
    request: OAuthAuthorizationRequest,
): Promise<McpUser | null> {
    const payload = await verifyPayload(event, token, tokenSchemas.csrf)
    if (
        !payload ||
        payload.clientIdHash !== hashBinding(request.clientId) ||
        payload.redirectUriHash !== hashBinding(request.redirectUri) ||
        payload.codeChallenge !== request.codeChallenge
    )
        return null
    return claimOnce(usedCsrfTokens, token, REPLAY_TTL) ? payload.user : null
}

/** 只接受字符串参数，其余（数组、缺失、非字符串）一律视为空。 */
export function readString(value: unknown) {
    return typeof value === 'string' ? value : ''
}
