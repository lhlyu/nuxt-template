<script setup lang="ts">
const props = defineProps<{ text: string; label: string }>()
const failed = ref(false)
const {
    copy: copyToClipboard,
    copied,
    copyPending,
    isSupported,
} = useClipboard({
    source: () => props.text,
    copiedDuring: 2000,
})

async function copy() {
    if (!props.text) return
    failed.value = false
    if (!isSupported.value) {
        failed.value = true
        return
    }
    try {
        await copyToClipboard()
    } catch {
        failed.value = true
    }
}
</script>

<template>
    <div class="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
        <code class="block select-all whitespace-pre-wrap break-all font-mono leading-6">{{
            text
        }}</code>
        <div class="mt-2 flex flex-wrap items-center gap-2">
            <button
                type="button"
                :aria-label="`复制${label}`"
                :disabled="copyPending || !text"
                class="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-neutral-600 enabled:hover:bg-neutral-100 enabled:hover:text-neutral-900"
                @click="copy"
            >
                <Icon
                    :name="copied ? 'lucide:check' : 'lucide:copy'"
                    :size="14"
                />{{ copied ? '已复制' : '复制' }}
            </button>
            <span
                v-if="failed"
                role="alert"
                class="leading-6 text-neutral-600"
                >自动复制失败，请选中文本后手动复制</span
            >
        </div>
    </div>
</template>
