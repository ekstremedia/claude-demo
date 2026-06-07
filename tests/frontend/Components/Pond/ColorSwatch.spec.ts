import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import ColorSwatch from '@/Components/Pond/ColorSwatch.vue';

describe('ColorSwatch', () => {
    it('renders the hex as an inline background colour', () => {
        const wrapper = mount(ColorSwatch, { props: { hex: '#38bdf8', label: 'Ocean Blue' } });

        // happy-dom may serialise the colour as hex or rgb — accept either.
        expect(wrapper.attributes('style')).toMatch(/#38bdf8|56,\s*189,\s*248/i);
        expect(wrapper.attributes('title')).toBe('Ocean Blue');
    });
});
