import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const InvoiceDetail = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    const fetchInvoice = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://localhost:3000/api/invoices/facturas/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setInvoice(await response.json());
            }
        } catch (error) {
            console.error('Error fetching invoice:', error);
        } finally {
            setLoading(false);
        }
    };

    const changeStatus = async (newStatus) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://localhost:3000/api/invoices/facturas/${id}/estado`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: newStatus })
            });

            if (response.ok) {
                fetchInvoice();
            }
        } catch (error) {
            console.error('Error changing status:', error);
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

    if (loading) {
        return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>;
    }

    if (!invoice) {
        return <div style={{ padding: '3rem', textAlign: 'center' }}>Invoice not found</div>;
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                            {t('invoice') || 'Invoice'} {invoice.serie ? `${invoice.serie}-` : ''}{invoice.numero}
                        </h1>
                        <span style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: 'white',
                            backgroundColor: getStatusColor(invoice.estado)
                        }}>
                            {invoice.estado}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link
                            to={`/invoices/edit/${id}`}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                borderRadius: '0.5rem',
                                textDecoration: 'none',
                                fontWeight: '600'
                            }}
                        >
                            {t('edit') || 'Edit'}
                        </Link>
                        <button
                            onClick={() => navigate('/invoices/list')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#e5e7eb',
                                color: '#374151',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            {t('back') || 'Back'}
                        </button>
                    </div>
                </div>

                {/* Invoice Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                            {t('issuer') || 'Issuer'}
                        </h2>
                        <div style={{ color: '#6b7280' }}>
                            <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>{invoice.emisor_nombre}</div>
                            <div>{invoice.emisor_nif}</div>
                            <div>{invoice.emisor_direccion}</div>
                            <div>{invoice.emisor_email}</div>
                            <div>{invoice.emisor_telefono}</div>
                        </div>
                    </div>

                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                            {t('receiver') || 'Receiver'}
                        </h2>
                        <div style={{ color: '#6b7280' }}>
                            <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>{invoice.receptor_nombre}</div>
                            <div>{invoice.receptor_nif}</div>
                            <div>{invoice.receptor_direccion}</div>
                            <div>{invoice.receptor_email}</div>
                            <div>{invoice.receptor_telefono}</div>
                        </div>
                    </div>
                </div>

                {/* Dates & Payment */}
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>{t('issue_date') || 'Issue Date'}</div>
                            <div style={{ fontWeight: '600' }}>{new Date(invoice.fecha_emision).toLocaleDateString()}</div>
                        </div>
                        {invoice.fecha_vencimiento && (
                            <div>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>{t('due_date') || 'Due Date'}</div>
                                <div style={{ fontWeight: '600' }}>{new Date(invoice.fecha_vencimiento).toLocaleDateString()}</div>
                            </div>
                        )}
                        {invoice.metodo_pago && (
                            <div>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>{t('payment_method') || 'Payment Method'}</div>
                                <div style={{ fontWeight: '600' }}>{invoice.metodo_pago}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Line Items */}
                <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f9fafb' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                                    {t('description') || 'Description'}
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                                    {t('quantity') || 'Qty'}
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                                    {t('unit_price') || 'Price'}
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                                    {t('tax') || 'Tax'}
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                                    {t('total') || 'Total'}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.lineas?.map((linea, index) => (
                                <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '1rem' }}>{linea.descripcion}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>{linea.cantidad}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>€{parseFloat(linea.precio_unitario).toFixed(2)}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        {linea.porcentaje_impuesto}% (€{parseFloat(linea.importe_impuesto).toFixed(2)})
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>€{parseFloat(linea.total_linea).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot style={{ borderTop: '2px solid #e5e7eb' }}>
                            <tr>
                                <td colSpan="4" style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>{t('subtotal') || 'Subtotal'}:</td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>€{parseFloat(invoice.subtotal).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colSpan="4" style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>{t('taxes') || 'Taxes'}:</td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>€{parseFloat(invoice.impuestos_totales).toFixed(2)}</td>
                            </tr>
                            <tr style={{ backgroundColor: '#f9fafb' }}>
                                <td colSpan="4" style={{ padding: '1rem', textAlign: 'right', fontSize: '1.25rem', fontWeight: 'bold' }}>{t('total') || 'Total'}:</td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.25rem', fontWeight: 'bold' }}>€{parseFloat(invoice.total).toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Status Actions */}
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        {t('change_status') || 'Change Status'}
                    </h2>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {['EMITIDA', 'ENVIADA', 'FIRMADA', 'PAGADA', 'CANCELADA'].map(status => (
                            <button
                                key={status}
                                onClick={() => changeStatus(status)}
                                disabled={invoice.estado === status}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: invoice.estado === status ? '#e5e7eb' : getStatusColor(status),
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    cursor: invoice.estado === status ? 'not-allowed' : 'pointer',
                                    opacity: invoice.estado === status ? 0.5 : 1
                                }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetail;
