// Pure pond geometry + hit-testing. The random-number generator is injectable
// so these stay deterministic (and testable) — the engine passes Math.random.

export interface PondBounds {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
}

export interface Point {
    x: number;
    y: number;
}

/** Inset ellipse: pad in from the canvas box so ducks never clip the rim. */
export function boundsFor(width: number, height: number, inset = 0.12): PondBounds {
    return {
        cx: width / 2,
        cy: height / 2,
        rx: (width / 2) * (1 - inset),
        ry: (height / 2) * (1 - inset),
    };
}

/** Is (x, y) within the pond ellipse? */
export function isInside(b: PondBounds, x: number, y: number): boolean {
    const dx = (x - b.cx) / b.rx;
    const dy = (y - b.cy) / b.ry;
    return dx * dx + dy * dy <= 1;
}

/** A uniformly-distributed random point inside the ellipse (sqrt avoids centre bias). */
export function randomPointIn(b: PondBounds, rng: () => number = Math.random): Point {
    const t = 2 * Math.PI * rng();
    const u = Math.sqrt(rng());
    return { x: b.cx + b.rx * u * Math.cos(t), y: b.cy + b.ry * u * Math.sin(t) };
}

/** Pick the next swim target near `from`, biased by roamRadius and clamped inside the pond. */
export function pickTarget(b: PondBounds, from: Point, roamRadius: number, rng: () => number = Math.random): Point {
    const reach = roamRadius * Math.min(b.rx, b.ry);
    for (let i = 0; i < 8; i++) {
        const angle = 2 * Math.PI * rng();
        const dist = reach * (0.4 + 0.6 * rng());
        const x = from.x + Math.cos(angle) * dist;
        const y = from.y + Math.sin(angle) * dist;
        if (isInside(b, x, y)) {
            return { x, y };
        }
    }
    return randomPointIn(b, rng);
}

/** The id of the nearest point within `radius` of (px, py), or null if none. */
export function hitTest(points: ReadonlyArray<{ id: number; x: number; y: number }>, px: number, py: number, radius = 26): number | null {
    let best: number | null = null;
    let bestDist = radius * radius;
    for (const p of points) {
        const dx = p.x - px;
        const dy = p.y - py;
        const d = dx * dx + dy * dy;
        if (d <= bestDist) {
            bestDist = d;
            best = p.id;
        }
    }
    return best;
}

/** Lerp an angle toward `to` along the shortest arc (handles the ±π wrap). */
export function lerpAngle(from: number, to: number, t: number): number {
    let delta = (to - from) % (2 * Math.PI);
    if (delta > Math.PI) {
        delta -= 2 * Math.PI;
    }
    if (delta < -Math.PI) {
        delta += 2 * Math.PI;
    }
    return from + delta * t;
}
