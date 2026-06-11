import { vi } from 'vitest';
import { config } from '@vue/test-utils';
import { i18n } from '@/i18n';

// Make vue-i18n available to every mounted component, pinned to English so the
// existing text assertions are deterministic regardless of the host locale.
i18n.global.locale.value = 'en';
config.global.plugins = [i18n];

// The components under test don't talk to the server, but stub Inertia so that
// anything importing it can still mount in isolation under happy-dom.
vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: { appName: 'Claude Demo', flash: {} } }),
    useForm: (data: Record<string, unknown>) => ({
        ...data,
        errors: {},
        processing: false,
        post: vi.fn(),
        put: vi.fn(),
        reset: vi.fn(),
        clearErrors: vi.fn(),
    }),
    router: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
    Link: { template: '<a><slot /></a>' },
    Head: { template: '<div><slot /></div>' },
}));
