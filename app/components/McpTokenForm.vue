<script setup lang="ts">
import type { McpTokenDays } from '#shared/utils/template'

import { defaultMcpTokenDays, mcpTokenDays } from '#shared/utils/template'

const props = defineProps<{ tokenEnvVar: string; tokenCommand: string }>()
const days = ref<McpTokenDays>(defaultMcpTokenDays)
const generating = ref(false)
const error = ref('')
let controller: AbortController | undefined

function requestToken(signal: AbortSignal) {
    return $fetch('/api/mcp-token', { method: 'POST', body: { days: days.value }, signal })
}
const result = shallowRef<Awaited<ReturnType<typeof requestToken>> | null>(null)
const command = computed(() =>
    result.value
        ? [`export ${props.tokenEnvVar}=${result.value.token}`, props.tokenCommand].join('\n')
        : '',
)
const expiresLabel = computed(() =>
    result.value
        ? new Date(result.value.expiresAt).toLocaleString('zh-CN', {
              dateStyle: 'medium',
              timeStyle: 'short',
          })
        : '',
)

onBeforeUnmount(() => {
    controller?.abort()
    result.value = null
})

function errorMessage(cause: unknown) {
    if (cause && typeof cause === 'object' && 'data' in cause) {
        const data = cause.data
        if (
            data &&
            typeof data === 'object' &&
            'message' in data &&
            typeof data.message === 'string'
        )
            return data.message
    }
    return '生成令牌失败，请稍后重试'
}
async function generate() {
    if (generating.value) return
    controller = new AbortController()
    const { signal } = controller
    generating.value = true
    error.value = ''
    result.value = null
    try {
        const response = await requestToken(signal)
        if (!signal.aborted) result.value = response
    } catch (cause) {
        if (!signal.aborted) error.value = errorMessage(cause)
    } finally {
        if (!signal.aborted) generating.value = false
    }
}
</script>

<template>
    <form
        class="mt-5 border-t border-neutral-200 pt-5"
        aria-labelledby="mcp-token-heading"
        @submit.prevent="generate"
    >
        <h3
            id="mcp-token-heading"
            class="font-medium"
        >
            方式 B · 访问令牌
        </h3>
        <p class="mt-1.5 leading-6 text-neutral-600">
            生成一个固定期限的令牌，写入本机环境变量后启动 Pi。
        </p>
        <div class="mt-2 flex flex-wrap items-end gap-2">
            <fieldset :disabled="generating">
                <legend class="mb-1 text-neutral-600">有效期</legend>
                <div class="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
                    <button
                        v-for="day in mcpTokenDays"
                        :key="day"
                        type="button"
                        :aria-pressed="days === day"
                        class="min-h-8 rounded-md px-2.5 disabled:opacity-40"
                        :class="
                            days === day
                                ? 'bg-white font-medium text-neutral-900 shadow-sm'
                                : 'text-neutral-600 hover:text-neutral-900'
                        "
                        @click="days = day"
                    >
                        {{ day }} 天
                    </button>
                </div>
            </fieldset>
            <button
                type="submit"
                :disabled="generating"
                class="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-neutral-900 px-3 text-white enabled:hover:bg-neutral-800 disabled:opacity-40"
            >
                <Icon
                    :name="generating ? 'lucide:loader-circle' : 'lucide:key-round'"
                    :size="14"
                    :class="{ 'animate-spin motion-reduce:animate-none': generating }"
                />{{ generating ? '生成中…' : '生成令牌' }}
            </button>
        </div>
        <p
            v-if="error"
            role="alert"
            class="mt-2 leading-6 text-red-700"
        >
            {{ error }}
        </p>
        <div
            v-if="result"
            class="mt-3 space-y-2"
        >
            <p class="leading-6 text-neutral-600">
                令牌只显示一次，有效期至 {{ expiresLabel }}，请立即复制并保存在本机。
            </p>
            <McpCopyField
                label="令牌"
                :text="result.token"
            />
            <McpCopyField
                label="接入命令"
                :text="command"
            />
        </div>
    </form>
</template>
