// Pointer-driven orbit with a damped response; it never touches document scrolling.
export function createOrbitSpring() {
  const state = { yaw: 0, pitch: 0, yawVelocity: 0, pitchVelocity: 0 };
  return { state, reset() { state.yaw = 0; state.pitch = 0; state.yawVelocity = 0; state.pitchVelocity = 0; },
    step(seconds, yaw, pitch, reduced = false) {
      if (reduced) { Object.assign(state, { yaw, pitch, yawVelocity: 0, pitchVelocity: 0 }); return state; }
      const duration = Math.min(0.064, Math.max(0, seconds)), steps = Math.max(1, Math.ceil(duration / .008)), dt = duration / steps;
      for (let i = 0; i < steps; i++) for (const key of ['yaw', 'pitch']) {
        const velocity = key + 'Velocity', target = key === 'yaw' ? yaw : pitch;
        state[velocity] += ((target - state[key]) * 100 - state[velocity] * 17) * dt;
        const limit = key === 'yaw' ? .8 : .18;
        state[key] = Math.max(-limit, Math.min(limit, state[key] + state[velocity] * dt));
      }
      return state;
    },
  };
}
