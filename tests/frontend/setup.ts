import { vi } from 'vitest';

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
