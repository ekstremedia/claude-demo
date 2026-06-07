<script setup lang="ts">
import { ref } from 'vue';
import type { Duck } from '@/types/pond';
import { usePondScene } from '@/Components/Pond/usePondScene';

const props = defineProps<{ ducks: Duck[] }>();
const emit = defineEmits<{ select: [duck: Duck] }>();

const containerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const scene = usePondScene(
    canvasRef,
    containerRef,
    () => props.ducks,
    (duck) => emit('select', duck),
);

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
    const { x, y } = toCanvas(event);
    scene.setPointer(x, y);
}

function onClick(event: MouseEvent): void {
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
    </div>
</template>
