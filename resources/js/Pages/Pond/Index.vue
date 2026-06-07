<script setup lang="ts">
import { Head, Link, router } from '@inertiajs/vue3';
import { reactive, ref, watch } from 'vue';
import AppLayout from '@/Layouts/AppLayout.vue';
import DuckCard from '@/Components/Pond/DuckCard.vue';
import DuckFormModal from '@/Components/Pond/DuckFormModal.vue';
import StatBadge from '@/Components/Pond/StatBadge.vue';
import type { Duck, DuckFilters, DuckOptions, DuckPond, DuckStats, Paginated } from '@/types/pond';

const props = defineProps<{
    ducks: Paginated<Duck>;
    ponds: DuckPond[];
    filters: DuckFilters;
    options: DuckOptions;
    stats: DuckStats;
}>();

// --- Search & filter toolbar (URL-driven, debounced) -----------------------
const filters = reactive({
    search: props.filters.search ?? '',
    mood: props.filters.mood ?? '',
    color: props.filters.color ?? '',
});

let debounce: number | undefined;
watch(filters, () => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => {
        router.get(
            '/pond',
            {
                search: filters.search || undefined,
                mood: filters.mood || undefined,
                color: filters.color || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }, 300);
});

function clearFilters(): void {
    filters.search = '';
    filters.mood = '';
    filters.color = '';
}

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
    if (window.confirm(`Release ${duck.name} back into the wild?`)) {
        router.delete(`/ducks/${duck.id}`, { preserveScroll: true });
    }
}
</script>

<template>
    <Head title="Rubber Duck Pond" />

    <AppLayout>
        <!-- Header -->
        <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
                <p class="text-sm font-semibold uppercase tracking-widest text-sky-600">Rubber Duck Pond</p>
                <h1 class="mt-1 text-3xl font-bold tracking-tight text-slate-900">Ducks 🦆</h1>
                <p class="mt-1 text-slate-500">Adopt, sort and tend your flock of rubber ducks.</p>
            </div>
            <div class="flex items-center gap-2">
                <Link
                    href="/ponds"
                    class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                    View the pond
                </Link>
                <button
                    type="button"
                    class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
                    @click="adopt"
                >
                    + Adopt a duck
                </button>
            </div>
        </div>

        <!-- Stats -->
        <div class="mt-8 grid gap-4 sm:grid-cols-2">
            <StatBadge label="Ducks" :value="stats.total_ducks" icon="🦆" />
            <StatBadge label="Ponds" :value="stats.total_ponds" icon="🌊" />
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
            <span
                v-for="m in options.moods"
                :key="m.value"
                class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600"
            >
                <span aria-hidden="true">{{ m.emoji }}</span>
                {{ m.label }}
                <span class="font-semibold text-slate-900">{{ stats.by_mood[m.value] ?? 0 }}</span>
            </span>
        </div>

        <!-- Toolbar -->
        <div class="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <input
                v-model="filters.search"
                type="search"
                placeholder="Search ducks by name…"
                class="min-w-48 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
            <select
                v-model="filters.mood"
                class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
                <option value="">All moods</option>
                <option v-for="m in options.moods" :key="m.value" :value="m.value">{{ m.emoji }} {{ m.label }}</option>
            </select>
            <select
                v-model="filters.color"
                class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
                <option value="">All colours</option>
                <option v-for="c in options.colors" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
            <button
                v-if="filters.search || filters.mood || filters.color"
                type="button"
                class="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
                @click="clearFilters"
            >
                Clear
            </button>
        </div>

        <!-- Grid -->
        <div v-if="ducks.data.length" class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DuckCard
                v-for="duck in ducks.data"
                :key="duck.id"
                :duck="duck"
                @edit="edit"
                @release="release"
            />
        </div>
        <div v-else class="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p class="text-4xl">🪹</p>
            <p class="mt-2 font-medium text-slate-900">No ducks here yet</p>
            <p class="mt-1 text-sm text-slate-500">Try clearing the filters, or adopt your first duck.</p>
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
                    link.active ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100',
                    link.url ? '' : 'pointer-events-none opacity-40',
                ]"
                v-html="link.label"
            />
        </div>

        <DuckFormModal
            :show="showForm"
            :duck="editing"
            :ponds="ponds"
            :options="options"
            @close="showForm = false"
        />
    </AppLayout>
</template>
