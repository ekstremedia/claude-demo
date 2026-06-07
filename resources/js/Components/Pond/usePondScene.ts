import gsap from 'gsap';
import { onMounted, onUnmounted, watch, type Ref } from 'vue';
import type { Duck } from '@/types/pond';
import { profileFor, type MotionProfile } from '@/Components/Pond/duckMoods';
import {
    boundsFor,
    hitTest,
    isInside,
    lerpAngle,
    pickTarget,
    randomPointIn,
    type PondBounds,
} from '@/Components/Pond/pondGeometry';

/**
 * Runtime state for one floating duck. Deliberately a plain object (never made
 * reactive) — it's mutated every frame, so Vue's reactivity must stay out of it.
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
}

interface Lily {
    x: number;
    y: number;
    r: number;
    rot: number;
    flower: boolean;
}

/**
 * The imperative pond engine: GSAP-driven mood motion + a canvas render loop on
 * GSAP's ticker, with hover/click hit-testing, live reconciliation against the
 * duck list, resize handling and full teardown. All side effects are confined
 * to `onMounted`/`onUnmounted`, so the component stays import- and SSR-safe.
 */
export function usePondScene(
    canvasRef: Ref<HTMLCanvasElement | null>,
    containerRef: Ref<HTMLElement | null>,
    ducks: () => Duck[],
    onSelect: (duck: Duck) => void,
) {
    let ctx: CanvasRenderingContext2D | null = null;
    let sprites: Sprite[] = [];
    let lilies: Lily[] = [];
    let bounds: PondBounds = boundsFor(800, 450);
    let cssW = 800;
    let cssH = 450;
    let dpr = 1;
    let running = false;
    let reducedMotion = false;
    let hoverId: number | null = null;
    let observer: ResizeObserver | null = null;

    // --- Motion ------------------------------------------------------------

    function scheduleSwim(s: Sprite): void {
        const p = s.profile;
        const target = pickTarget(bounds, { x: s.x, y: s.y }, p.roamRadius);
        s.target = target;
        const duration = gsap.utils.random(p.durationRange[0], p.durationRange[1]);
        const delay = gsap.utils.random(p.idleRange[0], p.idleRange[1]);

        if (p.pathStyle === 'arc') {
            // Trace a gentle curve: a quadratic bezier bent perpendicular to the leg.
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

        // 'direct' and 'jitter' both swim straight; the tiny grumpy roamRadius is
        // what makes jitter read as fidgety.
        s.tween = gsap.to(s, {
            x: target.x,
            y: target.y,
            duration,
            delay,
            ease: p.ease,
            onComplete: () => scheduleSwim(s),
        });
    }

    // --- Rendering ---------------------------------------------------------

    function drawWater(): void {
        if (!ctx) {
            return;
        }
        const water = ctx.createLinearGradient(0, 0, 0, cssH);
        water.addColorStop(0, '#7dd3fc');
        water.addColorStop(1, '#0891b2');
        ctx.fillStyle = water;
        ctx.fillRect(0, 0, cssW, cssH);

        const radius = Math.max(cssW, cssH);
        const vignette = ctx.createRadialGradient(cssW / 2, cssH / 2, radius * 0.3, cssW / 2, cssH / 2, radius * 0.72);
        vignette.addColorStop(0, 'rgba(8,47,73,0)');
        vignette.addColorStop(1, 'rgba(8,47,73,0.38)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, cssW, cssH);
    }

    function drawLilies(): void {
        if (!ctx) {
            return;
        }
        const notch = 0.5;
        for (const l of lilies) {
            ctx.save();
            ctx.translate(l.x, l.y);
            ctx.rotate(l.rot);
            ctx.fillStyle = 'rgba(34,197,94,0.55)';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, l.r, notch, Math.PI * 2 - notch);
            ctx.closePath();
            ctx.fill();
            if (l.flower) {
                ctx.fillStyle = 'rgba(244,114,182,0.92)';
                for (let k = 0; k < 5; k++) {
                    const fa = (k / 5) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.ellipse(Math.cos(fa) * l.r * 0.2, Math.sin(fa) * l.r * 0.2, l.r * 0.17, l.r * 0.1, fa, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = '#fde68a';
                ctx.beginPath();
                ctx.arc(0, 0, l.r * 0.13, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    function drawRipples(time: number): void {
        if (!ctx) {
            return;
        }
        const centres: Array<[number, number]> = [
            [0.3, 0.4],
            [0.7, 0.62],
            [0.52, 0.24],
        ];
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1.5;
        centres.forEach(([fx, fy], i) => {
            const phase = (time * 0.22 + i * 0.4) % 1;
            const r = phase * Math.min(bounds.rx, bounds.ry) * 0.5;
            ctx!.globalAlpha = 1 - phase;
            ctx!.beginPath();
            ctx!.ellipse(bounds.cx + (fx - 0.5) * bounds.rx, bounds.cy + (fy - 0.5) * bounds.ry, r, r * 0.7, 0, 0, Math.PI * 2);
            ctx!.stroke();
        });
        ctx.globalAlpha = 1;
    }

    function drawWake(s: Sprite): void {
        if (!ctx) {
            return;
        }
        ctx.save();
        ctx.translate(s.x, s.y + 7);
        ctx.rotate(s.heading);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(-11, 0, 13, 6, 0, -0.7, 0.7);
        ctx.stroke();
        ctx.restore();
    }

    function drawReflection(s: Sprite, bob: number): void {
        if (!ctx) {
            return;
        }
        ctx.save();
        ctx.globalAlpha = 0.16;
        ctx.translate(s.x, s.y + bob + 14);
        ctx.scale(1, -0.6);
        ctx.fillStyle = s.data.color.hex;
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawDuck(s: Sprite, bob: number): void {
        if (!ctx) {
            return;
        }
        const flip = Math.cos(s.heading) < 0 ? -1 : 1;
        const scale = 1 + s.highlight * 0.14;
        ctx.save();
        ctx.translate(s.x, s.y + bob);
        ctx.scale(flip * scale, scale);
        if (s.highlight > 0.01) {
            ctx.shadowColor = 'rgba(15,23,42,0.28)';
            ctx.shadowBlur = 14 * s.highlight;
        }
        ctx.fillStyle = s.data.color.hex;
        // tail
        ctx.beginPath();
        ctx.moveTo(-13, -2);
        ctx.lineTo(-22, -7);
        ctx.lineTo(-12, -6);
        ctx.closePath();
        ctx.fill();
        // body
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        // head
        ctx.beginPath();
        ctx.ellipse(11, -8, 7.5, 7.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // white ducks need an outline to read against the bright water
        if (s.data.color.value === 'white') {
            ctx.strokeStyle = 'rgba(100,116,139,0.6)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.ellipse(0, 0, 16, 11, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        // beak
        ctx.fillStyle = '#fb923c';
        ctx.beginPath();
        ctx.moveTo(17, -9);
        ctx.lineTo(25, -7.5);
        ctx.lineTo(17, -5.5);
        ctx.closePath();
        ctx.fill();
        // eye
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(13.5, -10, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawLabel(s: Sprite, bob: number): void {
        if (!ctx) {
            return;
        }
        const text = `${s.data.mood.emoji} ${s.data.name}`;
        ctx.save();
        ctx.globalAlpha = s.highlight;
        ctx.font = '600 13px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const width = ctx.measureText(text).width + 18;
        const lx = s.x;
        const ly = s.y + bob - 26;
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
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);
        drawWater();
        drawLilies();
        drawRipples(time);

        for (const s of sprites) {
            if (!reducedMotion) {
                const want = Math.atan2(s.target.y - s.y, s.target.x - s.x);
                s.heading = lerpAngle(s.heading, want, s.profile.turnSharpness * 0.2);
            }
            const bob = reducedMotion
                ? Math.sin(time * 0.4 + s.bobPhase) * 1.5
                : Math.sin(time * s.profile.bobFrequency * Math.PI * 2 + s.bobPhase) * s.profile.bobAmplitude;
            drawWake(s);
            drawReflection(s, bob);
            drawDuck(s, bob);
            if (s.highlight > 0.01) {
                drawLabel(s, bob);
            }
        }
    }

    // --- Layout ------------------------------------------------------------

    function buildLilies(): void {
        lilies = [];
        for (let i = 0; i < 5; i++) {
            const a = i * 2.399963; // golden-angle scatter, evenly spread
            const ring = 0.5 + 0.38 * ((i % 3) / 2);
            lilies.push({
                x: bounds.cx + Math.cos(a) * bounds.rx * ring,
                y: bounds.cy + Math.sin(a) * bounds.ry * ring,
                r: 16 + (i % 3) * 5,
                rot: a,
                flower: i % 2 === 0,
            });
        }
    }

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
        buildLilies();
        for (const s of sprites) {
            if (!isInside(bounds, s.x, s.y)) {
                const p = randomPointIn(bounds);
                s.x = p.x;
                s.y = p.y;
            }
            // The in-flight leg was aimed at the old bounds and could now lead
            // off-canvas — restart it within the resized pond.
            if (running && !reducedMotion) {
                s.tween?.kill();
                scheduleSwim(s);
            }
        }
    }

    // --- Reconciliation ----------------------------------------------------

    function reconcile(): void {
        const next = ducks();
        const byId = new Map(sprites.map((s) => [s.data.id, s]));
        const keep = new Set<number>();

        for (const duck of next) {
            keep.add(duck.id);
            const existing = byId.get(duck.id);
            if (!existing) {
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
                };
                sprites.push(sprite);
                if (running && !reducedMotion) {
                    scheduleSwim(sprite);
                }
            } else {
                const moodChanged = existing.data.mood.value !== duck.mood.value;
                existing.data = duck; // colour/name/bio refresh for free (read at draw)
                if (moodChanged) {
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
            canvas.style.cursor = id === null ? 'default' : 'pointer';
        }
    }

    function setPointer(x: number, y: number): void {
        applyHighlight(hitTest(points(), x, y));
    }

    function clearPointer(): void {
        applyHighlight(null);
    }

    function clickAt(x: number, y: number): void {
        const id = hitTest(points(), x, y);
        if (id === null) {
            return;
        }
        const sprite = sprites.find((s) => s.data.id === id);
        if (sprite) {
            onSelect(sprite.data);
        }
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
        resize();
        reconcile();
        running = true;
        if (!reducedMotion) {
            for (const s of sprites) {
                scheduleSwim(s);
            }
        }
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
        observer?.disconnect();
        observer = null;
        ctx = null;
    });

    watch(ducks, () => reconcile(), { deep: false });

    return { setPointer, clearPointer, clickAt };
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
