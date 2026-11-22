import { defaultMcpTokenDays, isMcpTokenDays, mcpTokenDays } from '#shared/utils/template'

export default defineEventHandler(async (event) => {
    setHeader(event, 'Cache-Control', 'no-store')
    // 拒绝跨站表单和脚本，不能仅依赖 SameSite Cookie。
    const origin = getHeader(event, 'origin')
    if (
        !origin ||
        origin !== getRequestURL(event).origin ||
        getHeader(event, 'sec-fetch-site') === 'cross-site'
    )
        throw createError({ statusCode: 403, message: '不允许跨站提交' })
    const { user } = await requireAllowedUserSession(event)
    const body = await readBody<{ days?: unknown }>(event)
    const days = body?.days ?? defaultMcpTokenDays
    if (!isMcpTokenDays(days))
        throw createError({
            statusCode: 400,
            message: `有效期只能是 ${mcpTokenDays.join('、')} 天`,
        })
    // 与服务发现、接入命令使用同一站点地址校验。
    requireSiteUrl(event)
    return signMcpToken(event, user, days)
})
