// 动态注册是匿名端点，按 IP 做轻量限流，避免被刷出大量 client_id。
const registrations = new Map<string, { count: number; expires: number }>()
const WINDOW_MS = 10 * 60_000
const MAX_PER_WINDOW = 30

function limitRegistrations(key: string) {
    const now = Date.now()
    for (const [id, entry] of registrations) if (entry.expires <= now) registrations.delete(id)
    const entry = registrations.get(key) || { count: 0, expires: now + WINDOW_MS }
    if (entry.count >= MAX_PER_WINDOW) return false
    entry.count += 1
    registrations.set(key, entry)
    return true
}

export default defineEventHandler(async (event) => {
    setHeader(event, 'Cache-Control', 'no-store')
    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
    if (!limitRegistrations(ip))
        return oauthError(event, 429, 'temporarily_unavailable', '注册过于频繁，请稍后再试')
    const parsed = await readBody<unknown>(event, { strict: false })
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        return oauthError(event, 400, 'invalid_client_metadata', '请求体必须是 JSON')
    const body = parsed as Record<string, unknown>
    const requested = body.redirect_uris
    if (!Array.isArray(requested) || !requested.length || requested.length > MAX_REDIRECT_URIS)
        return oauthError(
            event,
            400,
            'invalid_redirect_uri',
            `redirect_uris 必须包含 1 到 ${MAX_REDIRECT_URIS} 个地址`,
        )
    const redirectUris: string[] = []
    for (const value of requested) {
        if (typeof value !== 'string' || !isAllowedRedirectUri(value))
            return oauthError(
                event,
                400,
                'invalid_redirect_uri',
                '回调地址必须是 https，或本机 http://127.0.0.1 与 http://localhost',
            )
        redirectUris.push(value)
    }
    const requestedName = readString(body.client_name).trim()
    const name = requestedName ? requestedName.slice(0, MAX_CLIENT_NAME_LENGTH) : 'MCP 客户端'
    // client_id 是自签名串，后续授权与换令牌都靠它校验回调地址，不需要落库。
    const clientId = await signClientId(event, { name, redirectUris })
    if (!clientId)
        return oauthError(
            event,
            400,
            'invalid_client_metadata',
            '客户端配置过长，请减少或缩短回调地址',
        )
    setResponseStatus(event, 201)
    return {
        client_id: clientId,
        client_id_issued_at: Math.floor(Date.now() / 1000),
        client_name: name,
        redirect_uris: redirectUris,
        token_endpoint_auth_method: 'none',
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
    }
})
