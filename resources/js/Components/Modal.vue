<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

// A small, dependency-free modal: teleported to <body>, closes on Escape or a
// click on the backdrop, and fades in/out. Content goes in the default slot.
const props = defineProps<{ show: boolean; title: string }>();
const emit = defineEmits<{ close: [] }>();

function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && props.show) {
        emit('close');
    }
}

onMounted(() => document.addEventListener('keydown', onKeydown));
onUnmounted(() => document.removeEventListener('keydown', onKeydown));
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="emit('close')" />
                <div class="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                    <div class="mb-5 flex items-center justify-between">
                        <h2 class="text-lg font-semibold text-slate-900">{{ title }}</h2>
                        <button
                            type="button"
                            class="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                            aria-label="Close"
                            @click="emit('close')"
                        >
                            ✕
                        </button>
                    </div>
                    <slot />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
