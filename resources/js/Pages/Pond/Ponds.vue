<script setup lang="ts">
import { Head, Link, router } from '@inertiajs/vue3';
import { ref } from 'vue';
import AppLayout from '@/Layouts/AppLayout.vue';
import PondCanvas from '@/Components/Pond/PondCanvas.vue';
import PondFormModal from '@/Components/Pond/PondFormModal.vue';
import DuckFormModal from '@/Components/Pond/DuckFormModal.vue';
import type { Duck, DuckOptions, Pond } from '@/types/pond';

defineProps<{
    ducks: Duck[];
    ponds: Pond[];
    options: DuckOptions;
}>();

// --- Pond management --------------------------------------------------------
const showPondForm = ref(false);
const editingPond = ref<Pond | null>(null);

function dig(): void {
    editingPond.value = null;
    showPondForm.value = true;
}

function editPond(pond: Pond): void {
    editingPond.value = pond;
    showPondForm.value = true;
}

function drain(pond: Pond): void {
    if (window.confirm(`Drain ${pond.name}? Its ducks will become homeless, not deleted.`)) {
        router.delete(`/ponds/${pond.id}`, { preserveScroll: true });
    }
}

// --- Tend a duck by clicking it in the pond ---------------------------------
const showDuckForm = ref(false);
const editingDuck = ref<Duck | null>(null);

function openDuck(duck: Duck): void {
    editingDuck.value = duck;
    showDuckForm.value = true;
}
</script>

<template>
    <Head title="The Pond" />

    <AppLayout>
        <!-- Header -->
        <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
                <p class="text-sm font-semibold uppercase tracking-widest text-teal-600">Rubber Duck Pond</p>
                <h1 class="mt-1 text-3xl font-bold tracking-tight text-slate-900">The Pond 🌊</h1>
                <p class="mt-1 text-slate-500">Every duck, drifting by its mood. Click one to tend it.</p>
            </div>
            <Link
                href="/pond"
                class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
                Manage ducks
            </Link>
        </div>

        <!-- The living pond -->
        <div class="mt-6">
            <PondCanvas :ducks="ducks" @select="openDuck" />
        </div>

        <!-- Ponds management -->
        <div class="mt-12 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Ponds</h2>
            <button
                type="button"
                class="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500"
                @click="dig"
            >
                + Dig a pond
            </button>
        </div>

        <div v-if="ponds.length" class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
                v-for="pond in ponds"
                :key="pond.id"
                class="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300"
            >
                <div class="flex items-start justify-between gap-3">
                    <h3 class="font-medium text-slate-900">{{ pond.name }}</h3>
                    <span class="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                        {{ pond.ducks_count }} 🦆
                    </span>
                </div>
                <p class="mt-2 flex-1 text-sm text-slate-500">{{ pond.description || 'No description yet.' }}</p>
                <div class="mt-4 flex items-center gap-1 border-t border-slate-100 pt-4">
                    <button
                        type="button"
                        class="rounded-lg px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
                        @click="editPond(pond)"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        class="rounded-lg px-2.5 py-1.5 text-sm text-rose-500 transition hover:bg-rose-50"
                        @click="drain(pond)"
                    >
                        Drain
                    </button>
                </div>
            </div>
        </div>
        <div v-else class="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p class="font-medium text-slate-900">No ponds yet</p>
            <p class="mt-1 text-sm text-slate-500">Dig your first pond to give your ducks a home.</p>
        </div>

        <PondFormModal :show="showPondForm" :pond="editingPond" @close="showPondForm = false" />
        <DuckFormModal
            :show="showDuckForm"
            :duck="editingDuck"
            :ponds="ponds"
            :options="options"
            @close="showDuckForm = false"
        />
    </AppLayout>
</template>
