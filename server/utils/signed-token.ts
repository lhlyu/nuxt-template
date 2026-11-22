import type { H3Event } from 'h3'

import { Buffer } from 'node:buffer'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { deriveSecret } from 'nuxt/server'
import { z } from 'zod'

import type { McpUser } from '#shared/types/mcp'

// 与显示名称分离；修改它会使所有已签发的数据失效。
const TOKEN_NAMESPACE = 'nuxt-template'
export const MAX_SIGNED_TOKEN_LENGTH = 4096
export const tokenPrefixes = { access: 'nta_', refresh: 'ntr_', static: 'ntk_' } as const

const userSchema = z.object({
    id: z.number().int().positive(),
    login: z.string().min(1).max(39),
    name: z.string().min(1).max(256),
}) satisfies z.ZodType<McpUser>
const expires = { exp: z.number().int().positive() }
const bindingHash = z.string().regex(/^[a-f0-9]{64}$/)
const clientBinding = { clientIdHash: bindingHash }
const grant = {
    ...clientBinding,
    user: userSchema,
    redirectUriHash: bindingHash,
    codeChallenge: z.string(),
}

export const tokenSchemas = {
    client: z.object({
        kind: z.literal('oauth-client'),
        ...expires,
        name: z.string(),
        redirectUris: z.array(z.string()),
    }),
    code: z.object({ kind: z.literal('oauth-code'), ...expires, ...grant }),
    csrf: z.object({ kind: z.literal('oauth-csrf'), ...expires, ...grant }),
    access: z.object({
        kind: z.literal('mcp-access'),
        ...expires,
        ...clientBinding,
        user: userSchema,
    }),
    refresh: z.object({
        kind: z.literal('mcp-refresh'),
        ...expires,
        ...clientBinding,
        user: userSchema,
    }),
    static: z.object({ kind: z.literal('mcp-token'), ...expires, user: userSchema }),
}
const signedPayloadSchema = z.discriminatedUnion('kind', [
    tokenSchemas.client,
    tokenSchemas.code,
    tokenSchemas.csrf,
    tokenSchemas.access,
    tokenSchemas.refresh,
    tokenSchemas.static,
])
type SignedPayload = z.infer<typeof signedPayloadSchema>

async function signingKey(event: H3Event) {
    const configured = useRuntimeConfig(event).mcpTokenSecret
    if (configured && configured.length < 16)
        throw createError({ statusCode: 503, message: 'MCP 签名密钥至少需要 16 个字符' })
    return configured || (await deriveSecret(`${TOKEN_NAMESPACE}:mcp`))
}

function encodedPayload(payload: SignedPayload) {
    return Buffer.from(JSON.stringify(signedPayloadSchema.parse(payload))).toString('base64url')
}

export function signedPayloadFits(payload: SignedPayload) {
    // SHA-256 签名经 base64url 编码后固定为 43 个字符，再加分隔符。
    return encodedPayload(payload).length + 44 <= MAX_SIGNED_TOKEN_LENGTH
}

export async function signPayload(event: H3Event, payload: SignedPayload) {
    const body = encodedPayload(payload)
    if (body.length + 44 > MAX_SIGNED_TOKEN_LENGTH)
        throw createError({ statusCode: 400, message: '授权数据过长，请缩短客户端名称或回调地址' })
    const signature = createHmac('sha256', await signingKey(event))
        .update(`${TOKEN_NAMESPACE}:${body}`)
        .digest('base64url')
    return `${body}.${signature}`
}

export async function verifyPayload<S extends z.ZodType<{ exp: number }>>(
    event: H3Event,
    token: string,
    schema: S,
): Promise<z.output<S> | null> {
    if (!token || token.length > MAX_SIGNED_TOKEN_LENGTH) return null
    const match = /^([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]{43})$/.exec(token)
    if (!match) return null
    const [, body, signature] = match
    if (!body || !signature) return null
    const bytes = Buffer.from(signature, 'base64url')
    // 唯一编码，防止同一签名用不同字符串绕过一次性记录。
    if (bytes.toString('base64url') !== signature) return null
    const expected = createHmac('sha256', await signingKey(event))
        .update(`${TOKEN_NAMESPACE}:${body}`)
        .digest()
    if (bytes.length !== expected.length || !timingSafeEqual(bytes, expected)) return null
    try {
        const result = schema.safeParse(JSON.parse(Buffer.from(body, 'base64url').toString('utf8')))
        if (!result.success || result.data.exp <= Math.floor(Date.now() / 1000)) return null
        return result.data
    } catch {
        return null
    }
}

export function hashBinding(value: string) {
    return createHash('sha256').update(value).digest('hex')
}
