// Scroll events only update a transform, once per frame. Re-measure on layout changes.
export function attachReadingProgress(track, fill, doc = document, view = window) {
  let frame = 0, range = 0, previous = -1;
  function draw() {
    frame = 0;
    const value = range > 0 ? Math.max(0, Math.min(1, view.scrollY / range)) : 1;
    fill.style.transform = `scaleX(${value})`;
    const percent = Math.round(value * 100);
    if (percent !== previous) {
      previous = percent;
      track.setAttribute('aria-valuenow', String(percent));
      track.setAttribute('aria-valuetext', `${percent}% explored, ${100 - percent}% remaining`);
    }
  }
  function schedule() { if (!frame) frame = view.requestAnimationFrame(draw); }
  function measure() { range = Math.max(0, doc.documentElement.scrollHeight - view.innerHeight); schedule(); }
  const observer = new view.ResizeObserver(measure);
  observer.observe(doc.documentElement); observer.observe(doc.body);
  view.addEventListener('scroll', schedule, { passive: true });
  view.addEventListener('resize', measure, { passive: true });
  measure();
  return () => {
    view.cancelAnimationFrame(frame); observer.disconnect();
    view.removeEventListener('scroll', schedule); view.removeEventListener('resize', measure);
  };
}
