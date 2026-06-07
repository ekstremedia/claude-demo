<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Duck } from '@/types/pond';
import { usePondScene, type PondStats } from '@/Components/Pond/usePondScene';
import { formatDuration } from '@/Components/Pond/pondLife';

const props = defineProps<{ ducks: Duck[] }>();
const emit = defineEmits<{
    select: [duck: Duck];
    feed: [ids: number[]];
    die: [ids: number[]];
    restock: [];
    hatch: [parentId: number];
}>();

const containerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

// State that crosses from the engine into Vue: the game-over flag and the live
// HUD numbers (everything else stays non-reactive inside the engine).
const gameOver = ref(false);
const stats = ref<PondStats>({
    ducksAlive: props.ducks.filter((d) => d.died_at === null).length,
    crumbsEaten: 0,
    breadCurrent: 12,
    breadMax: 12,
});

// --- Survival timer + best streak (client-only) ----------------------------
const BEST_KEY = 'pond:bestStreakMs';
const runStartMs = ref(performanceNow());
const nowMs = ref(runStartMs.value);
const frozenSurvivalMs = ref<number | null>(null);
const bestMs = ref(readBest());
const newBest = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

function performanceNow(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function readBest(): number {
    try {
        return Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch {
        return 0;
    }
}

function writeBest(ms: number): void {
    try {
        localStorage.setItem(BEST_KEY, String(Math.round(ms)));
    } catch {
        // ignore — best streak is a nice-to-have
    }
}

const survivalMs = computed(() => frozenSurvivalMs.value ?? nowMs.value - runStartMs.value);

onMounted(() => {
    timer = setInterval(() => {
        if (frozenSurvivalMs.value === null) {
            nowMs.value = performanceNow();
        }
    }, 250);
});

onBeforeUnmount(() => {
    if (timer !== null) {
        clearInterval(timer);
    }
});

// Freeze the clock on game-over (and bank a new best); restart it on restock.
watch(gameOver, (over) => {
    if (over) {
        const final = nowMs.value - runStartMs.value;
        frozenSurvivalMs.value = final;
        if (final > bestMs.value) {
            bestMs.value = final;
            writeBest(final);
            newBest.value = true;
        }
    } else {
        frozenSurvivalMs.value = null;
        runStartMs.value = performanceNow();
        nowMs.value = runStartMs.value;
        newBest.value = false;
    }
});

const breadPct = computed(() => Math.round((stats.value.breadCurrent / stats.value.breadMax) * 100));

const scene = usePondScene(canvasRef, containerRef, () => props.ducks, {
    onSelect: (duck) => emit('select', duck),
    onFeed: (ids) => emit('feed', ids),
    onDie: (ids) => emit('die', ids),
    onAllDead: (allDead) => {
        gameOver.value = allDead;
    },
    onStats: (s) => {
        stats.value = s;
    },
    onHatch: (parentId) => emit('hatch', parentId),
});

/** Map a pointer/mouse event to canvas-space CSS pixels (matches the render transform). */
function toCanvas(event: MouseEvent): { x: number; y: number } {
    const canvas = canvasRef.value;
    if (!canvas) {
        return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function onMove(event: PointerEvent): void {
    if (gameOver.value) {
        return;
    }
    const { x, y } = toCanvas(event);
    scene.setPointer(x, y);
}

function onClick(event: MouseEvent): void {
    // No feeding the dead — the overlay's Restock button is the only way back.
    if (gameOver.value) {
        return;
    }
    const { x, y } = toCanvas(event);
    scene.clickAt(x, y);
}
</script>

<template>
    <div
        ref="containerRef"
        class="relative aspect-[16/9] w-full overflow-hidden rounded-3xl shadow-sm ring-1 ring-slate-200"
    >
        <canvas
            ref="canvasRef"
            class="block h-full w-full touch-none"
            @pointermove="onMove"
            @pointerleave="scene.clearPointer()"
            @click="onClick"
        />

        <!-- HUD: alive count · survival time · bread budget -->
        <div
            v-if="ducks.length && !gameOver"
            class="pointer-events-none absolute left-3 top-3 flex items-center gap-3 rounded-full bg-slate-900/45 px-3.5 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
        >
            <span class="tabular-nums">🦆 {{ stats.ducksAlive }}</span>
            <span class="tabular-nums">⏱ {{ formatDuration(survivalMs) }}</span>
            <span class="flex items-center gap-1.5">
                🍞
                <span class="h-1.5 w-16 overflow-hidden rounded-full bg-white/25">
                    <span class="block h-full rounded-full bg-amber-300 transition-[width] duration-200" :style="{ width: breadPct + '%' }" />
                </span>
            </span>
        </div>

        <div v-if="!ducks.length" class="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
                <p class="text-5xl">🦆</p>
                <p class="mt-3 font-medium text-white drop-shadow">The pond is quiet</p>
                <p class="mt-1 text-sm text-white/80 drop-shadow">Adopt a duck to bring it to life.</p>
            </div>
        </div>

        <!-- Game over: every duck has floated belly-up. Cute, but grim. -->
        <div
            v-if="gameOver"
            class="absolute inset-0 grid place-items-center bg-slate-900/70 backdrop-blur-sm"
        >
            <div class="px-6 text-center">
                <p class="text-6xl">💀🦆</p>
                <h2 class="mt-4 text-2xl font-bold text-white">Game over</h2>
                <p class="mt-2 max-w-sm text-sm text-slate-200">
                    The whole flock has starved. They lived, they floated, they forgot to be fed.
                    The pond is silent now — just gentle ripples and regret.
                </p>
                <p class="mt-4 text-sm text-slate-300">
                    <span class="font-semibold text-white">Survived {{ formatDuration(survivalMs) }}</span>
                    · {{ stats.crumbsEaten }} crumbs fed
                </p>
                <p class="mt-1 text-xs text-slate-400">
                    <span v-if="newBest" class="font-semibold text-amber-300">🏆 New best!</span>
                    <span v-else>Best streak {{ formatDuration(bestMs) }}</span>
                </p>
                <button
                    type="button"
                    class="mt-6 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500"
                    @click="emit('restock')"
                >
                    Restock the pond
                </button>
            </div>
        </div>
    </div>
</template>
