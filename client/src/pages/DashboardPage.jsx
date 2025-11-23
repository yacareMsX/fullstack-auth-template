import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function DashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    padding: '1.5rem',
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                            Dashboard
                        </h1>
                        <p style={{ color: '#6b7280' }}>
                            Welcome back, {user?.firstName || user?.email}!
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                    >
                        Logout
                    </button>
                </div>

                {/* User Info Card */}
                <div style={{
                    padding: '2rem',
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1.5rem' }}>
                        User Information
                    </h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <span style={{ fontWeight: '600', color: '#374151' }}>Email: </span>
                            <span style={{ color: '#6b7280' }}>{user?.email}</span>
                        </div>
                        {user?.firstName && (
                            <div>
                                <span style={{ fontWeight: '600', color: '#374151' }}>Name: </span>
                                <span style={{ color: '#6b7280' }}>{user.firstName} {user.lastName}</span>
                            </div>
                        )}
                        <div>
                            <span style={{ fontWeight: '600', color: '#374151' }}>Role: </span>
                            <span style={{
                                color: 'white',
                                backgroundColor: user?.role === 'admin' ? '#3b82f6' : '#10b981',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                            }}>
                                {user?.role || 'user'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Placeholder for future content */}
                <div style={{
                    marginTop: '2rem',
                    padding: '3rem',
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                }}>
                    <h3 style={{ fontSize: '1.25rem', color: '#6b7280', marginBottom: '1rem' }}>
                        🚀 Your Application Content Goes Here
                    </h3>
                    <p style={{ color: '#9ca3af' }}>
                        This is a protected route. Only authenticated users can see this page.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
