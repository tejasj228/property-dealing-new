import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../services/api';
import './OverviewInsights.css';

function Bars({ rows, empty }) {
  const max = Math.max(1, ...rows.map(row => row.value));
  if (!rows.length || !rows.some(row => row.value)) return <p className="insights-empty">{empty}</p>;
  return <ul className="insight-bars">{rows.map(row => <li key={row.label}><div><span>{row.label}</span><strong>{row.value}</strong></div><span className="insight-track" aria-hidden="true"><span style={{ width: `${row.value / max * 100}%`, background: row.color }} /></span></li>)}</ul>;
}
export default function OverviewInsights({ properties, stats, loading, revision }) {
  const [traffic, setTraffic] = useState(null), [busy, setBusy] = useState(true);
  useEffect(() => {
    let active = true; setBusy(true);
    analyticsAPI.getOverview().then(result => { if (active) setTraffic(result); }).catch(() => { if (active) setTraffic({ available: false, reason: 'connection_failed' }); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [revision]);
  const residential = properties?.filter(property => property.propertyType === 'residential').length || 0;
  const commercial = properties?.filter(property => property.propertyType === 'commercial').length || 0;
  const other = (properties?.length || 0) - residential - commercial;
  const total = properties?.length || 0;
  const percentage = total ? Math.round(residential / total * 100) : 0;
  const statuses = Object.entries(stats?.statusCounts || {}).map(([label, value]) => ({ label: label.replaceAll('_', ' '), value, color: label === 'new' ? '#e4ba45' : '#a99b7d' }));
  const days = traffic?.data?.days || [], peak = Math.max(1, ...days.map(day => day.pageviews));
  return <div className="overview-insights">
    <section className="admin-panel portfolio-panel"><div className="admin-panel-heading"><h2>Portfolio composition</h2><span className="insight-period">Current listings</span></div>
      {loading ? <p className="insights-empty">Loading your portfolio…</p> : !properties ? <p className="insights-empty">Portfolio data is unavailable.</p> : <div className="portfolio-body"><div className="portfolio-ring" style={{ '--residential': `${total ? residential / total * 100 : 0}%`, '--commercial': `${total ? (residential + commercial) / total * 100 : 0}%` }} aria-hidden="true"><div><strong>{total}</strong><span>properties</span></div></div><div className="portfolio-legend"><Bars rows={[{ label: 'Residential', value: residential, color: '#68a481' }, { label: 'Commercial', value: commercial, color: '#d39b63' }, ...(other ? [{ label: 'Other', value: other, color: '#a49e8d' }] : [])]} empty="Add your first property to build your portfolio." />{total > 0 && <p>{percentage}% of your portfolio is residential.</p>}</div></div>}
    </section>
    <section className="admin-panel"><div className="admin-panel-heading"><h2>Enquiry pipeline</h2><span className="insight-period">All enquiries</span></div><div className="pipeline-body">{loading ? <p className="insights-empty">Loading enquiries…</p> : !stats ? <p className="insights-empty">Enquiry statistics are unavailable.</p> : <><Bars rows={statuses} empty="New enquiries will build your pipeline here." /><div className="pipeline-summary"><strong>{stats.recentCount ?? 'Unavailable'}</strong><span>received in the last 30 days</span></div></>}</div></section>
    <section className="admin-panel traffic-panel"><div className="admin-panel-heading"><div><h2>Website traffic</h2><span className="insight-period">Vercel Web Analytics · Production website</span></div><a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">Open Vercel ↗</a></div>
      {busy ? <p className="insights-empty" role="status">Loading website traffic…</p> : !traffic?.available ? <div className="analytics-connect"><span className="analytics-symbol" aria-hidden="true">↗</span><div><h3>{traffic?.reason === 'not_configured' ? 'Connect your website insights.' : 'Traffic figures are unavailable.'}</h3><p>{traffic?.reason === 'not_configured' ? 'Vercel tracking is separate from dashboard access. Connect the project’s analytics access to display live visits here.' : 'Check the analytics connection and refresh the overview. Your property and enquiry figures remain available above.'}</p><small>No estimated or sample traffic is shown.</small></div></div> : <div className="traffic-body"><div className="traffic-totals"><div><span>Page views</span><strong>{traffic.data.pageviews.toLocaleString()}</strong><small>All time · production</small></div><div><span>Visitors</span><strong>{traffic.data.visitors.toLocaleString()}</strong><small>All time · production</small></div></div><div className="traffic-trend"><h3>Page views · last 7 days <small>UTC · today is partial</small></h3><div className="traffic-bars">{days.map(day => <div key={day.day}><span>{day.pageviews}</span><div className="traffic-column"><i style={{ height: `${day.pageviews / peak * 100}%` }} /></div><time dateTime={day.day}>{new Date(`${day.day}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })}</time></div>)}</div>{days.every(day => !day.pageviews) && <p className="traffic-zero">No page views recorded in this period.</p>}</div></div>}
    </section>
  </div>;
}
