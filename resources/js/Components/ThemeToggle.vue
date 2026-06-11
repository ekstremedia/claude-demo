<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTheme } from '@/composables/useTheme';

// Sun/moon toggle. Flips the .dark class on <html> via the shared composable —
// the whole app re-themes instantly, no reload.
const { t } = useI18n();
const { theme, toggle } = useTheme();

const label = computed(() => (theme.value === 'dark' ? t('theme.toLight') : t('theme.toDark')));
</script>

<template>
    <button
        type="button"
        class="grid h-9 w-9 place-items-center rounded-md text-slate-700 transition hover:bg-white/60 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
        :aria-label="label"
        :title="label"
        :aria-pressed="theme === 'dark'"
        @click="toggle"
    >
        <span class="text-lg leading-none" aria-hidden="true">{{ theme === 'dark' ? '☀️' : '🌙' }}</span>
    </button>
</template>
