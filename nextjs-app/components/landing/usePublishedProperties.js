'use client';

import { useEffect, useState } from 'react';

export function usePublishedProperties(initialProperties, initiallyAvailable) {
  const [snapshot, setSnapshot] = useState({ properties: initialProperties, available: initiallyAvailable });
  useEffect(() => {
    let disposed = false, pending = false, request;
    async function refresh() {
      if (document.hidden || pending) return;
      pending = true; request = new AbortController();
      const timeout = setTimeout(() => request.abort(), 12000);
      try {
        const response = await fetch('/api/landing-properties', { cache: 'no-store', signal: request.signal });
        if (!response.ok) return;
        const result = await response.json();
        if (!disposed && result.success && Array.isArray(result.data)) {
          setSnapshot(previous => previous.available && JSON.stringify(previous.properties) === JSON.stringify(result.data)
            ? previous : { properties: result.data, available: true });
        }
      } catch { /* Keep the last successful listings during a transient failure. */ }
      finally { clearTimeout(timeout); pending = false; }
    }
    refresh();
    const interval = setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', refresh);
    return () => { disposed = true; clearInterval(interval); request?.abort(); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  return snapshot;
}
