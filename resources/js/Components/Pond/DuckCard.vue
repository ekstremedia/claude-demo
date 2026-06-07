<script setup lang="ts">
import type { Duck } from '@/types/pond';
import ColorSwatch from '@/Components/Pond/ColorSwatch.vue';
import MoodPill from '@/Components/Pond/MoodPill.vue';

defineProps<{ duck: Duck }>();

const emit = defineEmits<{
    edit: [duck: Duck];
    release: [duck: Duck];
}>();
</script>

<template>
    <div class="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300">
        <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
                <h3 class="truncate font-medium text-slate-900">{{ duck.name }}</h3>
                <p class="mt-0.5 text-xs text-slate-400">{{ duck.pond ? duck.pond.name : 'Homeless' }}</p>
            </div>
            <ColorSwatch :hex="duck.color.hex" :label="duck.color.label" />
        </div>

        <div class="mt-3">
            <MoodPill :emoji="duck.mood.emoji" :label="duck.mood.label" />
        </div>

        <p v-if="duck.bio" class="mt-3 line-clamp-2 text-sm text-slate-500">{{ duck.bio }}</p>

        <div class="mt-4 flex items-center gap-1 border-t border-slate-100 pt-4">
            <button
                type="button"
                class="rounded-lg px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
                data-testid="edit-btn"
                @click="emit('edit', duck)"
            >
                Edit
            </button>
            <button
                type="button"
                class="rounded-lg px-2.5 py-1.5 text-sm text-rose-500 transition hover:bg-rose-50"
                data-testid="release-btn"
                @click="emit('release', duck)"
            >
                Release
            </button>
        </div>
    </div>
</template>
