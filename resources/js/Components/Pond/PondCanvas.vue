<script setup lang="ts">
import { ref } from 'vue';
import type { Duck } from '@/types/pond';
import { usePondScene } from '@/Components/Pond/usePondScene';

const props = defineProps<{ ducks: Duck[] }>();
const emit = defineEmits<{
    select: [duck: Duck];
    feed: [ids: number[]];
    die: [ids: number[]];
    restock: [];
}>();

const containerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

// The only piece of game state that crosses from the engine into Vue: when every
// duck has starved, we show the (cheerfully grim) game-over overlay.
const gameOver = ref(false);

const scene = usePondScene(canvasRef, containerRef, () => props.ducks, {
    onSelect: (duck) => emit('select', duck),
    onFeed: (ids) => emit('feed', ids),
    onDie: (ids) => emit('die', ids),
    onAllDead: (allDead) => {
        gameOver.value = allDead;
    },
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
