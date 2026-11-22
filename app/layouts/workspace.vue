<script setup lang="ts">
import { templateConfig } from '#shared/utils/template'

const route = useRoute()
const title = computed(() => route.meta.title)
const wideScreen = useMediaQuery('(min-width: 768px)')
const sidebarPreference = ref<boolean>()
const sidebarExpanded = computed(() => sidebarPreference.value ?? wideScreen.value)
const sidebarToggle = useTemplateRef<HTMLButtonElement>('sidebarToggle')
const mcpOpen = ref(false)

async function closeSidebar() {
    sidebarPreference.value = false
    await nextTick()
    sidebarToggle.value?.focus()
}
async function closeMcp() {
    mcpOpen.value = false
    if (!sidebarExpanded.value) {
        await nextTick()
        sidebarToggle.value?.focus()
    }
}
</script>

<template>
    <div class="relative flex h-svh min-h-0 w-full">
        <button
            v-if="sidebarExpanded"
            type="button"
            class="absolute inset-0 z-30 bg-black/20 md:hidden"
            aria-label="收起侧边栏"
            @click="closeSidebar"
        />
        <aside
            v-show="sidebarExpanded"
            id="workspace-sidebar"
            class="absolute inset-y-0 left-0 z-40 flex h-full w-[280px] shrink-0 flex-col border-r border-neutral-200 bg-neutral-100 md:relative"
            aria-label="侧边栏"
        >
            <div class="flex h-16 shrink-0 items-center justify-between px-4">
                <NuxtLink
                    to="/"
                    class="flex min-w-0 items-center gap-2.5"
                    :aria-label="`${templateConfig.name} 首页`"
                >
                    <img
                        src="/logo.svg"
                        alt=""
                        width="32"
                        height="32"
                        class="size-8 shrink-0"
                        aria-hidden="true"
                    />
                    <span class="text-sm font-semibold">{{ templateConfig.name }}</span>
                </NuxtLink>
                <button
                    type="button"
                    aria-expanded="true"
                    aria-controls="workspace-sidebar"
                    aria-label="折叠侧边栏"
                    class="grid size-9 place-items-center rounded-xl text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
                    @click="closeSidebar"
                >
                    <Icon
                        name="lucide:panel-left-close"
                        :size="17"
                    />
                </button>
            </div>
            <nav
                class="flex-1 px-3 py-3"
                aria-label="主导航"
            >
                <NuxtLink
                    to="/"
                    class="flex min-h-10 items-center gap-2.5 rounded-xl px-3 text-sm font-medium hover:bg-neutral-200"
                    exact-active-class="bg-neutral-200"
                >
                    <Icon
                        name="lucide:house"
                        :size="17"
                    />
                    首页
                </NuxtLink>
            </nav>
            <div class="shrink-0 border-t border-neutral-200 p-3">
                <WorkspaceUserMenu @mcp="mcpOpen = true" />
            </div>
        </aside>
        <div class="flex min-w-0 flex-1 flex-col">
            <header class="flex h-16 shrink-0 items-center gap-3 border-b border-neutral-200 px-5">
                <button
                    ref="sidebarToggle"
                    type="button"
                    :aria-expanded="sidebarExpanded"
                    aria-controls="workspace-sidebar"
                    :aria-label="sidebarExpanded ? '折叠侧边栏' : '展开侧边栏'"
                    class="grid size-9 place-items-center rounded-xl text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
                    @click="sidebarPreference = !sidebarExpanded"
                >
                    <Icon
                        :name="
                            sidebarExpanded ? 'lucide:panel-left-close' : 'lucide:panel-left-open'
                        "
                        :size="17"
                    />
                </button>
                <span class="text-sm font-medium">{{ title }}</span>
            </header>
            <main
                id="main-content"
                class="min-h-0 flex-1 overflow-y-auto px-6 py-12 outline-none sm:px-10"
                tabindex="-1"
            >
                <slot />
            </main>
        </div>
        <McpAccessDialog
            v-if="mcpOpen"
            @close="closeMcp"
        />
    </div>
</template>
