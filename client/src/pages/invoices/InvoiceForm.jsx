import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const InvoiceForm = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [emisores, setEmisores] = useState([]);
    const [receptores, setReceptores] = useState([]);
    const [impuestos, setImpuestos] = useState([]);

    const [formData, setFormData] = useState({
        numero: '',
        serie: '',
        fecha_emision: new Date().toISOString().split('T')[0],
        fecha_vencimiento: '',
        id_emisor: '',
        id_receptor: '',
        metodo_pago: 'TRANSFERENCIA'
    });

    const [lineas, setLineas] = useState([{
        descripcion: '',
        cantidad: 1,
        precio_unitario: 0,
        id_impuesto: '',
        porcentaje_impuesto: 0,
        importe_impuesto: 0,
        total_linea: 0
    }]);

    useEffect(() => {
        fetchData();
        if (isEdit) {
            fetchInvoice();
        }
    }, [id]);

    const fetchData = async () => {
        const token = localStorage.getItem('auth_token');
        try {
            const [emisoresRes, receptoresRes, impuestosRes] = await Promise.all([
                fetch('http://localhost:3000/api/invoices/emisores', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:3000/api/invoices/receptores', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:3000/api/invoices/impuestos?activo=true', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            setEmisores(await emisoresRes.json());
            setReceptores(await receptoresRes.json());
            setImpuestos(await impuestosRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchInvoice = async () => {
        const token = localStorage.getItem('auth_token');
        try {
            const response = await fetch(`http://localhost:3000/api/invoices/facturas/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const invoice = await response.json();
                setFormData({
                    numero: invoice.numero,
                    serie: invoice.serie || '',
                    fecha_emision: invoice.fecha_emision,
                    fecha_vencimiento: invoice.fecha_vencimiento || '',
                    id_emisor: invoice.id_emisor,
                    id_receptor: invoice.id_receptor,
                    metodo_pago: invoice.metodo_pago || 'TRANSFERENCIA'
                });
                setLineas(invoice.lineas || []);
            }
        } catch (error) {
            console.error('Error fetching invoice:', error);
        }
    };

    const calculateLineTotal = (linea) => {
        const subtotal = parseFloat(linea.cantidad) * parseFloat(linea.precio_unitario);
        const impuesto = subtotal * (parseFloat(linea.porcentaje_impuesto) / 100);
        return {
            ...linea,
            importe_impuesto: impuesto.toFixed(2),
            total_linea: (subtotal + impuesto).toFixed(2)
        };
    };

    const handleLineChange = (index, field, value) => {
        const newLineas = [...lineas];
        newLineas[index] = { ...newLineas[index], [field]: value };

        if (field === 'id_impuesto') {
            const impuesto = impuestos.find(i => i.id_impuesto === value);
            if (impuesto) {
                newLineas[index].porcentaje_impuesto = impuesto.porcentaje;
            }
        }

        newLineas[index] = calculateLineTotal(newLineas[index]);
        setLineas(newLineas);
    };

    const addLine = () => {
        setLineas([...lineas, {
            descripcion: '',
            cantidad: 1,
            precio_unitario: 0,
            id_impuesto: '',
            porcentaje_impuesto: 0,
            importe_impuesto: 0,
            total_linea: 0
        }]);
    };

    const removeLine = (index) => {
        if (lineas.length > 1) {
            setLineas(lineas.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('auth_token');
            const url = isEdit
                ? `http://localhost:3000/api/invoices/facturas/${id}`
                : 'http://localhost:3000/api/invoices/facturas';

            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...formData, lineas })
            });

            if (response.ok) {
                const invoice = await response.json();
                navigate(`/invoices/${invoice.id_factura}`);
            } else {
                const error = await response.json();
                alert(error.error || 'Error saving invoice');
            }
        } catch (error) {
            console.error('Error saving invoice:', error);
            alert('Error saving invoice');
        } finally {
            setLoading(false);
        }
    };

    const totals = lineas.reduce((acc, linea) => ({
        subtotal: acc.subtotal + (parseFloat(linea.cantidad) * parseFloat(linea.precio_unitario)),
        impuestos: acc.impuestos + parseFloat(linea.importe_impuesto || 0),
        total: acc.total + parseFloat(linea.total_linea || 0)
    }), { subtotal: 0, impuestos: 0, total: 0 });

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '2rem' }}>
                    {isEdit ? t('edit_invoice') || 'Edit Invoice' : t('new_invoice') || 'New Invoice'}
                </h1>

                <form onSubmit={handleSubmit}>
                    {/* Invoice Header */}
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                            {t('invoice_details') || 'Invoice Details'}
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                    {t('number') || 'Number'} *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.numero}
                                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                    {t('series') || 'Series'}
                                </label>
                                <input
                                    type="text"
                                    value={formData.serie}
                                    onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                    {t('issue_date') || 'Issue Date'} *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.fecha_emision}
                                    onChange={(e) => setFormData({ ...formData, fecha_emision: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                    {t('due_date') || 'Due Date'}
                                </label>
                                <input
                                    type="date"
                                    value={formData.fecha_vencimiento}
                                    onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                    {t('issuer') || 'Issuer'} *
                                </label>
                                <select
                                    required
                                    value={formData.id_emisor}
                                    onChange={(e) => setFormData({ ...formData, id_emisor: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                >
                                    <option value="">{t('select') || 'Select...'}</option>
                                    {emisores.map(e => (
                                        <option key={e.id_emisor} value={e.id_emisor}>{e.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                    {t('receiver') || 'Receiver'} *
                                </label>
                                <select
                                    required
                                    value={formData.id_receptor}
                                    onChange={(e) => setFormData({ ...formData, id_receptor: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                >
                                    <option value="">{t('select') || 'Select...'}</option>
                                    {receptores.map(r => (
                                        <option key={r.id_receptor} value={r.id_receptor}>{r.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                    {t('payment_method') || 'Payment Method'}
                                </label>
                                <select
                                    value={formData.metodo_pago}
                                    onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                >
                                    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                                    <option value="TARJETA">TARJETA</option>
                                    <option value="ADEUDO_SEPA">ADEUDO_SEPA</option>
                                    <option value="PAYPAL">PAYPAL</option>
                                    <option value="CONTADO">CONTADO</option>
                                    <option value="OTRO">OTRO</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Lines */}
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                {t('line_items') || 'Line Items'}
                            </h2>
                            <button
                                type="button"
                                onClick={addLine}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                + {t('add_line') || 'Add Line'}
                            </button>
                        </div>

                        {lineas.map((linea, index) => (
                            <div key={index} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                            {t('description') || 'Description'}
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={linea.descripcion}
                                            onChange={(e) => handleLineChange(index, 'descripcion', e.target.value)}
                                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                            {t('quantity') || 'Qty'}
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0.01"
                                            step="0.01"
                                            value={linea.cantidad}
                                            onChange={(e) => handleLineChange(index, 'cantidad', e.target.value)}
                                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                            {t('unit_price') || 'Price'}
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={linea.precio_unitario}
                                            onChange={(e) => handleLineChange(index, 'precio_unitario', e.target.value)}
                                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                            {t('tax') || 'Tax'}
                                        </label>
                                        <select
                                            value={linea.id_impuesto}
                                            onChange={(e) => handleLineChange(index, 'id_impuesto', e.target.value)}
                                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                                        >
                                            <option value="">-</option>
                                            {impuestos.map(i => (
                                                <option key={i.id_impuesto} value={i.id_impuesto}>{i.codigo}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                            {t('total') || 'Total'}
                                        </label>
                                        <div style={{ padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '600' }}>
                                            €{linea.total_linea}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeLine(index)}
                                        disabled={lineas.length === 1}
                                        style={{
                                            padding: '0.5rem',
                                            backgroundColor: lineas.length === 1 ? '#e5e7eb' : '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.375rem',
                                            cursor: lineas.length === 1 ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Totals */}
                        <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '1rem', marginTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <span style={{ color: '#6b7280', marginRight: '1rem' }}>{t('subtotal') || 'Subtotal'}:</span>
                                        <span style={{ fontWeight: '600' }}>€{totals.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <span style={{ color: '#6b7280', marginRight: '1rem' }}>{t('taxes') || 'Taxes'}:</span>
                                        <span style={{ fontWeight: '600' }}>€{totals.impuestos.toFixed(2)}</span>
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>
                                        <span style={{ marginRight: '1rem' }}>{t('total') || 'Total'}:</span>
                                        <span>€{totals.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
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
                            {t('cancel') || 'Cancel'}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: loading ? '#6b7280' : '#111827',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? (t('saving') || 'Saving...') : (isEdit ? (t('update') || 'Update') : (t('create') || 'Create'))}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InvoiceForm;
