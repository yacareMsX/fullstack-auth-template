import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const InvoiceList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        estado: '',
        fecha_desde: '',
        fecha_hasta: ''
    });

    useEffect(() => {
        fetchInvoices();
    }, [filters]);

    const fetchInvoices = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const params = new URLSearchParams();

            if (filters.estado) params.append('estado', filters.estado);
            if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
            if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);

            const response = await fetch(`http://localhost:3000/api/invoices/facturas?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setInvoices(data);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (estado) => {
        const colors = {
            'BORRADOR': '#6b7280', 'EMITIDA': '#3b82f6', 'ENVIADA': '#8b5cf6',
            'FIRMADA': '#10b981', 'REGISTRADA': '#059669', 'RECHAZADA': '#ef4444',
            'PAGADA': '#22c55e', 'CANCELADA': '#dc2626'
        };
        return colors[estado] || '#6b7280';
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
                        {t('all_invoices') || 'All Invoices'}
                    </h1>
                    <Link
                        to="/invoices/new"
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#111827',
                            color: 'white',
                            borderRadius: '0.5rem',
                            textDecoration: 'none',
                            fontWeight: '600'
                        }}
                    >
                        + {t('new_invoice') || 'New Invoice'}
                    </Link>
                </div>

                {/* Filters */}
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                                {t('status') || 'Status'}
                            </label>
                            <select
                                value={filters.estado}
                                onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                            >
                                <option value="">{t('all') || 'All'}</option>
                                <option value="BORRADOR">BORRADOR</option>
                                <option value="EMITIDA">EMITIDA</option>
                                <option value="ENVIADA">ENVIADA</option>
                                <option value="FIRMADA">FIRMADA</option>
                                <option value="PAGADA">PAGADA</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                                {t('from_date') || 'From Date'}
                            </label>
                            <input
                                type="date"
                                value={filters.fecha_desde}
                                onChange={(e) => setFilters({ ...filters, fecha_desde: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                                {t('to_date') || 'To Date'}
                            </label>
                            <input
                                type="date"
                                value={filters.fecha_hasta}
                                onChange={(e) => setFilters({ ...filters, fecha_hasta: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'end' }}>
                            <button
                                onClick={() => setFilters({ estado: '', fecha_desde: '', fecha_hasta: '' })}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#e5e7eb',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                {t('clear_filters') || 'Clear Filters'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Invoices Table */}
                <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
                    ) : invoices.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                            <p>{t('no_invoices_found') || 'No invoices found'}</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: '#f9fafb' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                                        {t('number') || 'Number'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                                        {t('issuer') || 'Issuer'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                                        {t('receiver') || 'Receiver'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                                        {t('date') || 'Date'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                                        {t('status') || 'Status'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                                        {t('amount') || 'Amount'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                                        {t('actions') || 'Actions'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id_factura} style={{ borderTop: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <Link
                                                to={`/invoices/${invoice.id_factura}`}
                                                style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '600' }}
                                            >
                                                {invoice.serie ? `${invoice.serie}-` : ''}{invoice.numero}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#6b7280' }}>
                                            {invoice.emisor_nombre}
                                        </td>
                                        <td style={{ padding: '1rem', color: '#111827' }}>
                                            {invoice.receptor_nombre}
                                        </td>
                                        <td style={{ padding: '1rem', color: '#6b7280' }}>
                                            {new Date(invoice.fecha_emision).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
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
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#111827' }}>
                                            €{parseFloat(invoice.total).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <button
                                                onClick={() => navigate(`/invoices/${invoice.id_factura}`)}
                                                style={{
                                                    padding: '0.375rem 0.75rem',
                                                    backgroundColor: '#3b82f6',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '0.375rem',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {t('view') || 'View'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InvoiceList;
