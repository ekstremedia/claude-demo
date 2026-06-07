<script setup lang="ts">
import { useForm } from '@inertiajs/vue3';
import { watch } from 'vue';
import Modal from '@/Components/Modal.vue';
import type { Pond } from '@/types/pond';

const props = defineProps<{
    show: boolean;
    // When set, the modal edits this pond; when null, it digs a new one.
    pond: Pond | null;
}>();

const emit = defineEmits<{ close: [] }>();

const form = useForm({
    name: '',
    description: '',
});

watch(
    () => props.show,
    (open) => {
        if (!open) {
            return;
        }

        if (props.pond) {
            form.name = props.pond.name;
            form.description = props.pond.description ?? '';
        } else {
            form.reset();
        }

        form.clearErrors();
    },
);

function submit(): void {
    const options = { preserveScroll: true, onSuccess: () => emit('close') };

    if (props.pond) {
        form.put(`/ponds/${props.pond.id}`, options);
    } else {
        form.post('/ponds', options);
    }
}
</script>

<template>
    <Modal :show="show" :title="pond ? `Edit ${pond.name}` : 'Dig a pond'" @close="emit('close')">
        <form class="space-y-4" @submit.prevent="submit">
            <div>
                <label class="block text-sm font-medium text-slate-700" for="pond-name">Name</label>
                <input
                    id="pond-name"
                    v-model="form.name"
                    type="text"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    placeholder="Lily Lagoon"
                />
                <p v-if="form.errors.name" class="mt-1 text-xs text-rose-500">{{ form.errors.name }}</p>
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-700" for="pond-description">Description</label>
                <textarea
                    id="pond-description"
                    v-model="form.description"
                    rows="3"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    placeholder="A calm pond carpeted with water lilies."
                />
                <p v-if="form.errors.description" class="mt-1 text-xs text-rose-500">{{ form.errors.description }}</p>
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
                    class="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500 disabled:opacity-50"
                    :disabled="form.processing"
                >
                    {{ pond ? 'Save changes' : 'Dig it 🌊' }}
                </button>
            </div>
        </form>
    </Modal>
</template>
