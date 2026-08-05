import React, { useState } from 'react';

import { Icon } from '../../components/Icon';
const N8N_WEBHOOK_URL = 'https://api-bluevelvet.cloud/webhook/manual-order';

interface FormState {
    phone: string;
    name: string;
    amount: string;
    product: string;
}

interface LogEntry {
    id: number;
    timestamp: string;
    phone: string;
    amount: string;
    status: 'success' | 'error';
    message: string;
}

export default function MetaEventsPage() {
    const [form, setForm] = useState<FormState>({ phone: '', name: '', amount: '', product: '' });
    const [loading, setLoading] = useState(false);
    const [log, setLog] = useState<LogEntry[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.phone || !form.amount) return;

        setLoading(true);
        const entryId = Date.now();

        try {
            // Normalize MX phone: add 52 country code if missing
            let phone = form.phone.replace(/\D/g, '');
            if (phone.length === 10) phone = '52' + phone;          // 6141234567 → 526141234567
            if (phone.startsWith('1') && phone.length === 11) phone = '52' + phone.slice(1);

            const payload = {
                status: 'confirmed',
                id: `manual-${entryId}`,
                customer_id: `manual-${entryId}`,
                total_amount: parseFloat(form.amount),
                phone_number: phone,
                name: form.name || '',
            };

            const res = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const newEntry: LogEntry = {
                id: entryId,
                timestamp: new Date().toLocaleTimeString('es-MX'),
                phone: form.phone,
                amount: `$${parseFloat(form.amount).toLocaleString('es-MX')}`,
                status: res.ok ? 'success' : 'error',
                message: res.ok ? 'Evento enviado a Meta ✅' : `Error HTTP ${res.status}`,
            };

            setLog(prev => [newEntry, ...prev]);

            if (res.ok) {
                setForm({ phone: '', name: '', amount: '', product: '' });
            }
        } catch (err: any) {
            setLog(prev => [{
                id: entryId,
                timestamp: new Date().toLocaleTimeString('es-MX'),
                phone: form.phone,
                amount: `$${form.amount}`,
                status: 'error',
                message: `Error de red: ${err.message}`,
            }, ...prev]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Enviar Evento a Meta</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Registra compras de clientes atendidos por WhatsApp personal para optimizar tus campañas de Meta ADS.
                </p>
            </div>

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                        <Icon name="campaign" size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-800 dark:text-white">Datos del pedido</h2>
                        <p className="text-xs text-slate-400">El número y monto son obligatorios</p>
                    </div>
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Número de teléfono <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Icon name="phone" size={18} />
                        </span>
                        <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            required
                            placeholder="6141234567 o 526141234567"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Puedes poner 10 dígitos locales, el código de país se agrega automáticamente.</p>
                </div>

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Nombre del cliente <span className="text-slate-400 font-normal">(opcional)</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Icon name="person" size={18} />
                        </span>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Nombre completo"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Monto del pedido (MXN) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">$</span>
                        <input
                            type="number"
                            name="amount"
                            value={form.amount}
                            onChange={handleChange}
                            required
                            min="1"
                            step="0.01"
                            placeholder="850.00"
                            className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading || !form.phone || !form.amount}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Enviando...
                        </>
                    ) : (
                        <>
                            <Icon name="send" size={20} />
                            Enviar evento a Meta ADS
                        </>
                    )}
                </button>
            </form>

            {/* Log */}
            {log.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-semibold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                        <Icon name="history" size={18} />
                        Historial de esta sesión
                    </h3>
                    <div className="space-y-2">
                        {log.map(entry => (
                            <div
                                key={entry.id}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm ${
                                    entry.status === 'success'
                                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={entry.status === 'success' ? 'text-green-600' : 'text-red-500'}>
                                        {entry.status === 'success' ? '✅' : '❌'}
                                    </span>
                                    <div>
                                        <p className="font-medium text-slate-700 dark:text-slate-200">{entry.phone} — {entry.amount}</p>
                                        <p className="text-xs text-slate-400">{entry.message}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400 whitespace-nowrap ml-4">{entry.timestamp}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
