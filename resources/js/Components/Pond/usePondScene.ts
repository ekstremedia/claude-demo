import gsap from 'gsap';
import { onMounted, onUnmounted, watch, type Ref } from 'vue';
import type { Duck } from '@/types/pond';
import { profileFor, type MotionProfile } from '@/Components/Pond/duckMoods';
import { hungerLabel, isDeadByLife, lifeColor, lifeFor, refillBread, shouldBreed } from '@/Components/Pond/pondLife';
import {
    boundsFor,
    hitTest,
    isInside,
    lerpAngle,
    nearestUnclaimedCrumb,
    pickTarget,
    randomPointIn,
    type PondBounds,
} from '@/Components/Pond/pondGeometry';

/**
 * Runtime state for one duck. Deliberately a plain object (never made reactive)
 * — it's mutated every frame, so Vue's reactivity must stay out of it.
 */
interface Sprite {
    data: Duck;
    x: number;
    y: number;
    heading: number;
    bobPhase: number;
    profile: MotionProfile;
    highlight: number;
    target: { x: number; y: number };
    tween: gsap.core.Tween | null;
    life: number; // 0..1, recomputed each frame from data
    dead: boolean;
    eating: boolean; // beelining to / pecking at a crumb (mood swim suspended)
    claimedCrumb: number | null;
    eatPop: number; // one-shot nibble scale
    peck: number; // 0..1 head-bow toward the water while eating
    bellyFlip: number; // 0..1 flip-to-belly-up on death
    spawn: number; // 0..1 grow-in when a duckling hatches
    contentSinceMs: number; // performance.now() since continuously content (0 = not)
}

interface Crumb {
    id: number;
    x: number;
    y: number;
    claimedBy: number | null;
    eaten: boolean;
    bornMs: number;
    sink: number; // 0..1 fade once it has sat too long
}

interface Ripple {
    x: number;
    y: number;
    start: number; // gsap.ticker.time at spawn
    kind: 'plop' | 'eat';
}

/** A hawk that dives at a duck. Click it in time to scare it off, or it grabs the duck. */
interface Predator {
    x: number;
    y: number;
    targetId: number;
    phase: 'dive' | 'flee';
    spawnMs: number; // performance.now() at spawn — the grab window counts from here
}

/** Live HUD numbers pushed (throttled) from the engine to the Vue overlay. */
export interface PondStats {
    ducksAlive: number;
    crumbsEaten: number;
    breadCurrent: number;
    breadMax: number;
}

/** Callbacks the page wires to Inertia (edit / persist feeds / persist deaths / game over / HUD). */
export interface PondSceneHandlers {
    onSelect: (duck: Duck) => void;
    onFeed: (ids: number[]) => void;
    onDie: (ids: number[]) => void;
    onAllDead: (allDead: boolean) => void;
    onStats: (stats: PondStats) => void;
    onHatch: (parentId: number) => void;
}

const CRUMB_TTL_MS = 12_000;
const FOOD_SPEED = 130; // px/s — ducks dash to food faster than they wander
const BREAD_MAX = 12; // crumbs you can have banked
const BREAD_REFILL_MS = 1000; // one crumb's worth of bread regenerates per second
const STATS_INTERVAL_MS = 200; // HUD push cadence
const PREDATOR_MIN_DELAY_MS = 10_000; // shortest gap between hawk attacks
const PREDATOR_MAX_DELAY_MS = 18_000; // longest gap between hawk attacks
const PREDATOR_WINDOW_MS = 3_500; // time to click the hawk before it grabs the duck
const PREDATOR_HIT_RADIUS = 28; // click forgiveness around the hawk
const HATCH_COOLDOWN_MS = 5_000; // min gap between ducklings (one round-trip + breathing room)

/**
 * The imperative pond engine: GSAP-driven motion + a canvas render loop on GSAP's
 * ticker. Ducks drift by mood, get hungry over time, race to breadcrumbs you drop
 * and eat them (refilling life), and starve to death if neglected. Hover/click
 * hit-testing, live reconciliation, resize and full teardown included. All side
 * effects live in onMounted/onUnmounted, so the component stays import/SSR-safe.
 */
