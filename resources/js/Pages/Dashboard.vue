<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { ref } from 'vue';
import AppLayout from '@/Layouts/AppLayout.vue';

// A tiny bit of Vue reactivity to prove the SPA is live (no full page reload).
const count = ref(0);
</script>

<template>
    <Head title="Dashboard" />

    <AppLayout>
        <div class="flex items-center justify-between">
            <h1 class="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <Link href="/" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">← Back home</Link>
        </div>

        <p class="mt-3 text-slate-600">
            You navigated here without a full page reload — Inertia swapped the page component client-side.
        </p>

        <div class="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p class="text-sm font-medium text-slate-500">Vue reactivity check</p>
            <div class="mt-3 flex items-center gap-4">
                <button
                    type="button"
                    class="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500"
                    @click="count++"
                >
                    Clicked {{ count }} {{ count === 1 ? 'time' : 'times' }}
                </button>
                <button
                    type="button"
                    class="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
                    @click="count = 0"
                >
                    Reset
                </button>
            </div>
        </div>
    </AppLayout>
</template>
