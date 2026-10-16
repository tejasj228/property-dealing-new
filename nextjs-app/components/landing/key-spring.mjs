const clamp = (v, limit) => Math.max(-limit, Math.min(limit, v));
export function createKeySpring() {
  const state = { x: 0, y: 0, vx: 0, vy: 0, angle: 0, spin: 0 };
  return {
    state,
    reset() { Object.keys(state).forEach(key => { state[key] = 0; }); },
    step(seconds, x, y, reduced = false) {
      if (reduced) { Object.assign(state, { x, y, vx: 0, vy: 0, angle: 0, spin: 0 }); return state; }
      const duration = Math.min(Math.max(seconds, 0), 0.064), steps = Math.max(1, Math.ceil(duration / 0.008)), dt = duration / steps;
      for (let i = 0; i < steps; i++) {
        const ax = (x - state.x) * 150 - state.vx * 15;
        state.vx += ax * dt; state.vy += ((y - state.y) * 150 - state.vy * 15) * dt;
        state.x = clamp(state.x + state.vx * dt, 0.65); state.y = clamp(state.y + state.vy * dt, 0.35);
        state.spin += (-state.angle * 65 - state.spin * 6 - ax * 0.45) * dt;
        state.angle = clamp(state.angle + state.spin * dt, 0.24);
      }
      return state;
    },
  };
}
