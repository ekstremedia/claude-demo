<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { LOCALES, localeMeta } from '@/i18n/locales';
import { setLocale } from '@/i18n';

// A compact flag + native-name dropdown. Changing language calls setLocale(),
// which swaps the messages reactively (no reload) and updates <html> lang/dir.
const { t, locale } = useI18n();

const open = ref(false);
const root = ref<HTMLElement | null>(null);

const current = computed(() => localeMeta(locale.value));

function choose(code: string): void {
    setLocale(code);
    open.value = false;
}

function onPointerDown(event: PointerEvent): void {
    if (root.value && !root.value.contains(event.target as Node)) {
        open.value = false;
    }
}

function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
        open.value = false;
    }
}

onMounted(() => {
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('keydown', onKeydown);
});
</script>

<template>
    <div ref="root" class="relative">
        <button
            type="button"
            class="flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-white/60 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
            :aria-label="t('selector.language')"
            :title="t('selector.language')"
            aria-haspopup="listbox"
            :aria-expanded="open"
            @click="open = !open"
        >
            <span class="text-base leading-none" aria-hidden="true">{{ current.flag }}</span>
            <span class="hidden sm:inline">{{ current.name }}</span>
            <span class="text-xs text-slate-400" aria-hidden="true">▾</span>
        </button>

        <Transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
        >
            <ul
                v-if="open"
                class="absolute end-0 z-50 mt-1 w-48 origin-top overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-800"
                role="listbox"
            >
                <li v-for="item in LOCALES" :key="item.code">
                    <button
                        type="button"
                        class="flex w-full items-center gap-2.5 px-3 py-2 text-start text-sm transition hover:bg-slate-100 dark:hover:bg-slate-700"
                        :class="
                            item.code === locale
                                ? 'font-semibold text-sky-600 dark:text-sky-400'
                                : 'text-slate-700 dark:text-slate-200'
                        "
                        role="option"
                        :aria-selected="item.code === locale"
                        @click="choose(item.code)"
                    >
                        <span class="text-base leading-none" aria-hidden="true">{{ item.flag }}</span>
                        <span>{{ item.name }}</span>
                        <span v-if="item.code === locale" class="ms-auto text-xs" aria-hidden="true">✓</span>
                    </button>
                </li>
            </ul>
        </Transition>
    </div>
</template>
