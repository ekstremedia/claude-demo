<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { Duck } from '@/types/pond';
import ColorSwatch from '@/Components/Pond/ColorSwatch.vue';
import MoodPill from '@/Components/Pond/MoodPill.vue';

defineProps<{ duck: Duck }>();

const emit = defineEmits<{
    edit: [duck: Duck];
    release: [duck: Duck];
}>();

const { t } = useI18n();
</script>

<template>
    <div class="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600">
        <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
                <h3 class="truncate font-medium text-slate-900 dark:text-white">{{ duck.name }}</h3>
                <p class="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{{ duck.pond ? duck.pond.name : t('common.homeless') }}</p>
            </div>
            <ColorSwatch :hex="duck.color.hex" :label="t('color.' + duck.color.value)" />
        </div>

        <div class="mt-3">
            <MoodPill :emoji="duck.mood.emoji" :label="t('mood.' + duck.mood.value)" />
        </div>

        <p v-if="duck.bio" class="mt-3 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{{ duck.bio }}</p>

        <div class="mt-4 flex items-center gap-1 border-t border-slate-100 pt-4 dark:border-slate-700">
            <button
                type="button"
                class="rounded-lg px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                data-testid="edit-btn"
                @click="emit('edit', duck)"
            >
                {{ t('duckCard.edit') }}
            </button>
            <button
                type="button"
                class="rounded-lg px-2.5 py-1.5 text-sm text-rose-500 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                data-testid="release-btn"
                @click="emit('release', duck)"
            >
                {{ t('duckCard.release') }}
            </button>
        </div>
    </div>
</template>
