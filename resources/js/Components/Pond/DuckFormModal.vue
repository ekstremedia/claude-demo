<script setup lang="ts">
import { useForm } from '@inertiajs/vue3';
import { watch } from 'vue';
import Modal from '@/Components/Modal.vue';
import type { Duck, DuckOptions, DuckPond } from '@/types/pond';

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
</script>

<template>
    <Modal :show="show" :title="duck ? `Edit ${duck.name}` : 'Adopt a duck'" @close="emit('close')">
        <form class="space-y-4" @submit.prevent="submit">
            <div>
                <label class="block text-sm font-medium text-slate-700" for="duck-name">Name</label>
                <input
                    id="duck-name"
                    v-model="form.name"
                    type="text"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    placeholder="Sir Quacks-a-lot"
                />
                <p v-if="form.errors.name" class="mt-1 text-xs text-rose-500">{{ form.errors.name }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700" for="duck-color">Colour</label>
                    <select
                        id="duck-color"
                        v-model="form.color"
                        class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    >
                        <option v-for="c in options.colors" :key="c.value" :value="c.value">{{ c.label }}</option>
                    </select>
                    <p v-if="form.errors.color" class="mt-1 text-xs text-rose-500">{{ form.errors.color }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700" for="duck-mood">Mood</label>
                    <select
                        id="duck-mood"
                        v-model="form.mood"
                        class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    >
                        <option v-for="m in options.moods" :key="m.value" :value="m.value">
                            {{ m.emoji }} {{ m.label }}
                        </option>
                    </select>
                    <p v-if="form.errors.mood" class="mt-1 text-xs text-rose-500">{{ form.errors.mood }}</p>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-700" for="duck-pond">Pond</label>
                <select
                    id="duck-pond"
                    v-model="form.pond_id"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                    <option :value="null">🪹 Homeless</option>
                    <option v-for="p in ponds" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
                <p v-if="form.errors.pond_id" class="mt-1 text-xs text-rose-500">{{ form.errors.pond_id }}</p>
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-700" for="duck-adopted">Adopted on</label>
                <input
                    id="duck-adopted"
                    v-model="form.adopted_at"
                    type="date"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
                <p v-if="form.errors.adopted_at" class="mt-1 text-xs text-rose-500">{{ form.errors.adopted_at }}</p>
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-700" for="duck-bio">Bio</label>
                <textarea
                    id="duck-bio"
                    v-model="form.bio"
                    rows="2"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    placeholder="Loves breadcrumbs and long swims at sunset."
                />
                <p v-if="form.errors.bio" class="mt-1 text-xs text-rose-500">{{ form.errors.bio }}</p>
            </div>

            <div class="flex justify-end gap-2 pt-2">
                <button
                    type="button"
                    class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                    @click="emit('close')"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:opacity-50"
                    :disabled="form.processing"
                >
                    {{ duck ? 'Save changes' : 'Adopt 🐣' }}
                </button>
            </div>
        </form>
    </Modal>
</template>
