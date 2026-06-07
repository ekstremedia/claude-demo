<script setup lang="ts">
import { Head, Link, router } from '@inertiajs/vue3';
import { ref } from 'vue';
import AppLayout from '@/Layouts/AppLayout.vue';
import PondFormModal from '@/Components/Pond/PondFormModal.vue';
import type { Pond } from '@/types/pond';

defineProps<{ ponds: Pond[] }>();

const showForm = ref(false);
const editing = ref<Pond | null>(null);

function dig(): void {
    editing.value = null;
    showForm.value = true;
}

function edit(pond: Pond): void {
    editing.value = pond;
    showForm.value = true;
}

function drain(pond: Pond): void {
    if (window.confirm(`Drain ${pond.name}? Its ducks will become homeless, not deleted.`)) {
        router.delete(`/ponds/${pond.id}`, { preserveScroll: true });
    }
}
</script>

<template>
    <Head title="Ponds" />

    <AppLayout>
        <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
                <p class="text-sm font-semibold uppercase tracking-widest text-teal-600">Rubber Duck Pond</p>
                <h1 class="mt-1 text-3xl font-bold tracking-tight text-slate-900">Ponds 🌊</h1>
                <p class="mt-1 text-slate-500">The watery homes your ducks belong to.</p>
            </div>
            <div class="flex items-center gap-2">
                <Link
                    href="/pond"
                    class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                    ← Back to ducks
                </Link>
                <button
                    type="button"
                    class="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500"
                    @click="dig"
                >
                    + Dig a pond
                </button>
            </div>
        </div>

        <div v-if="ponds.length" class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
                v-for="pond in ponds"
                :key="pond.id"
                class="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
                <div class="flex items-start justify-between gap-3">
                    <h3 class="font-semibold text-slate-900">{{ pond.name }}</h3>
                    <span class="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                        {{ pond.ducks_count }} 🦆
                    </span>
                </div>
                <p class="mt-2 flex-1 text-sm text-slate-500">
                    {{ pond.description || 'No description yet.' }}
                </p>
                <div class="mt-4 flex items-center gap-1 border-t border-slate-100 pt-4">
                    <button
                        type="button"
                        class="rounded-lg px-2 py-1.5 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        @click="edit(pond)"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        class="rounded-lg px-2 py-1.5 text-sm text-rose-500 transition hover:bg-rose-50"
                        @click="drain(pond)"
                    >
                        Drain
                    </button>
                </div>
            </div>
        </div>
        <div v-else class="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p class="text-4xl">🌊</p>
            <p class="mt-2 font-medium text-slate-900">No ponds yet</p>
            <p class="mt-1 text-sm text-slate-500">Dig your first pond to give your ducks a home.</p>
        </div>

        <PondFormModal :show="showForm" :pond="editing" @close="showForm = false" />
    </AppLayout>
</template>
