import {
    defineEventHandler,
    deleteCookie,
    getCookie,
    getQuery,
    sendRedirect,
    setCookie,
} from 'nuxt/server'

const REDIRECT_COOKIE = 'nuxt_template_auth_redirect'

/** 只接受站内相对路径，避免开放重定向。 */
function safeRedirect(value: string | undefined) {
    if (!value || value.length > 2048) return '/'
    if (!value.startsWith('/') || value.startsWith('//')) return '/'
    if (/[\\\s]/.test(value)) return '/'
    return value
}

const githubOAuth = defineOAuthGitHubEventHandler({
    // 登录只需公开身份，不请求邮箱或仓库访问权限。
    config: { scope: [] },
    async onSuccess(event, { user }) {
        if (!isGitHubUserAllowed(user.login)) {
            await clearUserSession(event)
            return sendRedirect(event, '/?auth_error=forbidden')
        }

        // 白名单字段；不持久化 access_token，也不向客户端暴露它。
        await replaceUserSession(event, {
            user: {
                id: user.id,
                login: user.login,
                name: user.name || user.login,
                avatarUrl: user.avatar_url,
            },
        })
        const target = safeRedirect(getCookie(event, REDIRECT_COOKIE))
        deleteCookie(event, REDIRECT_COOKIE, { path: '/' })
        return sendRedirect(event, target)
    },
    onError(event) {
        return sendRedirect(event, '/?auth_error=github')
    },
})

export default defineEventHandler(async (event) => {
    const redirect = getQuery(event).redirect
    if (typeof redirect === 'string' && safeRedirect(redirect) !== '/')
        setCookie(event, REDIRECT_COOKIE, redirect, {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 600,
        })
    try {
        // 同时捕获网络异常；provider 的 onError 并不涵盖所有 fetch 失败。
        return await githubOAuth(event)
    } catch {
        return sendRedirect(event, '/?auth_error=github')
    }
})
