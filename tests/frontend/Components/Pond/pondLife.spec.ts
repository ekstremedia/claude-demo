import { describe, it, expect } from 'vitest';
import {
    BREED_CONTENT_MS,
    FLOCK_CAP,
    formatDuration,
    hungerLabel,
    isDeadByLife,
    LIFESPAN_MS,
    lifeColor,
    lifeFor,
    refillBread,
    shouldBreed,
} from '@/Components/Pond/pondLife';

const BORN = '2026-01-01T00:00:00.000Z';
const bornMs = Date.parse(BORN);

describe('pondLife', () => {
    describe('lifeFor', () => {
        it('is full right after feeding', () => {
            const fedAt = '2026-01-01T00:00:00.000Z';
            expect(lifeFor(fedAt, Date.parse(fedAt), BORN)).toBe(1);
        });

        it('decays linearly to half over half a lifespan', () => {
            const fedAt = '2026-01-01T00:00:00.000Z';
            const now = Date.parse(fedAt) + LIFESPAN_MS / 2;
            expect(lifeFor(fedAt, now, BORN)).toBeCloseTo(0.5, 5);
        });

        it('clamps to 0 once the lifespan has fully elapsed', () => {
            const fedAt = '2026-01-01T00:00:00.000Z';
            const now = Date.parse(fedAt) + LIFESPAN_MS * 2;
            expect(lifeFor(fedAt, now, BORN)).toBe(0);
        });

        it('clamps to 1 if the clock is behind the feeding (skew)', () => {
            const fedAt = '2026-01-01T00:00:10.000Z';
            expect(lifeFor(fedAt, Date.parse(fedAt) - 5_000, BORN)).toBe(1);
        });

        it('anchors to birth when never fed', () => {
            const now = bornMs + LIFESPAN_MS / 4;
            expect(lifeFor(null, now, BORN)).toBeCloseTo(0.75, 5);
        });

        it('returns full life for an unparseable anchor', () => {
            expect(lifeFor('not-a-date', 0, 'also-bad')).toBe(1);
        });
    });

    describe('isDeadByLife', () => {
        it('is dead only at or below zero', () => {
            expect(isDeadByLife(0)).toBe(true);
            expect(isDeadByLife(-0.1)).toBe(true);
            expect(isDeadByLife(0.01)).toBe(false);
        });
    });

    describe('hungerLabel', () => {
        it('buckets life into mood words', () => {
            expect(hungerLabel(1)).toBe('content');
            expect(hungerLabel(0.5)).toBe('peckish');
            expect(hungerLabel(0.3)).toBe('hungry');
            expect(hungerLabel(0.05)).toBe('starving');
        });
    });

    describe('lifeColor', () => {
        it('runs from red (starving) to green (full)', () => {
            expect(lifeColor(0)).toBe('hsl(0, 70%, 45%)');
            expect(lifeColor(1)).toBe('hsl(130, 70%, 45%)');
        });

        it('clamps out-of-range life', () => {
            expect(lifeColor(2)).toBe('hsl(130, 70%, 45%)');
            expect(lifeColor(-1)).toBe('hsl(0, 70%, 45%)');
        });
    });

    describe('refillBread', () => {
        it('adds one unit per refill interval', () => {
            expect(refillBread(5, 12, 1000, 1000)).toBe(6);
            expect(refillBread(5, 12, 500, 1000)).toBe(5.5);
        });

        it('never exceeds the max', () => {
            expect(refillBread(11.5, 12, 5000, 1000)).toBe(12);
            expect(refillBread(12, 12, 1000, 1000)).toBe(12);
        });

        it('is a no-op for non-positive elapsed or interval', () => {
            expect(refillBread(5, 12, 0, 1000)).toBe(5);
            expect(refillBread(5, 12, 1000, 0)).toBe(5);
        });
    });

    describe('formatDuration', () => {
        it('formats milliseconds as M:SS', () => {
            expect(formatDuration(0)).toBe('0:00');
            expect(formatDuration(9_000)).toBe('0:09');
            expect(formatDuration(75_000)).toBe('1:15');
            expect(formatDuration(600_000)).toBe('10:00');
        });

        it('clamps negative input to zero', () => {
            expect(formatDuration(-500)).toBe('0:00');
        });
    });

    describe('shouldBreed', () => {
        it('breeds a content duck that has waited long enough, under the cap', () => {
            expect(shouldBreed(0.9, BREED_CONTENT_MS, FLOCK_CAP - 1)).toBe(true);
        });

        it('will not breed when not content enough', () => {
            expect(shouldBreed(0.8, BREED_CONTENT_MS, 4)).toBe(false);
        });

        it('will not breed before the content window elapses', () => {
            expect(shouldBreed(0.95, BREED_CONTENT_MS - 1, 4)).toBe(false);
        });

        it('will not breed at or above the flock cap', () => {
            expect(shouldBreed(0.95, BREED_CONTENT_MS, FLOCK_CAP)).toBe(false);
        });
    });
});
