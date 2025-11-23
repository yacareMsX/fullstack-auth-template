import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '1.5rem',
                color: '#6b7280'
            }}>
                Loading...
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Render children if authenticated
    return children;
};

export default ProtectedRoute;
