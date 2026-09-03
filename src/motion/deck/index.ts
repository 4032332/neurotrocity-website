/**
 * The demo deck's interaction. Layout is pure (layout.ts); this file owns the
 * offset, the pointer/wheel/keyboard inputs, the rAF loop that writes CSS 3D
 * transforms, and the rule that at most one demo iframe is ever live.
 *
 * Below 720px the same markup is a scroll-snap row: no 3D, no rAF — an
 * IntersectionObserver on the row decides which card is frontmost.
 */
import { deckTransforms } from './layout';

export interface DeckHandle { destroy(): void }

const MOBILE = '(max-width: 719px)';
const REDUCED = '(prefers-reduced-motion: reduce)';
const SETTLE_MS = 350;        // a card must hold the front this long before its demo loads
const IDLE_AFTER_MS = 2400;   // idle drift starts this long after the last interaction
const DRAG_SLOT = 0.22;       // dragging this fraction of the stage width moves one card
const WHEEL_SLOT = 0.45;
const TAP_PX = 6;

const mod = (i: number, n: number) => ((i % n) + n) % n;
const href = (card: HTMLElement) => card.dataset.href ?? '';

/* ── frontmost card + the single live iframe ─────────────────────────────── */

interface Live {
  front: number;
  isInView(): boolean;
  isArmed(): boolean;
  setFront(i: number): void;
  arm(i: number): void;
  disarm(): void;
  destroy(): void;
}

function liveController(el: HTMLElement, cards: HTMLElement[]): Live {
  const frames = cards.map((c) => c.querySelector('iframe') as HTMLIFrameElement);
  let inView = false, timer = 0, armed = -1;

  const onLoad = (e: Event) => {
    const f = e.currentTarget as HTMLIFrameElement;
    if (f.getAttribute('src')) cards[frames.indexOf(f)].classList.add('is-loaded');
  };
  frames.forEach((f) => f.addEventListener('load', onLoad));

  function apply(): void {
    frames.forEach((f, j) => {
      const want = inView && j === live.front ? href(cards[j]) : '';
      if ((f.getAttribute('src') ?? '') !== want) f.setAttribute('src', want);
    });
  }
  function schedule(): void { clearTimeout(timer); timer = window.setTimeout(apply, SETTLE_MS); }

  const io = new IntersectionObserver(([en]) => { inView = en.isIntersecting; schedule(); }, { threshold: 0.2 });
  io.observe(el);

  function disarm(): void {
    if (armed < 0) return;
    cards[armed].classList.remove('is-live', 'is-armed');
    armed = -1;
  }

  const live: Live = {
    front: -1,
    isInView: () => inView,
    isArmed: () => armed >= 0,
    setFront(i) {
      if (i === live.front) return;
      disarm();
      live.front = i;
      cards.forEach((c, j) => {
        const isFront = j === i;
        c.classList.toggle('is-front', isFront);
        c.setAttribute('aria-selected', String(isFront));
        if (!isFront) {
          c.classList.remove('is-live', 'is-loaded');
          if (frames[j].getAttribute('src')) frames[j].setAttribute('src', '');   // leaving the front: unload now
        }
      });
      el.dataset.index = String(i);
      schedule();
    },
    arm(i) {
      if (i !== live.front || armed === i) return;
      armed = i;
      cards[i].classList.add('is-live', 'is-armed');
    },
    disarm,
    destroy() {
      clearTimeout(timer);
      io.disconnect();
      frames.forEach((f) => { f.removeEventListener('load', onLoad); if (f.getAttribute('src')) f.setAttribute('src', ''); });
      cards.forEach((c) => c.classList.remove('is-live', 'is-loaded', 'is-armed'));
    },
  };
  return live;
}

export function mountDeck(el: HTMLElement, count: number): DeckHandle {
  const cards = Array.from(el.querySelectorAll<HTMLElement>('.deck-card')).slice(0, count);
  if (cards.length === 0) return { destroy() {} };
  return matchMedia(MOBILE).matches ? mountRow(el, cards) : mountRing(el, cards);
}

/* ── ≥720px: the CSS-3D ring ─────────────────────────────────────────────── */

