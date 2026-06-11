<script setup lang="ts">
import { Head, Link, router } from '@inertiajs/vue3';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppLayout from '@/Layouts/AppLayout.vue';
import DuckCard from '@/Components/Pond/DuckCard.vue';
import DuckFormModal from '@/Components/Pond/DuckFormModal.vue';
import type { Duck, DuckFilters, DuckOptions, DuckPond, DuckStats, Paginated } from '@/types/pond';

const { t } = useI18n();

const props = defineProps<{
    ducks: Paginated<Duck>;
    ponds: DuckPond[];
    filters: DuckFilters;
    options: DuckOptions;
    stats: DuckStats;
}>();

// --- Search (URL-driven, debounced) ----------------------------------------
const search = ref(props.filters.search ?? '');

let debounce: number | undefined;
watch(search, (value) => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => {
        router.get('/pond', { search: value || undefined }, { preserveState: true, preserveScroll: true, replace: true });
    }, 300);
});

// --- Adopt / edit / release -----------------------------------------------
const showForm = ref(false);
const editing = ref<Duck | null>(null);

function adopt(): void {
    editing.value = null;
    showForm.value = true;
}

function edit(duck: Duck): void {
    editing.value = duck;
    showForm.value = true;
}

function release(duck: Duck): void {
    if (window.confirm(t('ducks.releaseConfirm', { name: duck.name }))) {
        router.delete(`/ducks/${duck.id}`, { preserveScroll: true });
    }
}
</script>

<template>
    <Head :title="t('ducks.tabTitle')" />

    <AppLayout>
        <!-- Header -->
        <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
                <p class="text-sm font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">{{ t('ducks.eyebrow') }}</p>
                <h1 class="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{{ t('ducks.heading') }}</h1>
                <p class="mt-1 text-slate-500 dark:text-slate-400">{{ t('ducks.flockCount', stats.total_ducks) }}</p>
            </div>
            <div class="flex items-center gap-2">
                <Link
                    href="/ponds"
                    class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    {{ t('ducks.viewPond') }}
                </Link>
                <button
                    type="button"
                    class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
                    @click="adopt"
                >
                    {{ t('ducks.adopt') }}
                </button>
            </div>
        </div>

        <!-- Search -->
        <div class="relative mt-8">
            <span class="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">🔍</span>
            <input
                v-model="search"
                type="search"
                :placeholder="t('ducks.searchPlaceholder')"
                class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
        </div>

        <!-- Grid -->
        <div v-if="ducks.data.length" class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <DuckCard v-for="duck in ducks.data" :key="duck.id" :duck="duck" @edit="edit" @release="release" />
        </div>
        <div v-else class="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800/60">
            <p class="text-4xl">🪹</p>
            <p class="mt-2 font-medium text-slate-900 dark:text-white">{{ t('ducks.emptyTitle') }}</p>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ t('ducks.emptyHint') }}</p>
        </div>

        <!-- Pagination -->
        <div v-if="ducks.last_page > 1" class="mt-8 flex flex-wrap justify-center gap-1">
            <Link
                v-for="link in ducks.links"
                :key="link.label"
                :href="link.url ?? ''"
                preserve-scroll
                class="rounded-lg px-3 py-1.5 text-sm transition"
                :class="[
                    link.active ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                    link.url ? '' : 'pointer-events-none opacity-40',
                ]"
                v-html="link.label"
            />
        </div>

        <DuckFormModal :show="showForm" :duck="editing" :ponds="ponds" :options="options" @close="showForm = false" />
    </AppLayout>
</template>
