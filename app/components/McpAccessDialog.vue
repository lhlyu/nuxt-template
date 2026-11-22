<script setup lang="ts">
defineEmits<{ close: [] }>()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const {
    data: connectionInfo,
    error: connectionError,
    status,
    refresh: refreshConnection,
} = useFetch('/api/mcp', { server: false })

onMounted(() => dialog.value?.showModal())
</script>

<template>
    <dialog
        ref="dialog"
        class="fixed inset-0 m-auto max-h-[calc(100svh-32px)] w-[min(480px,calc(100vw-32px))] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-5 text-sm shadow-xl backdrop:bg-black/35"
        aria-labelledby="mcp-access-heading"
        @close="$emit('close')"
    >
        <div class="flex items-start justify-between gap-3">
            <h2
                id="mcp-access-heading"
                class="text-base font-medium"
            >
                MCP 接入
            </h2>
            <button
                type="button"
                autofocus
                aria-label="关闭"
                class="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                @click="dialog?.close()"
            >
                <Icon
                    name="lucide:x"
                    :size="16"
                />
            </button>
        </div>
        <p class="mt-2 leading-6 text-neutral-600">让 Pi 等支持 MCP 的客户端连接当前项目。</p>
        <p
            v-if="status === 'pending'"
            role="status"
            class="mt-3 leading-6 text-neutral-600"
        >
            正在加载接入信息…
        </p>
        <p
            v-else-if="connectionError"
            role="alert"
            class="mt-3 leading-6 text-red-700"
        >
            无法加载 MCP 接入配置，请检查站点地址后重试。
            <button
                type="button"
                class="underline underline-offset-2"
                @click="refreshConnection()"
            >
                重试
            </button>
        </p>
        <template v-if="connectionInfo">
            <section
                class="mt-5"
                aria-labelledby="mcp-oauth-heading"
            >
                <h3
                    id="mcp-oauth-heading"
                    class="font-medium"
                >
                    方式 A · OAuth 授权（推荐）
                </h3>
                <p class="mt-1.5 leading-6 text-neutral-600">先注册服务器：</p>
                <McpCopyField
                    class="mt-2"
                    label="注册命令"
                    :text="connectionInfo.oauthCommand"
                />
                <p class="mt-2 leading-6 text-neutral-600">
                    然后在 Pi 中执行
                    <code class="rounded bg-neutral-100 px-1 py-0.5 font-mono">{{
                        connectionInfo.loginCommand
                    }}</code>
                    ，按提示在浏览器完成授权。
                </p>
            </section>
            <McpTokenForm
                :token-env-var="connectionInfo.tokenEnvVar"
                :token-command="connectionInfo.tokenCommand"
            />
        </template>
        <section
            class="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-3 leading-6 text-neutral-600"
        >
            <p class="flex items-start gap-2">
                <Icon
                    name="lucide:shield-check"
                    :size="16"
                    class="mt-0.5 shrink-0"
                />
                <span>令牌允许客户端以你的身份访问 MCP 工具，请妥善保管，不要分享给他人。</span>
            </p>
            <p class="mt-2 pl-6">服务器地址需通过 HTTPS 访问，本机 localhost 例外。</p>
        </section>
    </dialog>
</template>
