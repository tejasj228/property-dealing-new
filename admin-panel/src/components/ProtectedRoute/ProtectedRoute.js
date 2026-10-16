import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import Login from '../Login/Login';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#f4f7f5',
        }}
      >
        <CircularProgress size={60} sx={{ color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          Verifying credentials...
        </Typography>
      </Box>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show protected content if authenticated
  return children;
}

export default ProtectedRoute;