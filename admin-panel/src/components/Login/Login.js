import PropertyStory from './PropertyStory';
import React, { useState } from 'react';
import { Alert, Button, CircularProgress, TextField, InputAdornment, IconButton } from '@mui/material';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' }), [showPassword, setShowPassword] = useState(false), [submitting, setSubmitting] = useState(false);
  const { login, error } = useAuth();
  async function submit(event) {
    event.preventDefault(); if (submitting || !credentials.username.trim() || !credentials.password) return;
    setSubmitting(true); try { await login(credentials.username.trim(), credentials.password); } finally { setSubmitting(false); }
  }
  return <main className="admin-login"><section className="admin-login-brand" aria-label="Pawan Buildhome"><img src="/brand-icon.svg" alt="Pawan Buildhome" /><PropertyStory /><small>Pawan Buildhome · Property management</small></section><section className="admin-login-form"><div><h1>Welcome back.</h1><p>Sign in to manage your properties and enquiries.</p>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<form onSubmit={submit}>
    <TextField fullWidth required id="username" label="Username" autoComplete="username" autoFocus value={credentials.username} onChange={event => setCredentials(old => ({ ...old, username: event.target.value }))} disabled={submitting} />
    <TextField fullWidth required id="password" label="Password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={credentials.password} onChange={event => setCredentials(old => ({ ...old, password: event.target.value }))} disabled={submitting} slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} edge="end" disabled={submitting}>{showPassword ? <VisibilityOffOutlined fontSize="small" /> : <VisibilityOutlined fontSize="small" />}</IconButton></InputAdornment> } }} />
    <Button type="submit" fullWidth variant="contained" size="large" disabled={submitting || !credentials.username.trim() || !credentials.password} startIcon={submitting ? <CircularProgress size={17} color="inherit" /> : null}>{submitting ? 'Signing in…' : 'Sign in'}</Button>
  </form><a className="admin-login-back" href={process.env.REACT_APP_WEBSITE_URL || 'https://www.pawanbuildhome.com'}>Back to the website</a></div></section></main>;
}
