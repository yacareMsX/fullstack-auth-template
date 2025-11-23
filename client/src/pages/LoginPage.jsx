import React, { useState } from 'react';
import { FaGoogle, FaMicrosoft } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './LoginPage.css';

import { useGoogleLogin } from '@react-oauth/google';

const LoginPage = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        console.log('Login attempt:', { email, password });
    };

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await fetch('http://localhost:3000/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: tokenResponse.access_token }),
                });
                const data = await res.json();
                if (res.ok) {
                    console.log('Google Login Success:', data);
                    alert(`Welcome ${data.user.name}!`);
                    // Navigate to dashboard or store session
                } else {
                    console.error('Google Login Failed:', data.error);
                }
            } catch (err) {
                console.error('Google Login Error:', err);
            }
        },
        onError: () => console.log('Google Login Failed'),
    });

    const handleSocialLogin = (provider) => {
        if (provider === 'Google') {
            googleLogin();
        } else {
            console.log(`Login with ${provider}`);
        }
    };

    return (
        <div className="login-page-wrapper">
            <div className="login-container">
                {/* Language Switcher */}
                <LanguageSwitcher />

                {/* Left Side - Image */}
                <div className="login-image-side">
                    <img
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                        alt="Executive Team"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>

                {/* Right Side - Login Form */}
                <div className="login-form-side">
                    <div style={{ width: '100%', maxWidth: '400px' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#111827' }}>{t('welcome_back')}</h2>
                        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>{t('sign_in_details')}</p>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <button
                                onClick={() => handleSocialLogin('Google')}
                                style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', backgroundColor: 'white', cursor: 'pointer', transition: 'background-color 0.2s' }}
                            >
                                <FaGoogle style={{ marginRight: '0.5rem' }} /> Google
                            </button>
                            <button
                                onClick={() => handleSocialLogin('Microsoft')}
                                style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', backgroundColor: 'white', cursor: 'pointer', transition: 'background-color 0.2s' }}
                            >
                                <FaMicrosoft style={{ marginRight: '0.5rem' }} /> Microsoft
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
                            <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                            <span style={{ padding: '0 0.5rem', color: '#9ca3af', fontSize: '0.875rem' }}>OR</span>
                            <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>{t('email_address')}</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none' }}
                                    placeholder="Enter your email"
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>{t('password')}</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none' }}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
                                    <input type="checkbox" style={{ marginRight: '0.5rem', borderRadius: '0.25rem' }} /> {t('remember_me')}
                                </label>
                                <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: '#2563eb', textDecoration: 'none' }}>{t('forgot_password')}</Link>
                            </div>

                            <button
                                type="submit"
                                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }}
                            >
                                {t('sign_in')}
                            </button>
                        </form>

                        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
                            {t('no_account')} <Link to="/register" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>{t('register_now')}</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