function mountRing(el: HTMLElement, cards: HTMLElement[]): DeckHandle {
  const n = cards.length;
  const live = liveController(el, cards);
  const reduced = matchMedia(REDUCED).matches;

  let offset = 0, target = 0, drift = 0, vel = 0;
  let width = el.clientWidth || 1;
  let dragging = false, wheelActive = false, suppressClick = false;
  let dragX0 = 0, dragOff0 = 0, lastX = 0, lastMoveT = 0, moved = 0;
  let lastInteract = -1e9, lastFrame = performance.now();
  let wheelTimer = 0, raf = 0, idleTimer = 0;

  const index = () => mod(Math.round(target), n);

  function ensureLoop(): void {
    if (raf) return;
    lastFrame = performance.now();
    raf = requestAnimationFrame(frame);
  }

  // Every input settles the frontmost synchronously; the rAF loop only animates toward it.
  const touch = () => {
    lastInteract = performance.now();
    live.setFront(index());
    ensureLoop();
    clearTimeout(idleTimer);
    if (!reduced) idleTimer = window.setTimeout(ensureLoop, IDLE_AFTER_MS);
  };

  function goTo(i: number): void {
    let d = mod(i - index(), n);
    if (d > n / 2) d -= n;                    // shortest way round
    target = Math.round(target) + d;
    touch();
  }

  function render(off: number): void {
    const unitX = width * 0.19, unitZ = width * 0.12;
    deckTransforms(n, off).forEach((c, i) => {
      const s = cards[i].style;
      // Front card sits at z=0; the rest recede so perspective never magnifies.
      s.transform = `translate3d(${(c.x * unitX).toFixed(2)}px, 0, ${((c.z - 1.95) * unitZ).toFixed(2)}px) rotateY(${c.rotY.toFixed(4)}rad) scale(${c.scale.toFixed(4)})`;
      // Cards stay opaque so the stack occludes correctly; the fade is a dark tint (--fade) drawn over the card.
      s.setProperty('--fade', (1 - c.opacity).toFixed(3));
      s.zIndex = String(Math.round(c.front * 100));
    });
  }

  function frame(now: number): void {
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    if (!dragging && !wheelActive && offset !== target) {
      if (reduced) offset = target;
      else {
        offset += (target - offset) * (1 - Math.exp(-dt * 8));   // inertia decays onto the integer
        if (Math.abs(target - offset) < 0.0015) offset = target;
      }
    }
    const idle = !reduced && !dragging && !wheelActive && offset === target && now - lastInteract > IDLE_AFTER_MS;
    const sway = idle ? Math.sin(now * 0.00045) * 0.05 : 0;
    drift += (sway - drift) * (1 - Math.exp(-dt * 3));
    if (Math.abs(drift) < 0.0005 && !idle) drift = 0;

    render(offset + drift);

    const active = live.isInView() && (dragging || wheelActive || offset !== target || Math.abs(drift) > 0.0005);
    if (active) raf = requestAnimationFrame(frame);
    else raf = 0;
  }

  /* pointer drag with velocity + inertia */
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true; moved = 0; vel = 0;
    dragX0 = lastX = e.clientX; dragOff0 = offset; lastMoveT = e.timeStamp;
    el.setPointerCapture(e.pointerId);
    el.classList.add('is-dragging');
    touch();
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragX0;
    moved = Math.max(moved, Math.abs(dx));
    offset = target = dragOff0 - dx / (width * DRAG_SLOT);
    const dt = (e.timeStamp - lastMoveT) / 1000;
    if (dt > 0) vel = vel * 0.5 + (-(e.clientX - lastX) / (width * DRAG_SLOT) / dt) * 0.5;
    lastX = e.clientX; lastMoveT = e.timeStamp;
    touch();
  };
  const onUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove('is-dragging');
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    if (moved > TAP_PX) suppressClick = true;
    // Project the fling, but never further than the neighbour of the neighbour.
    const proj = reduced ? offset : offset + Math.max(-1.5, Math.min(1.5, vel * 0.16));
    target = Math.round(proj);
    touch();
  };

  /* horizontal wheel / trackpad */
  const onWheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;    // vertical scroll passes through
    e.preventDefault();
    wheelActive = true;
    offset = target = offset + e.deltaX / (width * WHEEL_SLOT);
    clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(() => { wheelActive = false; target = Math.round(offset); }, 140);
    touch();
  };

  /* click: suppress after a drag; bring a back card forward; arm the front demo */
  const onClick = (e: MouseEvent) => {
    const card = (e.target as Element).closest<HTMLElement>('.deck-card');
    if (!card) return;
    if (suppressClick) { suppressClick = false; e.preventDefault(); return; }
    const i = cards.indexOf(card);
    if (i !== index()) { e.preventDefault(); goTo(i); return; }
    const onFrame = !!(e.target as Element).closest('.frame');
    if (onFrame && card.classList.contains('is-loaded') && !card.classList.contains('is-live')) {
      e.preventDefault(); live.arm(i);          // first click on a running demo hands it the pointer
    }
    // otherwise: the card is a real link — let it navigate
  };

  /* keyboard on the listbox (and bubbling up from a focused card) */
  const onKey = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': target = Math.round(target) + 1; break;
      case 'ArrowLeft':  case 'ArrowUp':   target = Math.round(target) - 1; break;
      case 'Home': target = Math.round(target) - index(); break;
      case 'End':  target = Math.round(target) + (n - 1 - index()); break;
      case 'Enter': case ' ':
        if (e.target === el) {
          e.preventDefault();
          const i = index();
          const card = cards[i];
          if (live.isArmed()) { const h = href(card); if (h) location.assign(h); return; }
          if (card.classList.contains('is-loaded')) {
            live.arm(i);
            const frame = card.querySelector<HTMLIFrameElement>('iframe');
            frame?.focus();
          } else {
            const h = href(card); if (h) location.assign(h);
          }
        }
        return;
      case 'Escape':
        if (live.isArmed()) { e.preventDefault(); live.disarm(); el.focus(); }
        return;
      default: return;
    }
    e.preventDefault();
    touch();
  };
  const onFocusIn = (e: FocusEvent) => {
    const card = (e.target as Element).closest<HTMLElement>('.deck-card');
    if (card) { const i = cards.indexOf(card); if (i !== index()) goTo(i); }
  };
  const onResize = () => { width = el.clientWidth || 1; };

  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
  el.addEventListener('wheel', onWheel, { passive: false });
  el.addEventListener('click', onClick);
  el.addEventListener('keydown', onKey);
  el.addEventListener('focusin', onFocusIn);
  window.addEventListener('resize', onResize);
  el.classList.add('is-ring');

  render(0);
  live.setFront(0);
  ensureLoop();

  return {
    destroy() {
      cancelAnimationFrame(raf);
      clearTimeout(wheelTimer);
      clearTimeout(idleTimer);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('click', onClick);
      el.removeEventListener('keydown', onKey);
      el.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('resize', onResize);
      el.classList.remove('is-ring', 'is-dragging');
      cards.forEach((c) => { c.style.transform = ''; c.style.removeProperty('--fade'); c.style.zIndex = ''; });
      live.destroy();
    },
  };
}

