<script setup lang="ts">
const emit = defineEmits<{ mcp: [] }>()
const { user, clear } = useUserSession()
const loggingOut = ref(false)
const logoutError = ref('')
const avatarFailed = ref(false)
const details = useTemplateRef<HTMLDetailsElement>('details')
const trigger = useTemplateRef<HTMLElement>('trigger')

function close(restoreFocus = false) {
    if (details.value) details.value.open = false
    if (restoreFocus) trigger.value?.focus()
}
function onFocusOut(event: FocusEvent) {
    // 移出组件或焦点回到浏览器本身时收起，菜单内切换焦点保持展开。
    if (details.value?.contains(event.relatedTarget as Node | null)) return
    close()
}
function showMcp() {
    close(true)
    emit('mcp')
}
async function logout() {
    if (loggingOut.value) return
    close(true)
    loggingOut.value = true
    logoutError.value = ''
    try {
        await clear()
    } catch {
        logoutError.value = '退出失败，请检查网络后重试'
    } finally {
        loggingOut.value = false
    }
}
onClickOutside(details, () => close())
watch(
    () => user.value?.avatarUrl,
    () => {
        avatarFailed.value = false
    },
)
</script>

<template>
    <div>
        <p
            v-if="logoutError"
            role="alert"
            class="mb-2 text-sm text-red-700"
        >
            {{ logoutError }}
        </p>
        <details
            ref="details"
            class="group relative"
            @focusout="onFocusOut"
            @keydown.esc.prevent.stop="close(true)"
        >
            <summary
                ref="trigger"
                :aria-disabled="loggingOut"
                class="flex min-h-12 w-full cursor-pointer list-none items-center gap-3 rounded-xl px-2 text-left hover:bg-neutral-200 aria-disabled:cursor-wait aria-disabled:opacity-50 [&::-webkit-details-marker]:hidden"
                @click="loggingOut && $event.preventDefault()"
            >
                <img
                    v-if="user?.avatarUrl && !avatarFailed"
                    :src="user.avatarUrl"
                    alt=""
                    width="32"
                    height="32"
                    referrerpolicy="no-referrer"
                    class="size-8 shrink-0 rounded-full border border-neutral-200 object-cover"
                    @error="avatarFailed = true"
                />
                <span
                    v-else
                    class="grid size-8 shrink-0 place-items-center rounded-full border border-neutral-200 bg-white text-sm font-medium"
                    aria-hidden="true"
                    >{{ user?.login?.slice(0, 1).toUpperCase() }}</span
                >
                <span class="min-w-0 flex-1 truncate text-sm font-medium">{{
                    user?.name || user?.login
                }}</span>
                <Icon
                    :name="loggingOut ? 'lucide:loader-circle' : 'lucide:chevron-down'"
                    :size="15"
                    class="shrink-0 text-neutral-600 group-open:rotate-180"
                    :class="{ 'animate-spin motion-reduce:animate-none': loggingOut }"
                />
            </summary>
            <div
                role="group"
                aria-label="用户操作"
                class="absolute inset-x-0 bottom-full z-50 mb-2 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg"
            >
                <button
                    type="button"
                    class="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-neutral-900 hover:bg-neutral-100 focus:bg-neutral-100"
                    @click="showMcp"
                >
                    <Icon
                        name="lucide:plug"
                        :size="15"
                    />MCP 接入
                </button>
                <button
                    type="button"
                    :disabled="loggingOut"
                    class="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-neutral-900 focus:bg-neutral-100 enabled:hover:bg-neutral-100 disabled:opacity-40"
                    @click="logout"
                >
                    <Icon
                        name="lucide:log-out"
                        :size="15"
                    />退出登录
                </button>
            </div>
        </details>
    </div>
</template>
