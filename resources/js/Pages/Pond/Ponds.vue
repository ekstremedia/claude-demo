<script setup lang="ts">
import { Head, Link, router } from '@inertiajs/vue3';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppLayout from '@/Layouts/AppLayout.vue';
import PondCanvas from '@/Components/Pond/PondCanvas.vue';
import DuckFormModal from '@/Components/Pond/DuckFormModal.vue';
import type { Duck, DuckOptions, DuckPond } from '@/types/pond';

const { t } = useI18n();

defineProps<{
    ducks: Duck[];
    ponds: DuckPond[];
    options: DuckOptions;
}>();

// --- Tend a duck by clicking it in the pond ---------------------------------
const showDuckForm = ref(false);
const editingDuck = ref<Duck | null>(null);

function openDuck(duck: Duck): void {
    editingDuck.value = duck;
    showDuckForm.value = true;
}

// --- Survival persistence ---------------------------------------------------
// The canvas batches feeds/deaths and emits id lists; we persist them without
// tearing down the scene. preserveState keeps the live canvas mounted (else the
// ducks would teleport home on every round-trip), preserveScroll keeps the view.

function feed(ids: number[]): void {
    router.post('/ducks/feed', { ids }, { preserveScroll: true, preserveState: true });
}

function bury(ids: number[]): void {
    router.post('/ducks/die', { ids }, { preserveScroll: true, preserveState: true });
}

function restock(): void {
    router.post('/pond/restock', {}, { preserveScroll: true });
}

function hatch(parentId: number): void {
    router.post('/ducks/hatch', { parent_id: parentId }, { preserveScroll: true, preserveState: true });
}
</script>

<template>
    <Head :title="t('pond.tabTitle')" />

    <AppLayout>
        <!-- Header -->
        <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
                <p class="text-sm font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-400">{{ t('pond.eyebrow') }}</p>
                <h1 class="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{{ t('pond.heading') }}</h1>
                <p class="mt-1 text-slate-500 dark:text-slate-400">
                    {{ t('pond.intro') }}
                </p>
            </div>
            <Link
                href="/pond"
                class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
                {{ t('pond.manageDucks') }}
            </Link>
        </div>

        <!-- The living pond -->
        <div class="mt-6">
            <PondCanvas :ducks="ducks" @select="openDuck" @feed="feed" @die="bury" @restock="restock" @hatch="hatch" />
        </div>

        <DuckFormModal
            :show="showDuckForm"
            :duck="editingDuck"
            :ponds="ponds"
            :options="options"
            @close="showDuckForm = false"
        />
    </AppLayout>
</template>
