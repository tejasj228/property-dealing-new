// Reference-counted client assets: mounted scenes share decoded textures, and the
// final scene releases GPU resources. Pending completions never wake an unmounted scene.
export function createAssetPool() {
  const entries = new Map();
  return {
    acquire(key, create, onReady = () => {}) {
      let entry = entries.get(key);
      if (!entry) {
        entry = { refs:0, ready:false, listeners:new Set(), asset:null };
        entries.set(key, entry);
        entry.asset = create(() => {
          entry.ready = true;
          if (entry.refs === 0) return;
          for (const listener of entry.listeners) listener();
        });
      }
      entry.refs++; entry.listeners.add(onReady);
      let released = false;
      return { asset:entry.asset, release() {
        if (released) return; released = true;
        entry.listeners.delete(onReady);
        if (--entry.refs === 0) { entries.delete(key); entry.asset.dispose(); }
      } };
    },
    get size() { return entries.size; },
  };
}
