import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/auth';
import { normaliseAnalytics } from '@/lib/vercel-analytics.mjs';

export async function GET(request) {
  const denied = authorizeAdmin(request); if (denied) return denied;
  const headers = { 'Cache-Control': 'private, no-store' };
  const token = process.env.VERCEL_ANALYTICS_TOKEN, projectId = process.env.VERCEL_ANALYTICS_PROJECT_ID;
  if (!token || !projectId) return NextResponse.json({ available: false, reason: 'not_configured' }, { headers });
  const now = new Date(), start = new Date(now); start.setUTCDate(start.getUTCDate() - 6); start.setUTCHours(0, 0, 0, 0);
  const query = async (endpoint, extra = {}) => {
    const params = new URLSearchParams({ projectId, ...extra });
    if (process.env.VERCEL_ANALYTICS_TEAM_ID) params.set('teamId', process.env.VERCEL_ANALYTICS_TEAM_ID);
    const response = await fetch(`https://api.vercel.com/v1/query/web-analytics/visits/${endpoint}?${params}`, {
      headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 120 }, signal: AbortSignal.timeout(6500),
    });
    if (!response.ok) throw new Error('Analytics unavailable');
    return response.json();
  };
  try {
    const [totals, trend] = await Promise.all([query('count'), query('aggregate', { since: start.toISOString(), until: now.toISOString(), by: 'day' })]);
    return NextResponse.json({ available: true, data: normaliseAnalytics(totals, trend, now) }, { headers });
  } catch {
    return NextResponse.json({ available: false, reason: 'connection_failed' }, { headers });
  }
}
