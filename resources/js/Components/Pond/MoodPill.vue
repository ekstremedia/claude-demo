<script setup lang="ts">
// A small pill showing a duck's mood as emoji + label.
defineProps<{ emoji: string; label: string }>();
</script>

<template>
    <span
        class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200"
        data-testid="mood-pill"
    >
        <span aria-hidden="true">{{ emoji }}</span>
        {{ label }}
    </span>
</template>
