'use client';

import { useEffect, useRef } from 'react';
import './PointerCursor.css';

// Pointer coordinates stay outside React so motion never rerenders the page.
export default function PointerCursor() {
  const host = useRef(null);
  useEffect(() => {
    const node = host.current, root = document.documentElement;
    const media = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const parts = Array.from(node.children), points = parts.map(() => ({ x: 0, y: 0 }));
    let x = 0, y = 0, frame = 0, active = false, initialized = false, enabled = media.matches;
    const hide = () => { active = false; node.hidden = true; delete root.dataset.brandCursor; cancelAnimationFrame(frame); frame = 0; };
    function draw() {
      frame = 0;
      if (!active || !enabled || document.hidden) return;
      let unsettled = false;
      points.forEach((point, i) => {
        const factor = i === 0 ? 1 : [1, .3, .23, .18][i];
        point.x += (x - point.x) * factor; point.y += (y - point.y) * factor;
        parts[i].style.transform = `translate3d(${point.x}px,${point.y}px,0)`;
        if (Math.abs(x - point.x) + Math.abs(y - point.y) > .15) unsettled = true;
      });
      if (unsettled) frame = requestAnimationFrame(draw);
    }
    function targetMode(target) {
      if (!(target instanceof Element)) return false;
      // Keep native text selection, drag previews, and top-layer dialogs usable.
      if (target.closest('input,textarea,[contenteditable="true"],dialog[open],iframe')) return false;
      const interactive = target.closest('a,button,[role="button"],[role="link"],select,summary,label[for]');
      // Let the native grab/grabbing hand own model gestures completely.
      if (!interactive && target.closest('[data-cursor="grab"],[data-draggable="true"]')) return false;
      node.dataset.mode = interactive ? 'link' : 'default';
      return true;
    }
    function move(event) {
      if (!enabled || event.pointerType !== 'mouse' || !targetMode(event.target)) { hide(); return; }
      x = event.clientX; y = event.clientY;
      if (!active || !initialized) { points.forEach(point => { point.x = x; point.y = y; }); initialized = true; }
      active = true; node.hidden = false; root.dataset.brandCursor = 'on';
      if (!frame) frame = requestAnimationFrame(draw);
    }
    const down = () => { node.dataset.pressed = 'true'; }, up = () => { delete node.dataset.pressed; };
    const leave = event => { if (!event.relatedTarget) hide(); };
    const visibility = () => { if (document.hidden) hide(); };
    const change = () => { enabled = media.matches; hide(); };
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', move, { passive: true });
    document.addEventListener('pointerout', leave, { passive: true });
    document.addEventListener('pointerdown', down, { passive: true }); document.addEventListener('pointerup', up, { passive: true });
    document.addEventListener('visibilitychange', visibility); window.addEventListener('blur', hide); media.addEventListener('change', change);
    return () => { hide(); document.removeEventListener('pointermove', move); document.removeEventListener('pointerover', move); document.removeEventListener('pointerout', leave); document.removeEventListener('pointerdown', down); document.removeEventListener('pointerup', up); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('blur', hide); media.removeEventListener('change', change); };
  }, []);
  return <div ref={host} className="brand-cursor" aria-hidden="true" hidden><span className="brand-cursor-dot" /><span className="brand-cursor-ring" /><span className="brand-cursor-trace" /><span className="brand-cursor-trace" /></div>;
}
