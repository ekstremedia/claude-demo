<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppLayout from '@/Layouts/AppLayout.vue';

// Props passed from the route in routes/web.php.
defineProps<{
    laravelVersion: string;
    phpVersion: string;
}>();

const { t } = useI18n();

// Product names stay literal; only the descriptions are translated.
const stack = computed(() => [
    { name: 'Laravel', detail: t('welcome.stack.laravel') },
    { name: 'Inertia v3', detail: t('welcome.stack.inertia') },
    { name: 'Vue 3', detail: t('welcome.stack.vue') },
    { name: 'Tailwind v4', detail: t('welcome.stack.tailwind') },
    { name: 'Vite', detail: t('welcome.stack.vite') },
    { name: 'Docker', detail: t('welcome.stack.docker') },
]);
</script>

<template>
    <Head :title="t('welcome.tabTitle')" />

    <AppLayout>
        <section class="text-center">
            <p class="text-sm font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-400">{{ t('welcome.eyebrow') }}</p>
            <h1 class="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                {{ t('welcome.heading') }}
            </h1>
            <i18n-t
                keypath="welcome.intro"
                tag="p"
                class="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300"
                scope="global"
            >
                <template #cmd>
                    <code class="rounded bg-slate-200 px-1.5 py-0.5 text-sm dark:bg-slate-700 dark:text-slate-100">make up</code>
                </template>
            </i18n-t>

            <div class="mt-8 flex items-center justify-center gap-3">
                <Link
                    href="/dashboard"
                    class="rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-2.5 font-medium text-white shadow-sm transition hover:from-sky-600 hover:to-emerald-600"
                >
                    {{ t('welcome.openDashboard') }}
                </Link>
                <a
                    href="https://inertiajs.com"
                    class="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    {{ t('welcome.inertiaDocs') }}
                </a>
            </div>
        </section>

        <section class="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
                v-for="item in stack"
                :key="item.name"
                class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/60"
            >
                <h3 class="font-semibold text-slate-900 dark:text-white">{{ item.name }}</h3>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ item.detail }}</p>
            </div>
        </section>

        <p class="mt-10 text-center text-sm text-slate-400 dark:text-slate-500">
            {{ t('welcome.versions', { laravel: laravelVersion, php: phpVersion }) }}
        </p>
    </AppLayout>
</template>
