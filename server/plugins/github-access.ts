export default defineNitroPlugin(() => {
    // SSR 和客户端获取会话时重新校验，防止被移出白名单的旧会话继续访问。
    sessionHooks.hook('fetch', async (session, event) => {
        if (session.user) {
            await assertGitHubUserAllowed(event, session.user.login)
        }
    })
})
