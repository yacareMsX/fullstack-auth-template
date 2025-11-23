import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import '../pages/LoginPage.css';

const ForgotPasswordPage = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:3000/api/password-reset/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setSubmitted(true);
            } else {
                setError(data.error || 'An error occurred');
            }
        } catch (err) {
            console.error('Forgot password error:', err);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-wrapper">
            <div className="login-container">
                <LanguageSwitcher />

                <div className="login-image-side">
                    <img
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                        alt="Executive Team"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>

                <div className="login-form-side">
                    <div style={{ width: '100%', maxWidth: '400px' }}>
                        {!submitted ? (
                            <>
                                <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#111827' }}>
                                    {t('forgot_password')}
                                </h2>
                                <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                                    {t('forgot_password_description')}
                                </p>

                                <form onSubmit={handleSubmit}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                                            {t('email_address')}
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none' }}
                                            placeholder={t('enter_email')}
                                        />
                                    </div>

                                    {error && (
                                        <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            backgroundColor: loading ? '#6b7280' : '#111827',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            fontWeight: '600',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        {loading ? t('sending') : t('send_reset_link')}
                                    </button>
                                </form>

                                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
                                    <Link to="/" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>
                                        {t('back_to_login')}
                                    </Link>
                                </p>
                            </>
                        ) : (
                            <>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
                                    <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#111827' }}>
                                        {t('check_your_email')}
                                    </h2>
                                    <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                                        {t('reset_link_sent')}
                                    </p>
                                    <Link
                                        to="/"
                                        style={{
                                            display: 'inline-block',
                                            padding: '0.75rem 1.5rem',
                                            backgroundColor: '#111827',
                                            color: 'white',
                                            textDecoration: 'none',
                                            borderRadius: '0.5rem',
                                            fontWeight: '600'
                                        }}
                                    >
                                        {t('back_to_login')}
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
