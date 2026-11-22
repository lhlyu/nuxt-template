import { templateConfig } from './shared/utils/template'

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },
    modules: [
        '@nuxt/icon',
        '@vueuse/nuxt',
        '@nuxtjs/tailwindcss',
        'nuxt-auth-utils',
        '@nuxtjs/mcp-toolkit',
    ],
    mcp: {
        name: templateConfig.mcp.name,
        version: templateConfig.mcp.version,
        description: templateConfig.mcp.description,
        instructions: templateConfig.mcp.instructions,
        route: templateConfig.mcp.route,
        sessions: false,
    },
    tailwindcss: {
        cssPath: '~/assets/css/tailwind.css',
    },
    postcss: {
        plugins: {
            'tailwindcss/nesting': false,
        },
    },
    nitro: {
        // MCP 工具内通过 useEvent() 读取 event.context 需要异步上下文。
        experimental: { asyncContext: true },
    },
    runtimeConfig: {
        githubAllowedUsers: '',
        // 留空时从 NUXT_APP_SECRET 派生密钥，用于签名 MCP 令牌与 OAuth 授权码。
        mcpTokenSecret: '',
        public: { siteUrl: '' },
        oauth: {
            github: {
                clientId: '',
                clientSecret: '',
                redirectURL: '',
            },
        },
        session: {
            maxAge: 60 * 60 * 24 * 7,
            cookie: {
                httpOnly: true,
                sameSite: 'lax',
            },
        },
    },
    icon: {
        mode: 'css',
        size: '20px',
        cssLayer: 'base',
        provider: 'none',
        serverBundle: false,
        clientBundle: {
            scan: false,
            icons: [
                'lucide:github',
                'lucide:loader-circle',
                'lucide:log-out',
                'lucide:check',
                'lucide:x',
                'lucide:house',
                'lucide:chevron-down',
                'lucide:panel-left-close',
                'lucide:panel-left-open',
                'lucide:key-round',
                'lucide:copy',
                'lucide:plug',
                'lucide:shield-check',
                'lucide:external-link',
            ],
        },
    },
    app: {
        head: {
            htmlAttrs: {
                lang: 'zh-CN',
            },
            charset: 'utf-8',
            viewport: 'width=device-width, initial-scale=1',
            title: templateConfig.name,
            meta: [{ name: 'description', content: templateConfig.description }],
            link: [{ rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
        },

        rootTag: 'body',
    },
})
