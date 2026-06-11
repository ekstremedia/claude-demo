<script setup lang="ts">
import { useForm } from '@inertiajs/vue3';
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Modal from '@/Components/Modal.vue';
import type { Duck, DuckOptions, DuckPond } from '@/types/pond';

const { t } = useI18n();

const props = defineProps<{
    show: boolean;
    // When set, the modal edits this duck; when null, it adopts a new one.
    duck: Duck | null;
    ponds: DuckPond[];
    options: DuckOptions;
}>();

const emit = defineEmits<{ close: [] }>();

const form = useForm({
    name: '',
    pond_id: null as number | null,
    color: 'yellow',
    mood: 'happy',
    adopted_at: new Date().toISOString().slice(0, 10),
    bio: '',
});

// Repopulate the form each time the modal opens, for either create or edit.
watch(
    () => props.show,
    (open) => {
        if (!open) {
            return;
        }

        if (props.duck) {
            form.name = props.duck.name;
            form.pond_id = props.duck.pond?.id ?? null;
            form.color = props.duck.color.value;
            form.mood = props.duck.mood.value;
            form.adopted_at = props.duck.adopted_at;
            form.bio = props.duck.bio ?? '';
        } else {
            form.reset();
        }

        form.clearErrors();
    },
);

function submit(): void {
    const options = { preserveScroll: true, onSuccess: () => emit('close') };

    if (props.duck) {
        form.put(`/ducks/${props.duck.id}`, options);
    } else {
        form.post('/ducks', options);
    }
}

const title = computed(() =>
    props.duck ? t('duckForm.editTitle', { name: props.duck.name }) : t('duckForm.adoptTitle'),
);
</script>

<template>
    <Modal :show="show" :title="title" @close="emit('close')">
        <form class="space-y-4" @submit.prevent="submit">
            <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-200" for="duck-name">{{ t('duckForm.name') }}</label>
                <input
                    id="duck-name"
                    v-model="form.name"
                    type="text"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                    :placeholder="t('duckForm.namePlaceholder')"
                />
                <p v-if="form.errors.name" class="mt-1 text-xs text-rose-500 dark:text-rose-400">{{ form.errors.name }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-200" for="duck-color">{{ t('duckForm.colour') }}</label>
                    <select
                        id="duck-color"
                        v-model="form.color"
                        class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    >
                        <option v-for="c in options.colors" :key="c.value" :value="c.value">{{ t('color.' + c.value) }}</option>
                    </select>
                    <p v-if="form.errors.color" class="mt-1 text-xs text-rose-500 dark:text-rose-400">{{ form.errors.color }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-200" for="duck-mood">{{ t('duckForm.mood') }}</label>
                    <select
                        id="duck-mood"
                        v-model="form.mood"
                        class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    >
                        <option v-for="m in options.moods" :key="m.value" :value="m.value">
                            {{ m.emoji }} {{ t('mood.' + m.value) }}
                        </option>
                    </select>
                    <p v-if="form.errors.mood" class="mt-1 text-xs text-rose-500 dark:text-rose-400">{{ form.errors.mood }}</p>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-200" for="duck-pond">{{ t('duckForm.pond') }}</label>
                <select
                    id="duck-pond"
                    v-model="form.pond_id"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                >
                    <option :value="null">🪹 {{ t('common.homeless') }}</option>
                    <option v-for="p in ponds" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
                <p v-if="form.errors.pond_id" class="mt-1 text-xs text-rose-500 dark:text-rose-400">{{ form.errors.pond_id }}</p>
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-200" for="duck-adopted">{{ t('duckForm.adoptedOn') }}</label>
                <input
                    id="duck-adopted"
                    v-model="form.adopted_at"
                    type="date"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
                />
                <p v-if="form.errors.adopted_at" class="mt-1 text-xs text-rose-500 dark:text-rose-400">{{ form.errors.adopted_at }}</p>
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-200" for="duck-bio">{{ t('duckForm.bio') }}</label>
                <textarea
                    id="duck-bio"
                    v-model="form.bio"
                    rows="2"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                    :placeholder="t('duckForm.bioPlaceholder')"
                />
                <p v-if="form.errors.bio" class="mt-1 text-xs text-rose-500 dark:text-rose-400">{{ form.errors.bio }}</p>
            </div>

            <div class="flex justify-end gap-2 pt-2">
                <button
                    type="button"
                    class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    @click="emit('close')"
                >
                    {{ t('duckForm.cancel') }}
                </button>
                <button
                    type="submit"
                    class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:opacity-50"
                    :disabled="form.processing"
                >
                    {{ duck ? t('duckForm.save') : t('duckForm.adopt') }}
                </button>
            </div>
        </form>
    </Modal>
</template>
