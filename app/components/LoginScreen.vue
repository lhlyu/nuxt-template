<script setup lang="ts">
import { templateConfig } from '#shared/utils/template'

const route = useRoute()
const router = useRouter()
const { fetch: refreshSession } = useUserSession()
const isRedirecting = ref(false)
const authError = computed(() => {
    if (route.query.auth_error === 'forbidden') return '当前 GitHub 账号没有访问权限'
    return route.query.auth_error ? '未能完成 GitHub 授权，请重试' : ''
})

async function dismissError() {
    const { auth_error: _error, ...query } = route.query
    await router.replace({ path: '/', query })
}

// 从 bfcache 恢复时重新确认会话，普通加载复用已有会话结果。
useEventListener('pageshow', (event) => {
    isRedirecting.value = false
    if (event.persisted) void refreshSession()
})
</script>

<template>
    <section
        class="mx-auto w-[calc(100%-3rem)] max-w-[360px] py-10"
        aria-labelledby="login-heading"
    >
        <div
            class="rounded-2xl border border-neutral-200 bg-white px-7 pb-6 pt-7 text-center shadow-sm"
        >
            <img
                src="/logo.svg"
                alt=""
                width="72"
                height="72"
                class="mx-auto size-[72px] rounded-2xl object-cover"
                aria-hidden="true"
            />
            <h1
                id="login-heading"
                class="mt-4 text-2xl font-semibold"
            >
                {{ templateConfig.name }}
            </h1>
            <p class="mt-3 text-sm leading-relaxed text-neutral-600">
                登录你的工作空间，开始构建新项目
            </p>

            <div
                v-if="authError"
                class="my-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-700"
                role="alert"
            >
                <p>{{ authError }}</p>
                <button
                    class="mt-1.5 rounded-sm underline underline-offset-2"
                    type="button"
                    @click="dismissError"
                >
                    关闭提示
                </button>
            </div>

            <a
                class="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-transparent bg-neutral-900 px-4 py-2.5 text-sm font-medium leading-normal text-white shadow-sm transition-[background,box-shadow] duration-150 hover:bg-neutral-800 hover:shadow-md aria-disabled:cursor-wait aria-disabled:opacity-60 motion-reduce:transition-none"
                href="/api/auth/github"
                :aria-disabled="isRedirecting"
                @click="isRedirecting ? $event.preventDefault() : (isRedirecting = true)"
            >
                <Icon
                    :name="isRedirecting ? 'lucide:loader-circle' : 'lucide:github'"
                    class="shrink-0 motion-reduce:animate-none"
                    :class="{ 'animate-spin': isRedirecting }"
                    :size="18"
                />
                {{ isRedirecting ? '正在前往 GitHub…' : '使用 GitHub 继续' }}
            </a>

            <p class="mt-4 text-sm leading-relaxed text-neutral-600">
                仅使用公开资料，不申请邮箱或仓库权限
            </p>
        </div>
    </section>
</template>
