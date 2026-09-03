/**
 * The spine: one dendrite down the left gutter with a soma per section.
 * Scroll progress draws the lit path; a section entering view fires a spark
 * that travels along the path and arrives at that section's soma.
 */
import { spinePath, somaFraction } from './geometry';

export interface SpineHandle { destroy(): void }

const NS = 'http://www.w3.org/2000/svg';
const COLS = ['#7C6BFF', '#9C8CFF', '#38E1D6', '#5BE3C8', '#FF8A4C'];
const CORE_OFF = '#0C0A16';

interface Node {
  sec: HTMLElement; g: SVGGElement; halo: SVGCircleElement; core: SVGCircleElement;
  lbl: SVGTextElement; col: string; flare: number; lit: boolean;
}
interface Spark { el: SVGCircleElement; t: number; from: number; to: number; v: number }

function circle(r: string, fill: string): SVGCircleElement {
  const c = document.createElementNS(NS, 'circle');
  c.setAttribute('r', r);
  c.setAttribute('fill', fill);
  return c;
}

export function mountSpine(svg: SVGSVGElement, sections: HTMLElement[]): SpineHandle {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pBase = svg.querySelector<SVGPathElement>('#spineBase')!;
  const pLit = svg.querySelector<SVGPathElement>('#spineLit')!;
  const gSom = svg.querySelector<SVGGElement>('#somata')!;
  const gSpk = svg.querySelector<SVGGElement>('#sparks')!;

  let spineLen = 1;
  const sparks: Spark[] = [];
  const nodes: Node[] = sections.map((sec, i) => {
    const col = COLS[i % COLS.length];
    const g = document.createElementNS(NS, 'g');
    const halo = circle('11', col);
    halo.setAttribute('opacity', '0');
    halo.setAttribute('filter', 'url(#fGlow)');
    const core = circle('3.5', CORE_OFF);
    core.setAttribute('stroke', col);
    core.setAttribute('stroke-width', '1.6');
    const lbl = document.createElementNS(NS, 'text');
    lbl.setAttribute('x', '16'); lbl.setAttribute('y', '3.5');
    lbl.setAttribute('fill', '#615C82');
    lbl.setAttribute('font-family', 'IBM Plex Mono, monospace');
    lbl.setAttribute('font-size', '9');
    lbl.setAttribute('letter-spacing', '1.4');
    lbl.setAttribute('opacity', '0');
    lbl.textContent = (sec.dataset.soma ?? '').toUpperCase();
    g.append(halo, core, lbl);
    gSom.appendChild(g);
    return { sec, g, halo, core, lbl, col, flare: reduce ? 1 : 0, lit: reduce };
  });

  function layout(): void {
    const d = spinePath(svg.clientWidth || 96, svg.clientHeight || innerHeight);
    pBase.setAttribute('d', d);
    pLit.setAttribute('d', d);
    spineLen = pLit.getTotalLength();
    pLit.style.strokeDasharray = String(spineLen);
  }

  function fireSpark(from: number, to: number, col: string): void {
    const el = circle('3', col);
    el.setAttribute('filter', 'url(#fGlow)');
    gSpk.appendChild(el);
    sparks.push({ el, t: 0, from, to, v: 1 / (0.42 + Math.abs(to - from) * 0.5) });
  }

  function update(dt: number): void {
    const docH = document.documentElement.scrollHeight - innerHeight;
    const sp = reduce ? 1 : docH > 0 ? Math.max(0, Math.min(1, scrollY / docH)) : 0;
    pLit.style.strokeDashoffset = String(spineLen * (1 - sp));

    for (const nd of nodes) {
      const f = somaFraction(nd.sec.getBoundingClientRect(), innerHeight);
      const pt = pLit.getPointAtLength(f * spineLen);
      nd.g.setAttribute('transform', `translate(${pt.x.toFixed(1)},${pt.y.toFixed(1)})`);
      if (!reduce) nd.flare += ((nd.lit ? 1 : 0) - nd.flare) * 0.09;
      nd.halo.setAttribute('opacity', (nd.flare * 0.55).toFixed(3));
      nd.halo.setAttribute('r', (7 + nd.flare * 7).toFixed(2));
      nd.core.setAttribute('fill', nd.flare > 0.5 ? nd.col : CORE_OFF);
      nd.lbl.setAttribute('opacity', (nd.flare * 0.9).toFixed(3));
      nd.g.setAttribute('opacity', f > -0.05 && f < 1.05 ? '1' : '0');
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const sk = sparks[i];
      sk.t += sk.v * dt;
      if (sk.t >= 1) { sk.el.remove(); sparks.splice(i, 1); continue; }
      const e = sk.t * sk.t * (3 - 2 * sk.t);
      const f = Math.max(0, Math.min(1, sk.from + (sk.to - sk.from) * e));
      const pt = pLit.getPointAtLength(f * spineLen);
      sk.el.setAttribute('cx', pt.x.toFixed(1));
      sk.el.setAttribute('cy', pt.y.toFixed(1));
      sk.el.setAttribute('opacity', (1 - Math.pow(sk.t, 3)).toFixed(3));
      sk.el.setAttribute('r', (2 + (1 - sk.t) * 2.2).toFixed(2));
    }
  }

  const io = reduce ? null : new IntersectionObserver((entries) => {
    for (const en of entries) {
      const nd = nodes.find((n) => n.sec === en.target);
      if (!nd) continue;
      if (en.isIntersecting && !nd.lit) {
        nd.lit = true;
        const here = somaFraction(nd.sec.getBoundingClientRect(), innerHeight);
        fireSpark(Math.max(0, here - 0.42), here, nd.col);
      } else if (!en.isIntersecting) {
        nd.lit = false;
      }
    }
  }, { threshold: 0.18 });
  if (io) for (const s of sections) io.observe(s);

  let raf = 0, lastT = performance.now();
  const tick = () => {
    raf = requestAnimationFrame(tick);
    const now = performance.now();
    update(Math.min(0.05, (now - lastT) / 1000));
    lastT = now;
  };
  const onResize = () => { layout(); if (reduce) update(0); };
  const onScroll = () => update(0);

  layout();
  window.addEventListener('resize', onResize);
  if (reduce) {
    window.addEventListener('scroll', onScroll, { passive: true });
    update(0);
  } else {
    raf = requestAnimationFrame(tick);
  }

  return {
    destroy() {
      cancelAnimationFrame(raf);
      io?.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      gSom.textContent = '';
      gSpk.textContent = '';
    },
  };
}
