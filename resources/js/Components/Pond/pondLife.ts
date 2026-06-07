// Pure survival maths. No DOM, no GSAP — trivially unit-testable. The client and
// the server both derive a duck's life from the same timestamps; the client uses
// its own clock, which is fine (a few seconds of skew is invisible at a
// multi-minute lifespan). Mirror of Duck::LIFESPAN_SECONDS on the PHP side.

/** Time from a full belly to starvation, in milliseconds. */
export const LIFESPAN_MS = 60_000;

export type Hunger = 'content' | 'peckish' | 'hungry' | 'starving';

/**
 * A duck's life in [0, 1], decaying linearly. Anchored to the last feeding, or
 * to when it was born (`bornAtISO` / created_at) if it has never been fed.
 */
export function lifeFor(lastFedAtISO: string | null, nowMs: number, bornAtISO: string): number {
    const anchor = Date.parse(lastFedAtISO ?? bornAtISO);
    if (Number.isNaN(anchor)) {
        return 1;
    }
    const life = 1 - (nowMs - anchor) / LIFESPAN_MS;
    return Math.min(1, Math.max(0, life));
}

/** A duck with no life left has starved. */
export function isDeadByLife(life: number): boolean {
    return life <= 0;
}

/** Bucketed hunger for the hover label. */
export function hungerLabel(life: number): Hunger {
    if (life > 0.66) {
        return 'content';
    }
    if (life > 0.4) {
        return 'peckish';
    }
    if (life > 0.15) {
        return 'hungry';
    }
    return 'starving';
}

/** Life-bar colour: green when full, through amber, to red when starving. */
export function lifeColor(life: number): string {
    const hue = Math.round(130 * Math.min(1, Math.max(0, life)));
    return `hsl(${hue}, 70%, 45%)`;
}

/**
 * The bread budget regenerates over time. Returns the new level, capped at `max`.
 * Pure (no clock) so the engine can drive it from elapsed-time deltas and tests
 * can drive it directly.
 */
export function refillBread(current: number, max: number, elapsedMs: number, refillMs: number): number {
    if (refillMs <= 0 || elapsedMs <= 0) {
        return Math.min(max, current);
    }
    return Math.min(max, current + elapsedMs / refillMs);
}

/** How long a duck must stay content before it lays an egg, in milliseconds. */
export const BREED_CONTENT_MS = 18_000;

/** Max living ducks before breeding stops (mirrors DuckController::FLOCK_CAP). */
export const FLOCK_CAP = 16;

/**
 * A well-fed duck breeds: content (life above the threshold) for long enough,
 * while the flock is below the cap. Pure so the engine and tests share the rule.
 */
export function shouldBreed(life: number, contentForMs: number, flockSize: number): boolean {
    return life > 0.85 && contentForMs >= BREED_CONTENT_MS && flockSize < FLOCK_CAP;
}

/** Format a span of milliseconds as `M:SS` for the survival-time readout. */
export function formatDuration(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
