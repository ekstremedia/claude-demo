import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import StatBadge from '@/Components/Pond/StatBadge.vue';

describe('StatBadge', () => {
    it('renders the label and value', () => {
        const wrapper = mount(StatBadge, { props: { label: 'Ducks', value: 21, icon: '🦆' } });

        expect(wrapper.text()).toContain('Ducks');
        expect(wrapper.get('[data-testid="stat-value"]').text()).toBe('21');
    });
});