export function usePondScene(
    canvasRef: Ref<HTMLCanvasElement | null>,
    containerRef: Ref<HTMLElement | null>,
    ducks: () => Duck[],
    handlers: PondSceneHandlers,
) {
    let ctx: CanvasRenderingContext2D | null = null;
    let sprites: Sprite[] = [];
    let crumbs: Crumb[] = [];
    let ripples: Ripple[] = [];
    let crumbSeq = 0;
    let bounds: PondBounds = boundsFor(800, 450);
    let cssW = 800;
    let cssH = 450;
    let dpr = 1;
    let running = false;
    let reducedMotion = false;
    let hoverId: number | null = null;
    let lastAllDead = false;
    let crumbsEaten = 0;
    let bread = BREAD_MAX;
    let lastBreadMs = 0;
    let lastStatsMs = 0;
    let predator: Predator | null = null;
    let predatorTimer: ReturnType<typeof setTimeout> | null = null;
    let lastHatchMs = 0;
    let firstReconcileDone = false;
    let observer: ResizeObserver | null = null;
    const feedQueue = new Set<number>();
    const dieQueue = new Set<number>();
    let feedTimer: ReturnType<typeof setTimeout> | null = null;
    let dieTimer: ReturnType<typeof setTimeout> | null = null;

    // --- Motion ------------------------------------------------------------

    function scheduleSwim(s: Sprite): void {
        const p = s.profile;
        const target = pickTarget(bounds, { x: s.x, y: s.y }, p.roamRadius);
        s.target = target;
        const duration = gsap.utils.random(p.durationRange[0], p.durationRange[1]);
        const delay = gsap.utils.random(p.idleRange[0], p.idleRange[1]);

        if (p.pathStyle === 'arc') {
            // Trace a gentle curve via a quadratic bezier bent perpendicular to the leg.
            const sx = s.x;
            const sy = s.y;
            let nx = -(target.y - sy);
            let ny = target.x - sx;
            const len = Math.hypot(nx, ny) || 1;
            nx /= len;
            ny /= len;
            const bend = gsap.utils.random(-0.3, 0.3) * len;
            const cx = (sx + target.x) / 2 + nx * bend;
            const cy = (sy + target.y) / 2 + ny * bend;
            const proxy = { t: 0 };
            s.tween = gsap.to(proxy, {
                t: 1,
                duration,
                delay,
                ease: p.ease,
                onUpdate: () => {
                    const u = proxy.t;
                    const iu = 1 - u;
                    s.x = iu * iu * sx + 2 * iu * u * cx + u * u * target.x;
                    s.y = iu * iu * sy + 2 * iu * u * cy + u * u * target.y;
                },
                onComplete: () => scheduleSwim(s),
            });
            return;
        }

        s.tween = gsap.to(s, {
            x: target.x,
            y: target.y,
            duration,
            delay,
            ease: p.ease,
            onComplete: () => scheduleSwim(s),
        });
    }

    /** A slow, aimless drift for a dead duck floating belly-up. */
    function limpDrift(s: Sprite): void {
        if (!running || reducedMotion) {
            return;
        }
        const target = pickTarget(bounds, { x: s.x, y: s.y }, 0.15);
        s.tween = gsap.to(s, {
            x: target.x,
            y: target.y,
            duration: gsap.utils.random(8, 14),
            ease: 'sine.inOut',
            onComplete: () => limpDrift(s),
        });
    }

    // --- Survival ----------------------------------------------------------

    function dropFood(x: number, y: number): void {
        if (!isInside(bounds, x, y)) {
            return;
        }
        // Each crumb spends one bread from the budget — you can't spam-feed.
        const affordable = Math.floor(bread);
        if (affordable < 1) {
            return;
        }
        // A wider, pond-relative scatter so a toss fans out and ducks spread to
        // different crumbs instead of clumping over one spot.
        const spread = Math.min(bounds.rx, bounds.ry) * 0.18;
        const n = Math.min(4 + Math.floor(Math.random() * 3), affordable);
        let placed = 0;
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * spread;
            const cx = x + Math.cos(a) * r;
            const cy = y + Math.sin(a) * r;
            // Keep the scatter inside the pond — a crumb just past the rim would
            // otherwise lure a duck out of bounds chasing it.
            if (!isInside(bounds, cx, cy)) {
                continue;
            }
            crumbs.push({
                id: crumbSeq++,
                x: cx,
                y: cy,
                claimedBy: null,
                eaten: false,
                bornMs: performance.now(),
                sink: 0,
            });
            placed++;
        }
        if (placed > 0) {
            bread = Math.max(0, bread - placed);
            ripples.push({ x, y, start: gsap.ticker.time, kind: 'plop' });
        }
    }

    function updateFeeding(): void {
        const now = performance.now();
        for (const c of crumbs) {
            if (!c.eaten && now - c.bornMs > CRUMB_TTL_MS) {
                c.sink = Math.min(1, c.sink + 0.02);
            }
        }
        crumbs = crumbs.filter((c) => !c.eaten && c.sink < 1);

        if (!crumbs.some((c) => c.claimedBy === null && !c.eaten)) {
            return;
        }

        // Hungriest alive ducks claim first, so a starving duck wins the race.
        const seekers = sprites.filter((s) => !s.dead && !s.eating).sort((a, b) => a.life - b.life);
        for (const s of seekers) {
            const cid = nearestUnclaimedCrumb(s, crumbs);
            if (cid === null) {
                break;
            }
            const crumb = crumbs.find((c) => c.id === cid);
            if (!crumb) {
                continue;
            }
            crumb.claimedBy = s.data.id;
            s.claimedCrumb = cid;
            s.eating = true;
            s.tween?.kill();
            s.target = { x: crumb.x, y: crumb.y };
            if (reducedMotion) {
                // Accessibility path: no sprint animation — relocate instantly and eat.
                s.tween = null;
                s.x = crumb.x;
                s.y = crumb.y;
                eatCrumb(s, cid);
                continue;
            }
            const dist = Math.hypot(crumb.x - s.x, crumb.y - s.y);
            const dur = Math.min(1.6, Math.max(0.35, dist / FOOD_SPEED));
            s.tween = gsap.to(s, {
                x: crumb.x,
                y: crumb.y,
                duration: dur,
                ease: 'power2.out',
                overwrite: 'auto',
                onComplete: () => startEating(s, cid),
            });
        }
    }

    /** On arrival at the crumb: bow the head and peck a couple of times, then consume. */
    function startEating(s: Sprite, crumbId: number): void {
        if (reducedMotion) {
            eatCrumb(s, crumbId);
            return;
        }
        // peck 0→1→0 twice (yoyo, repeat 3), then swallow on completion.
        s.tween = gsap.to(s, {
            peck: 1,
            duration: 0.2,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: 3,
            overwrite: 'auto',
            onComplete: () => eatCrumb(s, crumbId),
        });
    }

    function eatCrumb(s: Sprite, crumbId: number): void {
        s.eating = false;
        s.claimedCrumb = null;
        s.peck = 0;
        const crumb = crumbs.find((c) => c.id === crumbId);
        if (crumb) {
            crumb.eaten = true;
            if (reducedMotion) {
                s.eatPop = 0;
            } else {
                ripples.push({ x: crumb.x, y: crumb.y, start: gsap.ticker.time, kind: 'eat' });
                s.eatPop = 1;
                gsap.to(s, { eatPop: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
            }
            // Optimistic: refill life + bump last_fed_at locally so the bar doesn't
            // snap back before the batched POST round-trips.
            s.data = { ...s.data, last_fed_at: new Date().toISOString() };
            s.life = 1;
            crumbsEaten++;
            queueFeed(s.data.id);
        }
        if (running && !reducedMotion && !s.dead) {
            scheduleSwim(s);
        }
    }

    function updateLife(nowMs: number): void {
        let died = false;
        for (const s of sprites) {
            if (s.dead) {
                continue;
            }
            s.life = lifeFor(s.data.last_fed_at, nowMs, s.data.created_at);
            if (isDeadByLife(s.life)) {
                killSprite(s);
                died = true;
            }
        }
        if (died) {
            evaluateAllDead();
        }
    }

    /**
     * Well-fed ducks breed: a duck that stays content long enough lays an egg,
     * and we ask the server to hatch a duckling (which flows back in via reconcile,
     * growing the flock and the feeding load).
     */
    function updateBreeding(wallMs: number): void {
        const flockSize = sprites.reduce((n, sp) => n + (sp.dead ? 0 : 1), 0);
        for (const s of sprites) {
            if (s.dead) {
                continue;
            }
            if (s.life <= 0.85) {
                s.contentSinceMs = 0;
                continue;
            }
            if (s.contentSinceMs === 0) {
                s.contentSinceMs = wallMs;
            }
            const contentFor = wallMs - s.contentSinceMs;
            if (wallMs - lastHatchMs > HATCH_COOLDOWN_MS && shouldBreed(s.life, contentFor, flockSize)) {
                lastHatchMs = wallMs;
                s.contentSinceMs = wallMs; // start the parent's clock over
                handlers.onHatch(s.data.id);
            }
        }
    }

    function killSprite(s: Sprite): void {
        if (s.dead) {
            return;
        }
        s.dead = true;
        s.eating = false;
        s.peck = 0;
        s.life = 0;
        s.highlight = 0;
        s.tween?.kill();
        gsap.killTweensOf(s);
        if (s.claimedCrumb !== null) {
            const crumb = crumbs.find((c) => c.id === s.claimedCrumb);
            if (crumb) {
                crumb.claimedBy = null;
            }
            s.claimedCrumb = null;
        }
        s.bellyFlip = 0;
        gsap.to(s, { bellyFlip: 1, duration: 0.6, ease: 'power2.inOut' });
        limpDrift(s);
        queueDie(s.data.id);
    }

    function evaluateAllDead(): void {
        const allDead = sprites.length > 0 && sprites.every((s) => s.dead);
        if (allDead !== lastAllDead) {
            lastAllDead = allDead;
            if (!allDead) {
                // A fresh run begins (first spawn or a restock) — reset the run score and bread.
                crumbsEaten = 0;
                bread = BREAD_MAX;
                armPredator();
            } else {
                // Nothing left to hunt — call off the hawk.
                clearPredator();
            }
            handlers.onAllDead(allDead);
        }
    }

    function queueFeed(id: number): void {
        feedQueue.add(id);
        feedTimer ??= setTimeout(() => {
            const ids = [...feedQueue];
            feedQueue.clear();
            feedTimer = null;
            if (ids.length) {
                handlers.onFeed(ids);
            }
        }, 1000);
    }

    function queueDie(id: number): void {
        dieQueue.add(id);
        dieTimer ??= setTimeout(() => {
            const ids = [...dieQueue];
            dieQueue.clear();
            dieTimer = null;
            if (ids.length) {
                handlers.onDie(ids);
            }
        }, 1000);
    }

    // --- Predator (hawk) ---------------------------------------------------

    /** Schedule the next hawk attack after a random gap. No-op under reduced motion. */
    function armPredator(): void {
        if (reducedMotion) {
            return;
        }
        if (predatorTimer !== null) {
            clearTimeout(predatorTimer);
        }
        const delay = gsap.utils.random(PREDATOR_MIN_DELAY_MS, PREDATOR_MAX_DELAY_MS);
        predatorTimer = setTimeout(() => {
            predatorTimer = null;
            spawnPredator();
        }, delay);
    }

    function clearPredator(): void {
        predator = null;
        if (predatorTimer !== null) {
            clearTimeout(predatorTimer);
            predatorTimer = null;
        }
    }

    function spawnPredator(): void {
        if (!running || predator || lastAllDead) {
            return;
        }
        const prey = sprites.filter((s) => !s.dead);
        if (!prey.length) {
            armPredator();
            return;
        }
        const target = prey[Math.floor(Math.random() * prey.length)];
        // Swoop in from above the pond toward the chosen duck.
        predator = {
            x: gsap.utils.random(cssW * 0.2, cssW * 0.8),
            y: -40,
            targetId: target.data.id,
            phase: 'dive',
            spawnMs: performance.now(),
        };
    }

    /** Clicking the hawk in time scares it off. */
    function scarePredator(): void {
        if (predator) {
            predator.phase = 'flee';
        }
    }

    function updatePredator(): void {
        if (!predator) {
            return;
        }
        if (predator.phase === 'dive') {
            const target = sprites.find((s) => s.data.id === predator!.targetId && !s.dead);
            if (!target) {
                predator.phase = 'flee';
                return;
            }
            predator.x += (target.x - predator.x) * 0.06;
            predator.y += (target.y - predator.y) * 0.06;
            if (performance.now() - predator.spawnMs > PREDATOR_WINDOW_MS) {
                // Window elapsed unscared — the hawk grabs the duck and carries it off.
                killSprite(target);
                if (predator) {
                    predator.phase = 'flee';
                }
            }
        } else {
            predator.y -= 9;
            predator.x += predator.x < cssW / 2 ? -6 : 6;
            if (predator.y < -60 || predator.x < -60 || predator.x > cssW + 60) {
                predator = null;
                armPredator();
            }
        }
    }

    // --- Rendering ---------------------------------------------------------

    function drawWater(): void {
        if (!ctx) {
            return;
        }
        const g = ctx.createLinearGradient(0, 0, 0, cssH);
        g.addColorStop(0, '#bae6fd');
        g.addColorStop(0.55, '#38bdf8');
        g.addColorStop(1, '#0e7490');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, cssW, cssH);
        // soft glossy sheen near the top
        ctx.save();
        ctx.globalAlpha = 0.18;
        const sheen = ctx.createRadialGradient(cssW * 0.5, -cssH * 0.2, 0, cssW * 0.5, -cssH * 0.2, cssH * 0.9);
        sheen.addColorStop(0, '#ffffff');
        sheen.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sheen;
        ctx.fillRect(0, 0, cssW, cssH);
        ctx.restore();
    }

    function drawShadow(s: Sprite): void {
        if (!ctx) {
            return;
        }
        ctx.save();
        ctx.globalAlpha = s.dead ? 0.1 : 0.16;
        ctx.fillStyle = '#0c4a6e';
        ctx.beginPath();
        ctx.ellipse(s.x, s.y + 18, 22, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawCrumbs(): void {
        if (!ctx) {
            return;
        }
        for (const c of crumbs) {
            ctx.save();
            ctx.globalAlpha = 0.9 * (1 - c.sink);
            ctx.fillStyle = '#d6bb86';
            ctx.beginPath();
            ctx.ellipse(c.x, c.y + c.sink * 4, 2.6, 2.2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function drawRipples(time: number): void {
        if (!ctx) {
            return;
        }
        ripples = ripples.filter((r) => time - r.start < 0.9);
        for (const r of ripples) {
            const t = (time - r.start) / 0.9;
            const maxR = r.kind === 'plop' ? 18 : 9;
            ctx.save();
            ctx.globalAlpha = (1 - t) * 0.5;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(r.x, r.y, t * maxR, t * maxR * 0.6, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    function drawPredator(): void {
        if (!ctx || !predator) {
            return;
        }
        // A shrinking red ring warns which duck is in the hawk's sights.
        if (predator.phase === 'dive') {
            const target = sprites.find((s) => s.data.id === predator!.targetId && !s.dead);
            if (target) {
                const t = Math.min(1, (performance.now() - predator.spawnMs) / PREDATOR_WINDOW_MS);
                ctx.save();
                ctx.globalAlpha = 0.35 + 0.45 * t;
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(target.x, target.y, 18 + 30 * (1 - t), 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }
        // The hawk: a dark winged silhouette.
        ctx.save();
        ctx.translate(predator.x, predator.y);
        ctx.fillStyle = '#1f2937';
        ctx.shadowColor = 'rgba(8,47,73,0.3)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 6;
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.lineTo(-20, -11);
        ctx.lineTo(-6, 3);
        ctx.closePath();
        ctx.moveTo(0, -2);
        ctx.lineTo(20, -11);
        ctx.lineTo(6, 3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function drawDuck(s: Sprite, bob: number): void {
        if (!ctx) {
            return;
        }
        const flip = Math.cos(s.heading) < 0 ? -1 : 1;
        const pop = (1 + s.eatPop * 0.18 + s.highlight * 0.08) * s.spawn;
        const vy = s.dead ? 1 - 2 * s.bellyFlip : 1; // flip belly-up on death
        // Bow-to-peck: the head/beak/eye dip down-and-forward toward the water.
        // Done in local space (where +y is screen-down regardless of facing) so it
        // stays correct for left- and right-facing ducks — never rotate the sprite.
        const dipY = s.peck * 11;
        const dipX = s.peck * 3;
        ctx.save();
        ctx.translate(s.x, s.y + (s.dead ? 0 : bob) + s.peck * 2);
        ctx.scale(flip * pop, vy * pop);
        // soft drop shadow on the body itself (glossy lift)
        ctx.shadowColor = 'rgba(8,47,73,0.25)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = s.dead ? desaturate(s.data.color.hex) : s.data.color.hex;
        // body
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        // head (dips toward the water while pecking)
        ctx.beginPath();
        ctx.ellipse(15 + dipX, -11 + dipY, 10, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        // glossy white highlight
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-5, -7, 9, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // beak — follows the head, and its tip pitches further down into the water
        const beakTipDip = s.peck * 4;
        ctx.fillStyle = '#fb923c';
        ctx.beginPath();
        ctx.moveTo(23 + dipX, -12 + dipY);
        ctx.lineTo(33 + dipX, -10 + dipY + beakTipDip);
        ctx.lineTo(23 + dipX, -7.5 + dipY);
        ctx.closePath();
        ctx.fill();
        // eye — a dot when alive, an X when dead
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#1e293b';
        if (s.dead) {
            ctx.lineWidth = 1.6;
            drawX(ctx, 18, -13, 2.6);
        } else {
            ctx.beginPath();
            ctx.arc(18 + dipX, -13 + dipY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function drawLifeBar(s: Sprite): void {
        if (!ctx || s.dead) {
            return;
        }
        const w = 28;
        const h = 4;
        const x = s.x - w / 2;
        const y = s.y + 24;
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = 'rgba(15,23,42,0.25)';
        roundRect(ctx, x, y, w, h, 2);
        ctx.fill();
        ctx.fillStyle = lifeColor(s.life);
        roundRect(ctx, x, y, Math.max(2, w * s.life), h, 2);
        ctx.fill();
        ctx.restore();
    }

    function drawLabel(s: Sprite, bob: number): void {
        if (!ctx) {
            return;
        }
        const status = s.dead ? '💀' : hungerLabel(s.life);
        const text = `${s.data.name} · ${status}`;
        ctx.save();
        ctx.globalAlpha = s.highlight;
        ctx.font = '600 13px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const width = ctx.measureText(text).width + 18;
        const lx = s.x;
        const ly = s.y + (s.dead ? 0 : bob) - 30;
        ctx.fillStyle = 'rgba(15,23,42,0.82)';
        roundRect(ctx, lx - width / 2, ly - 11, width, 22, 11);
        ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(text, lx, ly);
        ctx.restore();
    }

    function tick(): void {
        if (!ctx) {
            return;
        }
        const time = gsap.ticker.time;
        const wallMs = performance.now();
        // Regenerate the bread budget from elapsed wall-clock time.
        if (lastBreadMs === 0) {
            lastBreadMs = wallMs;
        }
        bread = refillBread(bread, BREAD_MAX, wallMs - lastBreadMs, BREAD_REFILL_MS);
        lastBreadMs = wallMs;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);
        drawWater();
        updateLife(Date.now());
        updateBreeding(wallMs);
        updateFeeding();
        updatePredator();
        drawCrumbs();
        drawRipples(time);

        // Throttled HUD push.
        if (wallMs - lastStatsMs > STATS_INTERVAL_MS) {
            lastStatsMs = wallMs;
            handlers.onStats({
                ducksAlive: sprites.reduce((n, sp) => n + (sp.dead ? 0 : 1), 0),
                crumbsEaten,
                breadCurrent: bread,
                breadMax: BREAD_MAX,
            });
        }

        for (const s of sprites) {
            if (!s.dead && !reducedMotion) {
                const want = Math.atan2(s.target.y - s.y, s.target.x - s.x);
                s.heading = lerpAngle(s.heading, want, s.profile.turnSharpness * 0.2);
            }
            const bob = s.dead || s.peck > 0.01
                ? 0
                : reducedMotion
                  ? Math.sin(time * 0.4 + s.bobPhase) * 1.5
                  : Math.sin(time * s.profile.bobFrequency * Math.PI * 2 + s.bobPhase) * s.profile.bobAmplitude;
            drawShadow(s);
            drawDuck(s, bob);
            drawLifeBar(s);
            if (s.highlight > 0.01) {
                drawLabel(s, bob);
            }
        }

        drawPredator();
    }

    // --- Layout ------------------------------------------------------------

    function resize(): void {
        const el = containerRef.value;
        const canvas = canvasRef.value;
        if (!el || !canvas || !ctx) {
            return;
        }
        const rect = el.getBoundingClientRect();
        cssW = Math.max(1, rect.width);
        cssH = Math.max(1, rect.height);
        dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
        bounds = boundsFor(cssW, cssH);
        for (const s of sprites) {
            if (!isInside(bounds, s.x, s.y)) {
                const p = randomPointIn(bounds);
                s.x = p.x;
                s.y = p.y;
            }
            // The in-flight leg aimed at the old bounds — restart it in the new pond.
            if (running && !reducedMotion) {
                if (s.dead) {
                    s.tween?.kill();
                    limpDrift(s);
                } else if (!s.eating) {
                    s.tween?.kill();
                    scheduleSwim(s);
                }
            }
        }
    }

    // --- Reconciliation ----------------------------------------------------

    function reconcile(): void {
        const next = ducks();
        const nowMs = Date.now();
        const byId = new Map(sprites.map((s) => [s.data.id, s]));
        const keep = new Set<number>();

        for (const duck of next) {
            keep.add(duck.id);
            const existing = byId.get(duck.id);
            if (!existing) {
                // A duck that appears after the initial load is a freshly hatched
                // duckling — grow it in. Ducks present on first load just exist.
                const hatched = firstReconcileDone && duck.died_at === null;
                const p = randomPointIn(bounds);
                const sprite: Sprite = {
                    data: duck,
                    x: p.x,
                    y: p.y,
                    heading: Math.random() * Math.PI * 2,
                    bobPhase: Math.random() * Math.PI * 2,
                    profile: profileFor(duck.mood.value),
                    highlight: 0,
                    target: p,
                    tween: null,
                    life: lifeFor(duck.last_fed_at, nowMs, duck.created_at),
                    dead: duck.died_at !== null,
                    eating: false,
                    claimedCrumb: null,
                    eatPop: 0,
                    peck: 0,
                    bellyFlip: duck.died_at !== null ? 1 : 0,
                    spawn: hatched ? 0 : 1,
                    contentSinceMs: 0,
                };
                sprites.push(sprite);
                if (hatched && !reducedMotion) {
                    gsap.to(sprite, { spawn: 1, duration: 0.5, ease: 'back.out(2)' });
                } else {
                    sprite.spawn = 1;
                }
                if (running && !reducedMotion) {
                    sprite.dead ? limpDrift(sprite) : scheduleSwim(sprite);
                }
            } else {
                const wasDead = existing.dead;
                const moodChanged = existing.data.mood.value !== duck.mood.value;
                existing.data = duck;
                if (wasDead && duck.died_at === null) {
                    // revived by a restock
                    existing.dead = false;
                    existing.bellyFlip = 0;
                    existing.life = lifeFor(duck.last_fed_at, nowMs, duck.created_at);
                    existing.tween?.kill();
                    if (running && !reducedMotion) {
                        scheduleSwim(existing);
                    }
                } else if (!wasDead && duck.died_at !== null) {
                    // server-authoritative death (lazy reap on index)
                    killSprite(existing);
                } else if (moodChanged && !existing.dead) {
                    existing.profile = profileFor(duck.mood.value);
                    existing.tween?.kill();
                    if (running && !reducedMotion) {
                        scheduleSwim(existing);
                    }
                }
            }
        }

        for (let i = sprites.length - 1; i >= 0; i--) {
            if (!keep.has(sprites[i].data.id)) {
                sprites[i].tween?.kill();
                gsap.killTweensOf(sprites[i]);
                sprites.splice(i, 1);
            }
        }

        evaluateAllDead();
        firstReconcileDone = true;
    }

    // --- Pointer -----------------------------------------------------------

    function points(): Array<{ id: number; x: number; y: number }> {
        return sprites.map((s) => ({ id: s.data.id, x: s.x, y: s.y }));
    }

    function applyHighlight(id: number | null): void {
        if (id === hoverId) {
            return;
        }
        hoverId = id;
        for (const s of sprites) {
            gsap.to(s, { highlight: s.data.id === id ? 1 : 0, duration: 0.2, overwrite: 'auto' });
        }
        const canvas = canvasRef.value;
        if (canvas) {
            canvas.style.cursor = id === null ? 'crosshair' : 'pointer';
        }
    }

    function setPointer(x: number, y: number): void {
        applyHighlight(hitTest(points(), x, y));
    }

    function clearPointer(): void {
        applyHighlight(null);
    }

    /** Click the hawk → scare it off; click a duck → edit it; click open water → toss breadcrumbs. */
    function clickAt(x: number, y: number): void {
        if (predator && predator.phase === 'dive') {
            const dx = x - predator.x;
            const dy = y - predator.y;
            if (dx * dx + dy * dy <= PREDATOR_HIT_RADIUS * PREDATOR_HIT_RADIUS) {
                scarePredator();
                return;
            }
        }
        const id = hitTest(points(), x, y);
        if (id !== null) {
            const sprite = sprites.find((s) => s.data.id === id);
            if (sprite) {
                handlers.onSelect(sprite.data);
            }
            return;
        }
        dropFood(x, y);
    }

    // --- Lifecycle ---------------------------------------------------------

    onMounted(() => {
        const canvas = canvasRef.value;
        if (!canvas) {
            return;
        }
        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }
        ctx = context;
        reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        running = true;
        resize();
        reconcile();
        armPredator();
        gsap.ticker.add(tick);

        const el = containerRef.value;
        if (el && typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver(() => resize());
            observer.observe(el);
        }
    });

    onUnmounted(() => {
        running = false;
        gsap.ticker.remove(tick);
        for (const s of sprites) {
            s.tween?.kill();
            gsap.killTweensOf(s);
        }
        sprites = [];
        crumbs = [];
        ripples = [];
        clearPredator();
        if (feedTimer !== null) {
            clearTimeout(feedTimer);
        }
        if (dieTimer !== null) {
            clearTimeout(dieTimer);
        }
        feedTimer = null;
        dieTimer = null;
        observer?.disconnect();
        observer = null;
        ctx = null;
    });

    watch(ducks, () => reconcile(), { deep: false });

    return { setPointer, clearPointer, clickAt, dropFood };
}

/** Rounded-rectangle path helper (canvas `roundRect` isn't universally available). */
function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
}

/** A little X for a dead duck's eye. */
function drawX(c: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    c.beginPath();
    c.moveTo(x - r, y - r);
    c.lineTo(x + r, y + r);
    c.moveTo(x + r, y - r);
    c.lineTo(x - r, y + r);
    c.stroke();
}

/** Wash a colour toward grey — a dead duck loses its lustre. */
function desaturate(hex: string): string {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    const avg = (r + g + b) / 3;
    const mix = (ch: number): number => Math.round(ch * 0.45 + avg * 0.55);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}
