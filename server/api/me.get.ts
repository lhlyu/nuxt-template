export default defineEventHandler(async (event) => {
    setHeader(event, 'Cache-Control', 'no-store')
    const { user } = await requireAllowedUserSession(event)
    return { user }
})
