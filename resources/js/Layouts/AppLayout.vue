<script setup lang="ts">
import { Link, usePage } from '@inertiajs/vue3';
import { computed } from 'vue';

// Shared props come from HandleInertiaRequests::share() on the server.
const page = usePage();
const appName = computed(() => (page.props.appName as string) ?? 'Claude Demo');

const nav = [
    { label: 'Home', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Pond 🦆', href: '/pond' },
];
</script>

<template>
    <div class="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header class="border-b border-slate-200 bg-white/80 backdrop-blur">
            <nav class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                <Link href="/" class="flex items-center gap-2 font-semibold">
                    <span class="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">▲</span>
                    {{ appName }}
                </Link>
                <ul class="flex items-center gap-1">
                    <li v-for="item in nav" :key="item.href">
                        <Link
                            :href="item.href"
                            class="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            :class="{ 'bg-slate-100 text-slate-900': page.url === item.href }"
                        >
                            {{ item.label }}
                        </Link>
                    </li>
                </ul>
            </nav>
        </header>

        <main class="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
            <slot />
        </main>

        <footer class="border-t border-slate-200 py-6 text-center text-sm text-slate-400">
            Built with Laravel · Vue 3 · Inertia · Tailwind — running in Docker
        </footer>
    </div>
</template>
