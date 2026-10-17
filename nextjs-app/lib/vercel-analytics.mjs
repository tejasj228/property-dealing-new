export function normaliseAnalytics(totals, trend, now = new Date()) {
  const valid = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  if (!valid(totals?.data?.pageviews) || !valid(totals?.data?.visitors) || !Array.isArray(trend?.data)) throw new Error('Invalid analytics response');
  const days = new Map();
  for (let offset = 6; offset >= 0; offset--) {
    const date = new Date(now); date.setUTCDate(date.getUTCDate() - offset);
    const day = date.toISOString().slice(0, 10); days.set(day, { day, pageviews: 0, visitors: 0 });
  }
  for (const row of trend.data) {
    if (typeof row.timestamp !== 'string' || !valid(row.pageviews) || !valid(row.visitors)) throw new Error('Invalid analytics row');
    const day = row.timestamp.slice(0, 10);
    if (days.has(day)) days.set(day, { day, pageviews: row.pageviews, visitors: row.visitors });
  }
  return { pageviews: totals.data.pageviews, visitors: totals.data.visitors, days: [...days.values()], updatedAt: now.toISOString() };
}
