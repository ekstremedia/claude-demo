import { describe, it, expect } from 'vitest';
import { MOOD_PROFILES, profileFor } from '@/Components/Pond/duckMoods';

describe('profileFor', () => {
    it.each(['happy', 'sleepy', 'excited', 'zen', 'grumpy'] as const)('returns the %s profile', (mood) => {
        expect(profileFor(mood)).toBe(MOOD_PROFILES[mood]);
    });

    it('falls back to happy for an unknown mood', () => {
        expect(profileFor('nonsense')).toBe(MOOD_PROFILES.happy);
    });

    it('sleepy roams less and idles longer than excited', () => {
        expect(MOOD_PROFILES.sleepy.roamRadius).toBeLessThan(MOOD_PROFILES.excited.roamRadius);
        expect(MOOD_PROFILES.sleepy.idleRange[0]).toBeGreaterThan(MOOD_PROFILES.excited.idleRange[0]);
    });

    it('only zen traces gentle arcs', () => {
        expect(MOOD_PROFILES.zen.pathStyle).toBe('arc');

        for (const mood of ['happy', 'sleepy', 'excited', 'grumpy'] as const) {
            expect(MOOD_PROFILES[mood].pathStyle).not.toBe('arc');
        }
    });
});
