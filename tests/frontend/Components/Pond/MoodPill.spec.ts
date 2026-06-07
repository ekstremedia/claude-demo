import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import MoodPill from '@/Components/Pond/MoodPill.vue';

describe('MoodPill', () => {
    it('shows the emoji and label', () => {
        const wrapper = mount(MoodPill, { props: { emoji: '😴', label: 'Sleepy' } });

        expect(wrapper.text()).toContain('😴');
        expect(wrapper.text()).toContain('Sleepy');
    });
});
