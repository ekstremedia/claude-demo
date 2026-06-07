<script setup lang="ts">
// A headline number for the stats bar (e.g. "21 Ducks").
defineProps<{ label: string; value: string | number; icon?: string }>();
</script>

<template>
    <div class="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm" data-testid="stat-badge">
        <div class="flex items-center gap-2 text-sm font-medium text-slate-500">
            <span v-if="icon" aria-hidden="true">{{ icon }}</span>
            {{ label }}
        </div>
        <div class="mt-1 text-2xl font-bold tracking-tight text-slate-900" data-testid="stat-value">
            {{ value }}
        </div>
    </div>
</template>
