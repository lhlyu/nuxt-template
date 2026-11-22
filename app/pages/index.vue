<script setup lang="ts">
definePageMeta({ layout: false, title: '首页' })

const { ready, loggedIn } = useUserSession()

useSeoMeta({ robots: 'noindex, nofollow' })
</script>

<template>
    <div>
        <main
            v-if="!ready"
            id="main-content"
            class="flex h-svh items-center justify-center gap-2 text-neutral-600"
            role="status"
        >
            <Icon
                name="lucide:loader-circle"
                class="animate-spin motion-reduce:animate-none"
            />
            <span class="sr-only">正在加载…</span>
        </main>
        <NuxtLayout
            v-else-if="loggedIn"
            name="workspace"
        >
            <HomeScreen />
        </NuxtLayout>
        <main
            v-else
            id="main-content"
            class="flex min-h-svh flex-col justify-center outline-none"
            tabindex="-1"
        >
            <LoginScreen />
        </main>
    </div>
</template>
