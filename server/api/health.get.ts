export default defineEventHandler(async (event) => {
    setHeader(event, 'Cache-Control', 'no-store')
    await requireAllowedUserSession(event)
    return { status: 'ok' }
})
