<script setup lang="ts">
import { templateConfig } from '#shared/utils/template'

const { user } = useUserSession()
</script>

<template>
    <section
        class="mx-auto max-w-3xl"
        aria-labelledby="welcome-heading"
    >
        <p class="text-sm text-neutral-600">{{ templateConfig.name }}</p>
        <h1
            id="welcome-heading"
            class="mt-3 text-2xl font-semibold sm:text-3xl"
        >
            欢迎，{{ user?.name || user?.login }}
        </h1>
        <p class="mt-4 text-base leading-7 text-neutral-600">你的新项目从这里开始。</p>
        <div class="mt-10 rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
            <h2 class="text-base font-medium">开始构建你的应用</h2>
            <p class="mt-3 leading-7 text-neutral-600">
                在这里添加项目内容，打造属于你的工作空间。
            </p>
            <a
                href="https://nuxt.com/docs/getting-started/introduction"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-6 inline-flex min-h-10 items-center gap-2 rounded-xl border border-neutral-200 px-4 font-medium hover:bg-neutral-100"
            >
                查看 Nuxt 文档
                <Icon
                    name="lucide:external-link"
                    :size="15"
                />
            </a>
        </div>
    </section>
</template>
