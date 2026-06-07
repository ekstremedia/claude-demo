<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';

// Props passed from the route in routes/web.php.
defineProps<{
    laravelVersion: string;
    phpVersion: string;
}>();

const stack = [
    { name: 'Laravel', detail: 'PHP framework & routing' },
    { name: 'Inertia v3', detail: 'SPA glue, no separate API' },
    { name: 'Vue 3', detail: 'Reactive components' },
    { name: 'Tailwind v4', detail: 'Utility-first styling' },
    { name: 'Vite', detail: 'Dev server & HMR' },
    { name: 'Docker', detail: 'make up / make down' },
];
</script>

<template>
    <Head title="Welcome" />

    <AppLayout>
        <section class="text-center">
            <p class="text-sm font-semibold uppercase tracking-widest text-sky-700">Claude Code Demo</p>
            <h1 class="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Laravel + Vue + Inertia, in a container
            </h1>
            <p class="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                A single-page app served by Laravel and rendered with Vue through Inertia — no separate API layer.
                The whole stack runs in Docker; start it with <code class="rounded bg-slate-200 px-1.5 py-0.5 text-sm">make up</code>.
            </p>

            <div class="mt-8 flex items-center justify-center gap-3">
                <Link
                    href="/dashboard"
                    class="rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-2.5 font-medium text-white shadow-sm transition hover:from-sky-600 hover:to-emerald-600"
                >
                    Open the dashboard →
                </Link>
                <a
                    href="https://inertiajs.com"
                    class="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-100"
                >
                    Inertia docs
                </a>
            </div>
        </section>

        <section class="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
                v-for="item in stack"
                :key="item.name"
                class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
                <h3 class="font-semibold text-slate-900">{{ item.name }}</h3>
                <p class="mt-1 text-sm text-slate-500">{{ item.detail }}</p>
            </div>
        </section>

        <p class="mt-10 text-center text-sm text-slate-400">
            Laravel v{{ laravelVersion }} · PHP v{{ phpVersion }}
        </p>
    </AppLayout>
</template>
