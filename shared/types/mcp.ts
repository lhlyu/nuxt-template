import type { User } from '#auth-utils'

export type McpUser = Pick<User, 'id' | 'login' | 'name'>
