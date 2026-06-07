// Pure mood → motion mapping. No DOM, no GSAP — just data + a lookup, so it's
// trivially unit-testable. A duck's mood decides how it drifts around the pond.

export type MoodKey = 'happy' | 'sleepy' | 'excited' | 'zen' | 'grumpy';

export interface MotionProfile {
    /** Seconds for one swim leg, picked randomly within [min, max]. */
    durationRange: [number, number];
    /** GSAP ease for the leg. */
    ease: string;
    /** How far a new target may sit from the current spot, as a fraction of the pond half-extent. */
    roamRadius: number;
    /** Vertical bob height, in px. */
    bobAmplitude: number;
    /** Bob cycles per second. */
    bobFrequency: number;
    /** Idle pause between legs, in seconds, picked randomly within [min, max]. */
    idleRange: [number, number];
    /** 0 = lazy, loose turns; 1 = snappy heading changes. */
    turnSharpness: number;
    /** How a leg is traced: straight, gently curved, or small fidgety hops. */
    pathStyle: 'direct' | 'arc' | 'jitter';
}

export const MOOD_PROFILES: Record<MoodKey, MotionProfile> = {
    // Lively, wanders the whole pond with a cheerful bob.
    happy: { durationRange: [2.2, 3.4], ease: 'sine.inOut', roamRadius: 0.55, bobAmplitude: 4, bobFrequency: 0.9, idleRange: [0.2, 0.8], turnSharpness: 0.5, pathStyle: 'direct' },
    // Barely drifts: long legs, tiny roam, long dozy pauses.
    sleepy: { durationRange: [5.5, 8], ease: 'sine.inOut', roamRadius: 0.18, bobAmplitude: 2, bobFrequency: 0.35, idleRange: [2.5, 5], turnSharpness: 0.15, pathStyle: 'direct' },
    // Darts about: short snappy legs, almost no idle, sharp turns.
    excited: { durationRange: [0.7, 1.3], ease: 'power2.out', roamRadius: 0.75, bobAmplitude: 6, bobFrequency: 1.6, idleRange: [0, 0.25], turnSharpness: 0.9, pathStyle: 'direct' },
    // Serene: slow, smooth, traces gentle arcs.
    zen: { durationRange: [4, 6], ease: 'sine.inOut', roamRadius: 0.45, bobAmplitude: 3, bobFrequency: 0.5, idleRange: [1, 2], turnSharpness: 0.25, pathStyle: 'arc' },
    // Fidgets in a small territory with abrupt little hops.
    grumpy: { durationRange: [1.4, 2.4], ease: 'power1.inOut', roamRadius: 0.12, bobAmplitude: 2.5, bobFrequency: 1.1, idleRange: [0.8, 2.2], turnSharpness: 0.7, pathStyle: 'jitter' },
};

/** Look up a motion profile, defaulting to `happy` for any unknown mood value. */
export function profileFor(moodValue: string): MotionProfile {
    return MOOD_PROFILES[moodValue as MoodKey] ?? MOOD_PROFILES.happy;
}
