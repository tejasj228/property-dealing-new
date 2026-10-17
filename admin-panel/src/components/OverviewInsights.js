import React from 'react';
import { Link } from 'react-router-dom';
import './OverviewInsights.css';

function Bars({ rows, empty }) {
  const max = Math.max(1, ...rows.map(row => row.value));
  if (!rows.length || !rows.some(row => row.value)) return <p className="insights-empty">{empty}</p>;
  return <ul className="insight-bars">{rows.map(row => <li key={row.label}><div><span>{row.label}</span><strong>{row.value}</strong></div><span className="insight-track" aria-hidden="true"><span style={{ width: `${row.value / max * 100}%`, background: row.color }} /></span></li>)}</ul>;
}
export default function OverviewInsights({ properties, stats, loading }) {
  const residential = properties?.filter(property => property.propertyType === 'residential').length || 0;
  const commercial = properties?.filter(property => property.propertyType === 'commercial').length || 0;
  const other = (properties?.length || 0) - residential - commercial;
  const total = properties?.length || 0;
  const percentage = total ? Math.round(residential / total * 100) : 0;
  const statuses = Object.entries(stats?.statusCounts || {}).map(([label, value]) => ({ label: label.replaceAll('_', ' '), value, color: label === 'new' ? '#e4ba45' : '#a99b7d' }));
  return <div className="overview-insights">
    <Link to="/properties" aria-label="Portfolio composition — view properties" className="admin-panel portfolio-panel insight-link"><div className="admin-panel-heading"><h2>Portfolio composition</h2><span className="insight-period">View listings ↗</span></div>
      {loading ? <p className="insights-empty">Loading your portfolio…</p> : !properties ? <p className="insights-empty">Portfolio data is unavailable.</p> : <div className="portfolio-body"><div className="portfolio-ring" style={{ '--residential': `${total ? residential / total * 100 : 0}%`, '--commercial': `${total ? (residential + commercial) / total * 100 : 0}%` }} aria-hidden="true"><div><strong>{total}</strong><span>properties</span></div></div><div className="portfolio-legend"><Bars rows={[{ label: 'Residential', value: residential, color: '#68a481' }, { label: 'Commercial', value: commercial, color: '#d39b63' }, ...(other ? [{ label: 'Other', value: other, color: '#a49e8d' }] : [])]} empty="Add your first property to build your portfolio." />{total > 0 && <p>{percentage}% of your portfolio is residential.</p>}</div></div>}
    </Link>
    <Link to="/contacts" aria-label="Enquiry pipeline — view enquiries" className="admin-panel insight-link"><div className="admin-panel-heading"><h2>Enquiry pipeline</h2><span className="insight-period">View enquiries ↗</span></div><div className="pipeline-body">{loading ? <p className="insights-empty">Loading enquiries…</p> : !stats ? <p className="insights-empty">Enquiry statistics are unavailable.</p> : <><Bars rows={statuses} empty="New enquiries will build your pipeline here." /><div className="pipeline-summary"><strong>{stats.recentCount ?? 'Unavailable'}</strong><span>received in the last 30 days</span></div></>}</div></Link>
  </div>;
}
