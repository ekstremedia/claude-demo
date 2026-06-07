<script setup lang="ts">
// A little colour dot. The fill is an arbitrary runtime hex coming from the
// DuckColor enum, so it has to be an inline style — Tailwind can't generate a
// utility class for a colour it doesn't know about at build time.
defineProps<{ hex: string; label?: string }>();
</script>

<template>
    <span
        class="inline-block h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10"
        :style="{ backgroundColor: hex }"
        :title="label"
        data-testid="color-swatch"
    />
</template>
