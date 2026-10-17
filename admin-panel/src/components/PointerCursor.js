'use client';

import { useEffect, useRef } from 'react';
import './PointerCursor.css';

// Cursor motion never rerenders React or changes document layout.
export default function PointerCursor() {
  const host = useRef(null);
  useEffect(() => {
    const node = host.current, root = document.documentElement;
    const media = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const parts = Array.from(node.children), points = parts.map(() => ({ x: 0, y: 0 }));
    let viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    let viewportHeight = document.documentElement.clientHeight || window.innerHeight;
    let x = 0, y = 0, frame = 0, active = false, enabled = media.matches, lastScroll = -Infinity;
    function hide() {
      if (active) { active = false; node.hidden = true; delete root.dataset.brandCursor; }
      cancelAnimationFrame(frame); frame = 0;
    }
    function draw() {
      frame = 0;
      if (!active || !enabled || document.hidden) return;
      // A transformed fixed box can enlarge document overflow at viewport edges.
      // Keep its entire border box inside the viewport; move the hotspot within it.
      const left = Math.max(0, Math.min(x - 48, viewportWidth - 96));
      const top = Math.max(0, Math.min(y - 48, viewportHeight - 96));
      node.style.transform = `translate3d(${left}px,${top}px,0)`;
      let unsettled = false;
      points.forEach((point, i) => {
        const factor = [1, .3, .23, .18][i];
        point.x += (x - point.x) * factor; point.y += (y - point.y) * factor;
        // Keep all painted pixels inside one small compositing layer.
        const dx = point.x - x, dy = point.y - y, distance = Math.hypot(dx, dy);
        if (distance > 22) { point.x = x + dx / distance * 22; point.y = y + dy / distance * 22; }
        parts[i].style.transform = `translate3d(${point.x - left - 48}px,${point.y - top - 48}px,0)`;
        if (Math.abs(x - point.x) + Math.abs(y - point.y) > .15) unsettled = true;
      });
      if (unsettled) frame = requestAnimationFrame(draw);
    }
    function targetMode(target) {
      if (!(target instanceof Element)) return false;
      if (target.closest('input,textarea,[contenteditable="true"],dialog[open],iframe')) return false;
      const interactive = target.closest('a,button,[role="button"],[role="link"],select,summary,label[for]');
      if (!interactive && target.closest('[data-cursor="grab"],[data-draggable="true"]')) return false;
      const mode = interactive ? 'link' : 'default';
      if (node.dataset.mode !== mode) node.dataset.mode = mode;
      return true;
    }
    function move(event) {
      if (!enabled || event.pointerType !== 'mouse' || performance.now() - lastScroll < 160 || !targetMode(event.target)) { hide(); return; }
      x = Math.max(0, Math.min(event.clientX, viewportWidth)); y = Math.max(0, Math.min(event.clientY, viewportHeight));
      if (!active) {
        points.forEach(point => { point.x = x; point.y = y; });
        active = true; node.hidden = false; root.dataset.brandCursor = 'on';
      }
      if (!frame) frame = requestAnimationFrame(draw);
    }
    // Scrolling can emit pointerover without the mouse moving. Never wake the
    // cursor from those events or continuously restyle every element on the page.
    const over = event => { if (active && !targetMode(event.target)) hide(); };
    const scroll = () => { lastScroll = performance.now(); hide(); };
    const down = () => { if (active) node.dataset.pressed = 'true'; }, up = () => { delete node.dataset.pressed; };
    const leave = event => { if (!event.relatedTarget) hide(); };
    const visibility = () => { if (document.hidden) hide(); };
    const change = () => { enabled = media.matches; hide(); };
    const resize = () => { viewportWidth = root.clientWidth || window.innerWidth; viewportHeight = root.clientHeight || window.innerHeight; hide(); };
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', over, { passive: true });
    document.addEventListener('pointerout', leave, { passive: true });
    document.addEventListener('pointerdown', down, { passive: true }); document.addEventListener('pointerup', up, { passive: true });
    document.addEventListener('wheel', scroll, { passive: true });
    document.addEventListener('scroll', scroll, { passive: true, capture: true });
    document.addEventListener('visibilitychange', visibility); window.addEventListener('blur', hide); media.addEventListener('change', change);
    return () => {
      hide(); window.removeEventListener('resize', resize); document.removeEventListener('pointermove', move); document.removeEventListener('pointerover', over); document.removeEventListener('pointerout', leave);
      document.removeEventListener('pointerdown', down); document.removeEventListener('pointerup', up);
      document.removeEventListener('wheel', scroll); document.removeEventListener('scroll', scroll, true);
      document.removeEventListener('visibilitychange', visibility); window.removeEventListener('blur', hide); media.removeEventListener('change', change);
    };
  }, []);
  return <div ref={host} className="brand-cursor" aria-hidden="true" hidden><span className="brand-cursor-dot" /><span className="brand-cursor-ring" /><span className="brand-cursor-trace" /><span className="brand-cursor-trace" /></div>;
}
