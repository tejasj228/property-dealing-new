import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Box, Drawer, IconButton, Button, Tooltip } from '@mui/material';
import MenuOutlined from '@mui/icons-material/MenuOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import GridViewOutlined from '@mui/icons-material/GridViewOutlined';
import HomeWorkOutlined from '@mui/icons-material/HomeWorkOutlined';
import MapOutlined from '@mui/icons-material/MapOutlined';
import CollectionsOutlined from '@mui/icons-material/CollectionsOutlined';
import MailOutline from '@mui/icons-material/MailOutline';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import { useAuth } from '../../contexts/AuthContext';

const pages = [
  { path: '/', label: 'Overview', icon: GridViewOutlined, description: 'Your property workspace' },
  { path: '/properties', label: 'Properties', icon: HomeWorkOutlined, description: 'Listings & availability' },
  { path: '/areas', label: 'Areas & societies', icon: MapOutlined, description: 'Locations & neighbourhoods' },
  { path: '/images', label: 'Media library', icon: CollectionsOutlined, description: 'Images & documents' },
  { path: '/contacts', label: 'Enquiries', icon: MailOutline, description: 'Conversations & follow-ups' },
];
const website = process.env.REACT_APP_WEBSITE_URL || 'https://www.pawanbuildhome.com';

export default function Layout({ children }) {
  const [open, setOpen] = useState(false), [signingOut, setSigningOut] = useState(false);
  const location = useLocation(), { user, logout } = useAuth();
  useEffect(() => { setOpen(false); document.title = `${pages.find(page => page.path === location.pathname)?.label || 'Workspace'} | Pawan Buildhome`; }, [location.pathname]);
  const current = pages.find(page => page.path === location.pathname) || pages[0];
  async function signOut() { setSigningOut(true); try { await logout(); } finally { setSigningOut(false); } }
  const sidebar = <div className="admin-sidebar-content">
    <NavLink to="/" className="admin-wordmark" aria-label="Pawan Buildhome overview"><img src="/brand-icon.svg" alt="" /><span>Pawan Buildhome<small>Property workspace</small></span></NavLink>
    <div className="admin-nav-label">Manage your business</div>
    <nav className="admin-navigation" aria-label="Workspace navigation">{pages.map(({ path, label, icon: Icon }) => <NavLink end={path === '/'} key={path} to={path} className={({ isActive }) => isActive ? 'active' : ''}><Icon fontSize="small" /><span>{label}</span></NavLink>)}</nav>
    <div className="admin-sidebar-bottom"><a href={website} target="_blank" rel="noopener noreferrer"><OpenInNewOutlined fontSize="small" /><span>View website</span></a><div className="admin-account"><span className="admin-initial">{(user?.username || 'A').slice(0, 1).toUpperCase()}</span><div><strong>{user?.username || 'Administrator'}</strong><small>Administrator</small></div><Tooltip title="Sign out"><IconButton aria-label="Sign out" onClick={signOut} disabled={signingOut} sx={{ color: '#c1d4c8' }}><LogoutOutlined fontSize="small" /></IconButton></Tooltip></div></div>
  </div>;
  return <div className="admin-shell"><a className="admin-skip" href="#admin-content">Skip to content</a>
    <aside className="admin-sidebar">{sidebar}</aside>
    <Drawer open={open} onClose={() => setOpen(false)} variant="temporary" slotProps={{ paper: { sx: { width: 260, bgcolor: '#18372c', color: '#eff6f1' } } }}>
      <IconButton aria-label="Close navigation" onClick={() => setOpen(false)} sx={{ color: '#eff6f1', position: 'absolute', right: 8, top: 16 }}><CloseOutlined /></IconButton>{sidebar}
    </Drawer>
    <div className="admin-workspace"><header className="admin-topbar"><Box sx={{ display: { xs: 'block', md: 'none' } }}><IconButton aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}><MenuOutlined /></IconButton></Box><div><strong>{current.label}</strong><span>{current.description}</span></div><Button component="a" href={website} target="_blank" rel="noopener noreferrer" variant="outlined" endIcon={<OpenInNewOutlined fontSize="small" />} sx={{ ml: 'auto', display: { xs: 'none', sm: 'inline-flex' } }}>View website</Button></header><main id="admin-content" className="admin-content" tabIndex={-1}>{children}</main><footer className="admin-workspace-footer">Pawan Buildhome<span>Residential & commercial property</span></footer></div>
  </div>;
}
