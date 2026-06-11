<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppLayout from '@/Layouts/AppLayout.vue';

const { t } = useI18n();

// A tiny bit of Vue reactivity to prove the SPA is live (no full page reload).
const count = ref(0);
</script>

<template>
    <Head :title="t('dashboard.tabTitle')" />

    <AppLayout>
        <div class="flex items-center justify-between">
            <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{{ t('dashboard.heading') }}</h1>
            <Link href="/" class="text-sm font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300">{{ t('dashboard.backHome') }}</Link>
        </div>

        <p class="mt-3 text-slate-600 dark:text-slate-300">
            {{ t('dashboard.intro') }}
        </p>

        <div class="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ t('dashboard.reactivityCheck') }}</p>
            <div class="mt-3 flex items-center gap-4">
                <button
                    type="button"
                    class="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-500"
                    @click="count++"
                >
                    {{ t('dashboard.clicked', count) }}
                </button>
                <button
                    type="button"
                    class="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    @click="count = 0"
                >
                    {{ t('dashboard.reset') }}
                </button>
            </div>
        </div>
    </AppLayout>
</template>
