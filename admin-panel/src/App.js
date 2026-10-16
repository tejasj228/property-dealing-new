import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Layout from './components/Layout/Layout';
import theme from './theme';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Properties = lazy(() => import('./pages/Properties'));
const Areas = lazy(() => import('./pages/Areas'));
const Images = lazy(() => import('./pages/Images'));
const Contacts = lazy(() => import('./pages/Contacts'));

export default function App() {
  return <ThemeProvider theme={theme}><CssBaseline /><AuthProvider><BrowserRouter><ProtectedRoute><Layout>
    <Suspense fallback={<div className="admin-page-loading" role="status"><span />Opening workspace…</div>}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/areas" element={<Areas />} />
        <Route path="/images" element={<Images />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </Layout></ProtectedRoute></BrowserRouter></AuthProvider></ThemeProvider>;
}
