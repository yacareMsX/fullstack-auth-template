import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './LoginPage.css';

const RegisterPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        nif: '',
        password: '',
        confirmPassword: '',
        phone: '',
        addressLine1: '',
        city: '',
        country: ''
    });
    const [countries, setCountries] = useState([]);
    const [error, setError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        fetch('http://localhost:3000/api/countries')
            .then(res => res.json())
            .then(data => setCountries(data))
            .catch(err => console.error('Error loading countries:', err));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'password' || name === 'confirmPassword') {
            validatePassword(name === 'password' ? value : formData.password, name === 'confirmPassword' ? value : formData.confirmPassword);
        }
    };

    const validatePassword = (pass, confirm) => {
        if (pass !== confirm) {
            setPasswordError(t('passwords_mismatch'));
        } else {
            setPasswordError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setPasswordError(t('passwords_mismatch'));
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || t('registration_failed'));
            }

            alert(t('registration_success'));
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f9fafb', padding: '2rem' }}>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Form Container */}
            <div style={{ width: '100%', maxWidth: '600px', marginTop: '4rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#111827', textAlign: 'center' }}>{t('create_account')}</h2>
                <p style={{ color: '#6b7280', marginBottom: '2rem', textAlign: 'center' }}>{t('join_us')}</p>

                {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>{t('first_name')} *</label>
                            <input name="firstName" value={formData.firstName} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>{t('last_name')} *</label>
                            <input name="lastName" value={formData.lastName} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>{t('email_address')}</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>{t('nif')} *</label>
                        <input name="nif" value={formData.nif} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>{t('password')}</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>{t('confirm_password')} *</label>
                            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                        </div>
                    </div>
                    {passwordError && <div style={{ color: 'red', fontSize: '0.875rem', marginBottom: '1rem' }}>{passwordError}</div>}

                    {/* Optional Fields */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>{t('address')}</label>
                        <input name="addressLine1" value={formData.addressLine1} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>{t('country')}</label>
                        <input list="countries" name="country" value={formData.country} onChange={handleChange} placeholder={t('select_country')} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                        <datalist id="countries">
                            {countries.map(country => (
                                <option key={country.id} value={country.name} />
                            ))}
                        </datalist>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            style={{ flex: 1, padding: '0.75rem', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer' }}
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            style={{ flex: 1, padding: '0.75rem', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer' }}
                        >
                            {t('register')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
