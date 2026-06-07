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
    <div
        class="relative isolate flex min-h-full flex-col bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-100 text-slate-900"
    >
        <!-- Ambient "nice weather": a soft sun glow and a meadow glow, fixed so
             they stay put as you scroll. Purely decorative. -->
        <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
            <div class="absolute -top-32 right-[-8%] h-[28rem] w-[28rem] rounded-full bg-amber-200/40 blur-3xl"></div>
            <div class="absolute bottom-[-18%] left-[-8%] h-[26rem] w-[26rem] rounded-full bg-emerald-200/45 blur-3xl"></div>
        </div>

        <header class="border-b border-white/50 bg-white/50 backdrop-blur">
            <nav class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                <Link href="/" class="flex items-center gap-2 font-semibold">
                    <span
                        class="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-sky-400 to-emerald-500 text-white shadow-sm"
                    >🦆</span>
                    {{ appName }}
                </Link>
                <ul class="flex items-center gap-1">
                    <li v-for="item in nav" :key="item.href">
                        <Link
                            :href="item.href"
                            class="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white/60 hover:text-slate-900"
                            :class="{ 'bg-white/70 text-slate-900 shadow-sm ring-1 ring-black/5': page.url === item.href }"
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

        <footer class="border-t border-white/50 py-6 text-center text-sm text-slate-500">
            Built with Laravel · Vue 3 · Inertia · Tailwind — running in Docker
        </footer>
    </div>
</template>
