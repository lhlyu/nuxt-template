import type { H3Event } from 'h3'
import type { RequestEvent } from 'nuxt/server'

import { createError, useRuntimeConfig } from 'nuxt/server'

type AuthEvent = H3Event | RequestEvent

export function isGitHubLoginAllowed(login: string | undefined, allowedUsers: string) {
    const normalizedLogin = login?.trim().toLowerCase()
    if (!normalizedLogin) return false
    return allowedUsers.split(',').some((entry) => entry.trim().toLowerCase() === normalizedLogin)
}

export function isGitHubUserAllowed(login: string | undefined) {
    return isGitHubLoginAllowed(login, useRuntimeConfig().githubAllowedUsers)
}

export async function assertGitHubUserAllowed(event: AuthEvent, login: string | undefined) {
    if (isGitHubUserAllowed(login)) return
    await clearUserSession(event)
    throw createError({ status: 403, message: 'GitHub account is not allowed' })
}

export async function requireAllowedUserSession(event: AuthEvent) {
    const session = await requireUserSession(event)
    await assertGitHubUserAllowed(event, session.user.login)
    return session
}
