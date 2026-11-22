<template>
    <div class="min-h-svh bg-neutral-50 font-sans text-sm text-neutral-900">
        <NuxtRouteAnnouncer />
        <a
            href="#main-content"
            class="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-3 focus:z-50 focus:rounded-md focus:bg-white focus:p-3 focus:text-sm"
            >跳转到主内容</a
        >
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>
