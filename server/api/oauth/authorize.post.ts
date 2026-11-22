import { z } from 'zod'

import { MAX_SIGNED_TOKEN_LENGTH } from '../../utils/signed-token'

const decisionSchema = z.object({
    csrf: z.string().min(1).max(MAX_SIGNED_TOKEN_LENGTH),
    decision: z.enum(['allow', 'deny']),
})

export default defineEventHandler(async (event) => {
    setHeader(event, 'Cache-Control', 'no-store')
    const body = await readBody<unknown>(event, { strict: false })
    const submission = decisionSchema.safeParse(body)
    if (!submission.success)
        return renderOAuthPage(event, 400, '授权请求无效', INVALID_AUTHORIZATION_REQUEST)
    const authorization = await verifyAuthorizationRequest(event, body)
    if (!authorization)
        return renderOAuthPage(event, 400, '授权请求无效', INVALID_AUTHORIZATION_REQUEST)
    const { request, state } = authorization
    const { csrf, decision } = submission.data

    const session = await getUserSession(event)
    const account = session.user
    if (!account)
        return renderOAuthPage(
            event,
            401,
            '需要登录',
            '<p style="margin:0;color:#555">登录状态已失效，请重新打开客户端的授权链接。</p>',
        )
    if (!isGitHubUserAllowed(account.login))
        return renderOAuthPage(
            event,
            403,
            '账号不在白名单',
            '<p style="margin:0;color:#555">该 GitHub 账号不在本站白名单内，无法授权。</p>',
        )

    const user = await claimCsrfToken(event, csrf, request)
    if (!user || user.id !== account.id || user.login !== account.login)
        return renderOAuthPage(
            event,
            400,
            '授权已失效',
            '<p style="margin:0;color:#555">同意操作已过期或已使用，请回到客户端重新发起授权。</p>',
        )

    const target = new URL(request.redirectUri)
    if (decision === 'allow') {
        target.searchParams.set('code', await signAuthorizationCode(event, { ...request, user }))
    } else {
        // 拒绝也必须回到已校验的回调地址，客户端才能展示原因。
        target.searchParams.set('error', 'access_denied')
    }
    if (state) target.searchParams.set('state', state)
    return sendRedirect(event, target.href, 303)
})
