import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button } from '@mui/material';
import HomeWorkOutlined from '@mui/icons-material/HomeWorkOutlined';
import MapOutlined from '@mui/icons-material/MapOutlined';
import MailOutline from '@mui/icons-material/MailOutline';
import MarkEmailUnreadOutlined from '@mui/icons-material/MarkEmailUnreadOutlined';
import AddOutlined from '@mui/icons-material/AddOutlined';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import { propertyAPI, areaAPI, contactAPI } from '../services/api';
import { getImageUrl } from '../utils/imageUtils';

function Stat({ title, value, note, icon: Icon }) {
  return <article className="admin-stat"><div>{title}<Icon /></div><strong>{value ?? '—'}</strong><small>{note}</small></article>;
}
export default function Dashboard() {
  const [data, setData] = useState({}), [loading, setLoading] = useState(true), [failed, setFailed] = useState([]), [revision, setRevision] = useState(0);
  useEffect(() => {
    let disposed = false; setLoading(true);
    Promise.allSettled([propertyAPI.getAll(), areaAPI.getAll(), contactAPI.getAll({ limit: 5 }), contactAPI.getStats()]).then(results => {
      if (disposed) return;
      const names = ['properties', 'areas', 'enquiries', 'enquiry statistics'];
      setFailed(results.flatMap((result, i) => result.status === 'rejected' ? [names[i]] : []));
      const read = i => results[i].status === 'fulfilled' ? results[i].value : null;
      setData({ properties: read(0)?.data, areas: read(1)?.data, contacts: read(2)?.data, stats: read(3)?.data }); setLoading(false);
    });
    return () => { disposed = true; };
  }, [revision]);
  const recentProperties = [...(data.properties || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);
  return <div><div className="admin-page-heading"><div><h1>A clear view of your business.</h1><p>Keep your listings up to date and follow up on the conversations that matter.</p></div><Button variant="outlined" startIcon={<RefreshOutlined />} disabled={loading} onClick={() => setRevision(value => value + 1)}>Refresh</Button></div>
    {failed.length > 0 && <Alert severity="warning" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={() => setRevision(value => value + 1)}>Retry</Button>}>Couldn’t load {failed.join(', ')}. These figures are unavailable until the connection is restored.</Alert>}
    <div className="admin-stats" aria-busy={loading}><Stat title="Published properties" value={loading ? null : data.properties?.length} note="Active listings on your website" icon={HomeWorkOutlined} /><Stat title="Service areas" value={loading || !data.areas ? null : Object.keys(data.areas).length} note="Locations in your collection" icon={MapOutlined} /><Stat title="Total enquiries" value={loading ? null : data.stats?.totalContacts} note="People who have contacted you" icon={MailOutline} /><Stat title="Unread enquiries" value={loading ? null : data.stats?.unreadCount} note="Ready for your attention" icon={MarkEmailUnreadOutlined} /></div>
    <div className="admin-overview-grid"><section className="admin-panel"><div className="admin-panel-heading"><h2>Latest properties</h2><Link to="/properties">Manage properties</Link></div>{loading ? <div className="admin-empty" role="status">Loading properties…</div> : !data.properties ? <div className="admin-empty">Property data is unavailable. Check the connection and try again.</div> : recentProperties.length ? recentProperties.map(property => <Link to="/properties" className="admin-overview-row" key={property._id}>{property.images?.[0] ? <img className="admin-property-thumb" src={getImageUrl(property.images[0])} alt="" loading="lazy" decoding="async" /> : <div className="admin-property-thumb" />}<div><strong>{property.title}</strong><p>{property.location}</p><p>{property.price}{property.area ? ` · ${property.area}` : ''}</p></div></Link>) : <div className="admin-empty">Your first listing starts here. Add a property to begin.</div>}</section>
    <section className="admin-panel"><div className="admin-panel-heading"><h2>Recent enquiries</h2><Link to="/contacts">Open enquiries</Link></div>{loading ? <div className="admin-empty" role="status">Loading enquiries…</div> : !data.contacts ? <div className="admin-empty">Enquiries are unavailable. Check the connection and try again.</div> : data.contacts.length ? data.contacts.map(contact => <Link to="/contacts" className="admin-overview-row" key={contact._id}>{!contact.isRead && <span className="admin-dot" aria-label="Unread" />}<div><strong>{contact.name}</strong><p>{contact.interest || contact.email}</p><p>{(contact.message || '').slice(0, 95)}</p></div>{contact.createdAt && <time dateTime={contact.createdAt}>{new Date(contact.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</time>}</Link>) : <div className="admin-empty">New website enquiries will appear here.</div>}</section></div>
    <div className="admin-shortcuts"><Button component={Link} to="/properties" variant="contained" startIcon={<AddOutlined />}>Manage properties</Button><Button component={Link} to="/areas" variant="outlined">Organise areas & societies</Button><Button component={Link} to="/images" variant="outlined">Open media library</Button></div>
  </div>;
}
