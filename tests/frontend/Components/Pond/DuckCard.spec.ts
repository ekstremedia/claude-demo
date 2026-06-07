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
    adopted_at: '2026-01-01',
    bio: null,
};

describe('DuckCard', () => {
    it('renders the name, pond and mood', () => {
        const wrapper = mount(DuckCard, { props: { duck } });

        expect(wrapper.text()).toContain('Sir Quacks');
        expect(wrapper.text()).toContain('Big Pond');
        expect(wrapper.text()).toContain('😄');
    });

    it('shows "Homeless" when the duck has no pond', () => {
        const wrapper = mount(DuckCard, { props: { duck: { ...duck, pond: null } } });

        expect(wrapper.text()).toContain('Homeless');
    });

    it('emits edit and release from their buttons', async () => {
        const wrapper = mount(DuckCard, { props: { duck } });

        await wrapper.get('[data-testid="edit-btn"]').trigger('click');
        await wrapper.get('[data-testid="release-btn"]').trigger('click');

        expect(wrapper.emitted('edit')).toBeTruthy();
        expect(wrapper.emitted('release')).toBeTruthy();
    });
});
