import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import DuckCard from '@/Components/Pond/DuckCard.vue';
import type { Duck } from '@/types/pond';

const duck: Duck = {
    id: 1,
    name: 'Sir Quacks',
    pond: { id: 1, name: 'Big Pond' },
    color: { value: 'yellow', label: 'Classic Yellow', hex: '#facc15' },
    mood: { value: 'happy', label: 'Happy', emoji: '😄' },
    quack_count: 7,
    happiness: 4,
    adopted_at: '2026-01-01',
    bio: null,
};

describe('DuckCard', () => {
    it('renders the name, pond, mood emoji and quack count', () => {
        const wrapper = mount(DuckCard, { props: { duck } });

        expect(wrapper.text()).toContain('Sir Quacks');
        expect(wrapper.text()).toContain('Big Pond');
        expect(wrapper.text()).toContain('😄');
        expect(wrapper.get('[data-testid="quack-btn"]').text()).toContain('7');
    });

    it('shows "Homeless" when the duck has no pond', () => {
        const wrapper = mount(DuckCard, { props: { duck: { ...duck, pond: null } } });

        expect(wrapper.text()).toContain('Homeless');
    });

    it('emits quack with the duck when the quack button is clicked', async () => {
        const wrapper = mount(DuckCard, { props: { duck } });

        await wrapper.get('[data-testid="quack-btn"]').trigger('click');

        expect(wrapper.emitted('quack')).toBeTruthy();
        expect(wrapper.emitted('quack')?.[0]).toEqual([duck]);
    });

    it('emits edit and release from their buttons', async () => {
        const wrapper = mount(DuckCard, { props: { duck } });

        await wrapper.get('[data-testid="edit-btn"]').trigger('click');
        await wrapper.get('[data-testid="release-btn"]').trigger('click');

        expect(wrapper.emitted('edit')).toBeTruthy();
        expect(wrapper.emitted('release')).toBeTruthy();
    });
});
