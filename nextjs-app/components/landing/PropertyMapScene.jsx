'use client';

import { useEffect, useRef } from 'react';
import { ACESFilmicToneMapping, OrthographicCamera, Scene, WebGLRenderer } from 'three';
import { createPropertyMapModel, framePropertyMapCamera } from './property-map-model.mjs';
import styles from './PropertyMap.module.css';
import { scenePixelRatio, prefersLightweightScene } from './render-policy.mjs';
import { createSceneLighting, observeSceneTheme } from './scene-lighting.mjs';

export default function PropertyMapScene({ properties, viewport, markers, yaw, zoom, paused, reduced }) {
  const host = useRef(null), pausedRef = useRef(paused), wake = useRef(null);
  useEffect(() => { pausedRef.current = paused; wake.current?.(); }, [paused]);
  useEffect(() => {
    const element = host.current, root = viewport.current;
    if (!element || !root) return;
    let renderer;
    try { renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch { return; }
    const compact = matchMedia('(max-width: 767px)').matches;
    const lowPower = prefersLightweightScene(navigator);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, compact ? 1 : 1.35));
    renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
    renderer.setClearColor(0, 0); element.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    const scene = new Scene();
    const map = createPropertyMapModel(properties, compact || lowPower); scene.add(map.model);
    const lighting = createSceneLighting(scene, map.model, renderer, { kind: 'map', compact });
    const camera = new OrthographicCamera(-14, 14, 10, -10, 0.1, 300);
    let width = 0, height = 0, frame = 0, visible = false, lost = false, last = 0, elapsed = 0, dirty = true;
    const point = camera.position.clone();
    function render(time) {
      frame = 0;
      if (!visible || document.hidden || lost || !width || !height) return;
      if (last && time - last < (compact ? 33 : 22) && !dirty) { frame = requestAnimationFrame(render); return; }
      const delta = Math.min(64, time - (last || time - 16)); last = time;
      if (!pausedRef.current && !reduced) elapsed += delta / 1000;
      map.update(elapsed, reduced);
      if (dirty) framePropertyMapCamera(camera, width, height, map.depth, yaw.get(), zoom.get());
      renderer.render(scene, camera);
      if (dirty) for (const marker of map.markerPositions) {
        const node = markers.current.get(marker.id); if (!node) continue;
        point.copy(marker.position).project(camera);
        node.style.left = `${(point.x + 1) * width / 2}px`; node.style.top = `${(1 - point.y) * height / 2}px`;
      }
      if (root.dataset.ready !== 'true') root.dataset.ready = 'true'; dirty = false;
      if (!pausedRef.current && !reduced) frame = requestAnimationFrame(render);
    }
    function invalidate() { dirty = true; if (!frame && visible && !document.hidden && !lost) frame = requestAnimationFrame(render); }
    const stopTheme = observeSceneTheme(element, lighting, invalidate);
    wake.current = invalidate;
    const resize = new ResizeObserver(([entry]) => { width = entry.contentRect.width; height = entry.contentRect.height; if (width && height) { renderer.setPixelRatio(scenePixelRatio(width, height, { devicePixelRatio, compact, lowPower, maxTextureSize: renderer.capabilities.maxTextureSize })); renderer.setSize(width, height, false); } invalidate(); }); resize.observe(element);
    const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) invalidate(); else { cancelAnimationFrame(frame); frame = 0; last = 0; } }); visibility.observe(element);
    const onVisibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; last = 0; } else invalidate(); };
    const onLost = e => { e.preventDefault(); lost = true; cancelAnimationFrame(frame); frame = 0; delete root.dataset.ready; };
    const onRestored = () => { lost = false; invalidate(); };
    const unsubYaw = yaw.on('change', invalidate), unsubZoom = zoom.on('change', invalidate);
    document.addEventListener('visibilitychange', onVisibility);
    renderer.domElement.addEventListener('webglcontextlost', onLost); renderer.domElement.addEventListener('webglcontextrestored', onRestored);
    return () => {
      cancelAnimationFrame(frame); resize.disconnect(); visibility.disconnect(); unsubYaw(); unsubZoom(); wake.current = null;
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.domElement.removeEventListener('webglcontextlost', onLost); renderer.domElement.removeEventListener('webglcontextrestored', onRestored);
      delete root.dataset.ready; stopTheme(); lighting.dispose(); map.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, [properties, viewport, markers, yaw, zoom, reduced]);
  return <div ref={host} className={styles.canvas} aria-hidden="true" />;
}
