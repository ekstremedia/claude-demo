<script setup lang="ts">
import { ref } from 'vue';
import type { Duck } from '@/types/pond';
import ColorSwatch from '@/Components/Pond/ColorSwatch.vue';
import MoodPill from '@/Components/Pond/MoodPill.vue';

const props = defineProps<{ duck: Duck }>();

const emit = defineEmits<{
    quack: [duck: Duck];
    edit: [duck: Duck];
    release: [duck: Duck];
}>();

// Bounce the duck briefly each time it quacks — pure delight, no logic.
const bouncing = ref(false);
function quack(): void {
    bouncing.value = true;
    window.setTimeout(() => (bouncing.value = false), 400);
    emit('quack', props.duck);
}
</script>

<template>
    <div
        class="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
        <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
                <div
                    class="grid h-12 w-12 place-items-center rounded-full text-2xl"
                    :class="{ 'animate-bounce': bouncing }"
                    :style="{ backgroundColor: duck.color.hex + '33' }"
                    aria-hidden="true"
                >
                    🦆
                </div>
                <div>
                    <h3 class="font-semibold text-slate-900">{{ duck.name }}</h3>
                    <p class="text-xs text-slate-400">{{ duck.pond ? duck.pond.name : 'Homeless' }}</p>
                </div>
            </div>
            <ColorSwatch :hex="duck.color.hex" :label="duck.color.label" />
        </div>

        <div class="mt-4 flex items-center justify-between">
            <MoodPill :emoji="duck.mood.emoji" :label="duck.mood.label" />
            <div :title="`Happiness: ${duck.happiness}/5`" aria-label="happiness rating">
                <span
                    v-for="n in 5"
                    :key="n"
                    :class="n <= duck.happiness ? 'text-amber-400' : 'text-slate-200'"
                >★</span>
            </div>
        </div>

        <p v-if="duck.bio" class="mt-3 line-clamp-2 text-sm text-slate-500">{{ duck.bio }}</p>

        <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-semibold text-amber-950 transition hover:bg-amber-300"
                data-testid="quack-btn"
                @click="quack"
            >
                🔊 Quack
                <span class="rounded-full bg-amber-950/10 px-1.5 text-xs tabular-nums">{{ duck.quack_count }}</span>
            </button>
            <div class="flex items-center gap-1">
                <button
                    type="button"
                    class="rounded-lg px-2 py-1.5 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    data-testid="edit-btn"
                    @click="emit('edit', duck)"
                >
                    Edit
                </button>
                <button
                    type="button"
                    class="rounded-lg px-2 py-1.5 text-sm text-rose-500 transition hover:bg-rose-50"
                    data-testid="release-btn"
                    @click="emit('release', duck)"
                >
                    Release
                </button>
            </div>
        </div>
    </div>
</template>
