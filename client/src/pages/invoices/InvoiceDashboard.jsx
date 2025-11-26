import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

const InvoiceDashboard = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [stats, setStats] = useState({
        total: 0,
        borrador: 0,
        emitida: 0,
        pagada: 0,
        totalAmount: 0
    });
    const [recentInvoices, setRecentInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('auth_token');

            // Fetch recent invoices
            const response = await fetch('http://localhost:3000/api/invoices/facturas?limit=5', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const invoices = await response.json();
                setRecentInvoices(invoices);

                // Calculate stats
                const stats = {
                    total: invoices.length,
                    borrador: invoices.filter(inv => inv.estado === 'BORRADOR').length,
                    emitida: invoices.filter(inv => inv.estado === 'EMITIDA').length,
                    pagada: invoices.filter(inv => inv.estado === 'PAGADA').length,
                    totalAmount: invoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0)
                };
                setStats(stats);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (estado) => {
        const colors = {
            'BORRADOR': '#6b7280',
            'EMITIDA': '#3b82f6',
            'ENVIADA': '#8b5cf6',
            'FIRMADA': '#10b981',
            'REGISTRADA': '#059669',
            'RECHAZADA': '#ef4444',
            'PAGADA': '#22c55e',
            'CANCELADA': '#dc2626'
        };
        return colors[estado] || '#6b7280';
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '1.5rem', color: '#6b7280' }}>Loading...</div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                            {t('invoices') || 'Invoices'}
                        </h1>
                        <p style={{ color: '#6b7280' }}>
                            {t('invoice_management') || 'Manage your invoices and billing'}
                        </p>
                    </div>
                    <Link
                        to="/invoices/new"
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#111827',
                            color: 'white',
                            borderRadius: '0.5rem',
                            textDecoration: 'none',
                            fontWeight: '600',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        + {t('new_invoice') || 'New Invoice'}
                    </Link>
                </div>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                            {t('total_invoices') || 'Total Invoices'}
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
                            {stats.total}
                        </div>
                    </div>

                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                            {t('draft') || 'Draft'}
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6b7280' }}>
                            {stats.borrador}
                        </div>
                    </div>

                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                            {t('issued') || 'Issued'}
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                            {stats.emitida}
                        </div>
                    </div>

                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                            {t('paid') || 'Paid'}
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>
                            {stats.pagada}
                        </div>
                    </div>

                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                            {t('total_amount') || 'Total Amount'}
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
                            €{stats.totalAmount.toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <Link
                        to="/invoices/list"
                        style={{
                            padding: '1rem',
                            backgroundColor: 'white',
                            borderRadius: '0.5rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            textDecoration: 'none',
                            color: '#111827',
                            textAlign: 'center',
                            fontWeight: '600',
                            transition: 'transform 0.2s'
                        }}
                    >
                        📋 {t('view_all_invoices') || 'View All Invoices'}
                    </Link>

                    <Link
                        to="/invoices/issuers"
                        style={{
                            padding: '1rem',
                            backgroundColor: 'white',
                            borderRadius: '0.5rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            textDecoration: 'none',
                            color: '#111827',
                            textAlign: 'center',
                            fontWeight: '600'
                        }}
                    >
                        🏢 {t('manage_issuers') || 'Manage Issuers'}
                    </Link>

                    <Link
                        to="/invoices/receivers"
                        style={{
                            padding: '1rem',
                            backgroundColor: 'white',
                            borderRadius: '0.5rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            textDecoration: 'none',
                            color: '#111827',
                            textAlign: 'center',
                            fontWeight: '600'
                        }}
                    >
                        👥 {t('manage_receivers') || 'Manage Receivers'}
                    </Link>

                    <Link
                        to="/invoices/taxes"
                        style={{
                            padding: '1rem',
                            backgroundColor: 'white',
                            borderRadius: '0.5rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            textDecoration: 'none',
                            color: '#111827',
                            textAlign: 'center',
                            fontWeight: '600'
                        }}
                    >
                        💰 {t('manage_taxes') || 'Manage Taxes'}
                    </Link>
                </div>

                {/* Recent Invoices */}
                <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '1.5rem' }}>
                        {t('recent_invoices') || 'Recent Invoices'}
                    </h2>

                    {recentInvoices.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                            <p>{t('no_invoices_yet') || 'No invoices yet'}</p>
                            <Link
                                to="/invoices/new"
                                style={{
                                    display: 'inline-block',
                                    marginTop: '1rem',
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#111827',
                                    color: 'white',
                                    borderRadius: '0.5rem',
                                    textDecoration: 'none',
                                    fontWeight: '600'
                                }}
                            >
                                {t('create_first_invoice') || 'Create your first invoice'}
                            </Link>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                                            {t('number') || 'Number'}
                                        </th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                                            {t('receiver') || 'Receiver'}
                                        </th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                                            {t('date') || 'Date'}
                                        </th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                                            {t('status') || 'Status'}
                                        </th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                                            {t('amount') || 'Amount'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentInvoices.map((invoice) => (
                                        <tr key={invoice.id_factura} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                            <td style={{ padding: '0.75rem' }}>
                                                <Link
                                                    to={`/invoices/${invoice.id_factura}`}
                                                    style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '600' }}
                                                >
                                                    {invoice.serie ? `${invoice.serie}-` : ''}{invoice.numero}
                                                </Link>
                                            </td>
                                            <td style={{ padding: '0.75rem', color: '#111827' }}>
                                                {invoice.receptor_nombre}
                                            </td>
                                            <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                                                {new Date(invoice.fecha_emision).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '9999px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    color: 'white',
                                                    backgroundColor: getStatusColor(invoice.estado)
                                                }}>
                                                    {invoice.estado}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#111827' }}>
                                                €{parseFloat(invoice.total).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InvoiceDashboard;