/* ── <720px: the scroll-snap row ─────────────────────────────────────────── */

function mountRow(el: HTMLElement, cards: HTMLElement[]): DeckHandle {
  const live = liveController(el, cards);
  const reduced = matchMedia(REDUCED).matches;

  const scrollTo = (i: number) => {
    const c = cards[i];
    el.scrollTo({ left: c.offsetLeft - (el.clientWidth - c.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
  };
  const io = new IntersectionObserver((entries) => {
    // Two cards can cross the threshold in one callback while snapping; the
    // one with the largest visible fraction is the true front.
    let best: IntersectionObserverEntry | null = null;
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      if (!best || en.intersectionRatio > best.intersectionRatio) best = en;
    }
    if (best) live.setFront(cards.indexOf(best.target as HTMLElement));
  }, { root: el, threshold: 0.6 });
  cards.forEach((c) => io.observe(c));

  const onKey = (e: KeyboardEvent) => {
    const i = Math.max(0, live.front);
    switch (e.key) {
      case 'ArrowRight': scrollTo(Math.min(cards.length - 1, i + 1)); break;
      case 'ArrowLeft':  scrollTo(Math.max(0, i - 1)); break;
      case 'Home': scrollTo(0); break;
      case 'End':  scrollTo(cards.length - 1); break;
      case 'Enter': case ' ':
        if (e.target === el) {
          e.preventDefault();
          const card = cards[i];
          if (live.isArmed()) { const h = href(card); if (h) location.assign(h); return; }
          if (card.classList.contains('is-loaded')) {
            live.arm(i);
            const frame = card.querySelector<HTMLIFrameElement>('iframe');
            frame?.focus();
          } else {
            const h = href(card); if (h) location.assign(h);
          }
        }
        return;
      case 'Escape':
        if (live.isArmed()) { e.preventDefault(); live.disarm(); el.focus(); }
        return;
      default: return;
    }
    e.preventDefault();
  };
  const onClick = (e: MouseEvent) => {
    const card = (e.target as Element).closest<HTMLElement>('.deck-card');
    if (!card) return;
    const i = cards.indexOf(card);
    if (i !== live.front) { e.preventDefault(); scrollTo(i); return; }
    const onFrame = !!(e.target as Element).closest('.frame');
    if (onFrame && card.classList.contains('is-loaded') && !card.classList.contains('is-live')) { e.preventDefault(); live.arm(i); }
  };

  el.addEventListener('keydown', onKey);
  el.addEventListener('click', onClick);
  live.setFront(0);

  return {
    destroy() {
      io.disconnect();
      el.removeEventListener('keydown', onKey);
      el.removeEventListener('click', onClick);
      live.destroy();
    },
  };
}
