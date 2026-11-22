import { templateConfig } from '#shared/utils/template'

function loginHint(event: { path?: string }) {
    // 登录后回到当前授权页，避免用户再回客户端重开链接。
    const target = event.path || '/api/oauth/authorize'
    return `<p style="margin:0 0 16px;color:#555">需要先登录 GitHub 账号才能授权。</p><p style="margin:0"><a href="/api/auth/github?redirect=${encodeURIComponent(target)}" style="color:#0969da">使用 GitHub 登录</a></p>`
}

export default defineEventHandler(async (event) => {
    setHeader(event, 'Cache-Control', 'no-store')
    const authorization = await verifyAuthorizationRequest(event, getQuery(event))
    if (!authorization)
        return renderOAuthPage(event, 400, '授权请求无效', INVALID_AUTHORIZATION_REQUEST)
    const { client, request, state } = authorization
    const { clientId, redirectUri, codeChallenge } = request

    const session = await getUserSession(event)
    const account = session.user
    if (!account) return renderOAuthPage(event, 200, '需要登录', loginHint(event))
    if (!isGitHubUserAllowed(account.login))
        return renderOAuthPage(
            event,
            403,
            '账号不在白名单',
            '<p style="margin:0;color:#555">该 GitHub 账号不在本站白名单内，无法授权。</p>',
        )

    const csrf = await signCsrfToken(event, {
        ...request,
        user: account,
    })
    const hidden = Object.entries({
        csrf,
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state,
    })
        .map(([name, value]) => `<input type="hidden" name="${name}" value="${escapeHtml(value)}">`)
        .join('\n')
    return renderOAuthPage(
        event,
        200,
        '授权访问',
        `<h1 style="font-size:16px;font-weight:600;margin:0 0 12px">授权访问 ${escapeHtml(templateConfig.name)}</h1>
<p style="margin:0 0 8px">应用 <strong>${escapeHtml(client.name)}</strong> 请求以你的 GitHub 账号（@${escapeHtml(account.login)}）访问 MCP 工具。</p>
<p style="margin:0 0 8px;color:#555">权限：访问 MCP 工具（${templateConfig.mcp.scope}）</p>
<p style="margin:0 0 20px;color:#555;overflow-wrap:anywhere">回调地址：${escapeHtml(redirectUri)}</p>
<form method="post" action="/api/oauth/authorize" style="display:flex;gap:8px">
${hidden}
<button type="submit" name="decision" value="allow" style="padding:6px 16px;border:1px solid #111;border-radius:6px;background:#111;color:#fff;font:inherit;cursor:pointer">允许</button>
<button type="submit" name="decision" value="deny" style="padding:6px 16px;border:1px solid #ccc;border-radius:6px;background:#fff;color:#111;font:inherit;cursor:pointer">拒绝</button>
</form>`,
    )
})
