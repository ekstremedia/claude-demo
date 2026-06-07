import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import PondCanvas from '@/Components/Pond/PondCanvas.vue';
import type { Duck } from '@/types/pond';

// GSAP drives real rAF/animation — stub it so the engine runs deterministically
// under happy-dom (no ticker actually fires, tweens are no-ops).
vi.mock('gsap', () => {
    const tween = { kill: vi.fn() };
    return {
        default: {
            to: vi.fn(() => tween),
            killTweensOf: vi.fn(),
            ticker: { add: vi.fn(), remove: vi.fn(), time: 0 },
            utils: { random: (a: number) => a },
        },
    };
});

beforeAll(() => {
    // happy-dom has no real 2d context / ResizeObserver / matchMedia — stub them.
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    if (typeof globalThis.ResizeObserver === 'undefined') {
        globalThis.ResizeObserver = class {
            observe(): void {}
            disconnect(): void {}
            unobserve(): void {}
        } as unknown as typeof ResizeObserver;
    }

    if (typeof window.matchMedia === 'undefined') {
        window.matchMedia = (() => ({ matches: false, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    }
});

function makeDuck(overrides: Partial<Duck> = {}): Duck {
    return {
        id: 1,
        name: 'Sir Quacks',
        pond: null,
        color: { value: 'yellow', label: 'Classic Yellow', hex: '#facc15' },
        mood: { value: 'happy', label: 'Happy', emoji: '😄' },
        adopted_at: '2026-01-01',
        bio: null,
        created_at: '2026-01-01T00:00:00.000Z',
        last_fed_at: '2026-06-07T00:00:00.000Z',
        died_at: null,
        ...overrides,
    };
}

const duck = makeDuck();

describe('PondCanvas', () => {
    it('mounts with ducks and renders a canvas', () => {
        const wrapper = mount(PondCanvas, { props: { ducks: [duck] } });

        expect(wrapper.find('canvas').exists()).toBe(true);
    });

    it('shows the empty state when there are no ducks', () => {
        const wrapper = mount(PondCanvas, { props: { ducks: [] } });

        expect(wrapper.text()).toContain('The pond is quiet');
    });

    it('emits select with the duck when a duck is clicked', async () => {
        const wrapper = mount(PondCanvas, { props: { ducks: [duck] } });

        await wrapper.find('canvas').trigger('click', { clientX: 0, clientY: 0 });

        expect(wrapper.emitted('select')).toBeTruthy();
        expect(wrapper.emitted('select')?.[0]).toEqual([duck]);
    });

    it('shows the game-over overlay once every duck has died', async () => {
        const dead = [
            makeDuck({ id: 1, died_at: '2026-06-07T00:01:00.000Z' }),
            makeDuck({ id: 2, died_at: '2026-06-07T00:01:00.000Z' }),
        ];
        const wrapper = mount(PondCanvas, { props: { ducks: dead } });
        await wrapper.vm.$nextTick();

        expect(wrapper.text()).toContain('Game over');
        expect(wrapper.text()).toContain('Restock the pond');
    });

    it('keeps playing while at least one duck lives', async () => {
        const ducks = [
            makeDuck({ id: 1, died_at: '2026-06-07T00:01:00.000Z' }),
            makeDuck({ id: 2, died_at: null }),
        ];
        const wrapper = mount(PondCanvas, { props: { ducks } });
        await wrapper.vm.$nextTick();

        expect(wrapper.text()).not.toContain('Game over');
    });

    it('emits restock from the game-over overlay button', async () => {
        const dead = [makeDuck({ id: 1, died_at: '2026-06-07T00:01:00.000Z' })];
        const wrapper = mount(PondCanvas, { props: { ducks: dead } });
        await wrapper.vm.$nextTick();

        await wrapper.find('button').trigger('click');

        expect(wrapper.emitted('restock')).toBeTruthy();
    });

    it('unmounts cleanly', () => {
        const wrapper = mount(PondCanvas, { props: { ducks: [duck] } });

        expect(() => wrapper.unmount()).not.toThrow();
    });
});
