import { describe, it, expect } from 'vitest';
import { boundsFor, hitTest, isInside, lerpAngle, pickTarget, randomPointIn } from '@/Components/Pond/pondGeometry';

const bounds = boundsFor(800, 450);

describe('pondGeometry', () => {
    it('keeps random points inside the ellipse', () => {
        const seq = [0.1, 0.9, 0.5, 0.3, 0.7, 0.2, 0.85, 0.15];
        let i = 0;
        const rng = () => seq[i++ % seq.length];

        for (let k = 0; k < 50; k++) {
            const p = randomPointIn(bounds, rng);
            expect(isInside(bounds, p.x, p.y)).toBe(true);
        }
    });

    it('finds the nearest point within the radius, or null', () => {
        const points = [
            { id: 1, x: 100, y: 100 },
            { id: 2, x: 300, y: 100 },
        ];

        expect(hitTest(points, 105, 102)).toBe(1);
        expect(hitTest(points, 500, 500)).toBeNull();
    });

    it('keeps a target near the origin for a small roam radius', () => {
        const from = { x: bounds.cx, y: bounds.cy };
        const target = pickTarget(bounds, from, 0.12);

        expect(Math.hypot(target.x - from.x, target.y - from.y)).toBeLessThan(0.13 * Math.min(bounds.rx, bounds.ry));
    });

    it('lerps an angle the short way across the ±π wrap', () => {
        // 3.0 → -3.0: the short arc is +0.28 (through ±π), not -6.0 back round.
        expect(lerpAngle(3.0, -3.0, 0.5)).toBeGreaterThan(3.0);
    });
});
