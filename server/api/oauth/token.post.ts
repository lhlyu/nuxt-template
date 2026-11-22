import type { H3Event } from 'h3'

export default defineEventHandler(async (event) => {
    setHeader(event, 'Cache-Control', 'no-store')
    const parsed = await readBody<unknown>(event, { strict: false })
    const body =
        parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : null
    if (!body) return oauthError(event, 400, 'invalid_request', '请求体格式不正确')
    const grantType = readString(body.grant_type)
    if (grantType === 'authorization_code') return exchangeCode(event, body)
    if (grantType === 'refresh_token') return refreshAccessToken(event, body)
    if (!grantType) return oauthError(event, 400, 'invalid_request', '缺少 grant_type')
    return oauthError(
        event,
        400,
        'unsupported_grant_type',
        '仅支持 authorization_code 与 refresh_token',
    )
})

async function exchangeCode(event: H3Event, body: Record<string, unknown>) {
    const code = readString(body.code)
    const clientId = readString(body.client_id)
    const redirectUri = readString(body.redirect_uri)
    const verifier = readString(body.code_verifier)
    if (!code || !clientId || !redirectUri || !verifier)
        return oauthError(
            event,
            400,
            'invalid_request',
            '缺少 code、client_id、redirect_uri 或 code_verifier',
        )
    // 兑换会占用授权码，之后任何校验失败都不能重试。
    const grant = await redeemAuthorizationCode(event, code)
    if (
        !grant ||
        grant.clientIdHash !== hashBinding(clientId) ||
        grant.redirectUriHash !== hashBinding(redirectUri)
    )
        return oauthError(event, 400, 'invalid_grant', '授权码无效、已过期或已被使用')
    if (!(await verifyPkce(verifier, grant.codeChallenge)))
        return oauthError(event, 400, 'invalid_grant', 'PKCE 校验失败')
    if (!isGitHubUserAllowed(grant.user.login))
        return oauthError(event, 400, 'invalid_grant', '该 GitHub 账号已不在白名单内')
    return issueAccessToken(event, grant.user, clientId)
}

async function refreshAccessToken(event: H3Event, body: Record<string, unknown>) {
    const token = readString(body.refresh_token)
    const clientId = readString(body.client_id)
    if (!token.startsWith(tokenPrefixes.refresh))
        return oauthError(event, 400, 'invalid_request', '缺少有效的 refresh_token')
    // 公开客户端也必须声明 client_id（RFC 6749 §9），并需与签发时绑定的一致。
    if (!clientId) return oauthError(event, 400, 'invalid_request', '缺少 client_id')
    const payload = await verifyPayload(
        event,
        token.slice(tokenPrefixes.refresh.length),
        tokenSchemas.refresh,
    )
    if (!payload || payload.clientIdHash !== hashBinding(clientId))
        return oauthError(event, 400, 'invalid_grant', 'refresh_token 无效或已过期')
    const { user } = payload
    if (!isGitHubUserAllowed(user.login))
        return oauthError(event, 400, 'invalid_grant', '该 GitHub 账号已不在白名单内')
    return issueAccessToken(event, user, clientId)
}
