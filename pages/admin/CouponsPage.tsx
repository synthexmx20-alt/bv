import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Coupon {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    value: number;
    expiration_date?: string;
    usage_limit?: number;
    usage_count: number;
    active: boolean;
}

const AdminCouponsPage = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage',
        value: 0,
        expiration_date: '',
        usage_limit: 0,
        active: true
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching coupons:", error);
        } else {
            setCoupons(data || []);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este cupón?')) return;

        const { error } = await supabase.from('coupons').delete().eq('id', id);
        if (error) {
            alert('Error eliminando cupón');
        } else {
            fetchCoupons();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            code: formData.code.toUpperCase(),
            discount_type: formData.discount_type,
            value: formData.value,
            // Only send expiry if set
            expiration_date: formData.expiration_date ? new Date(formData.expiration_date).toISOString() : null,
            // Only send limit if > 0
            usage_limit: formData.usage_limit > 0 ? formData.usage_limit : null,
            active: formData.active
        };

        const { error } = await supabase.from('coupons').insert(payload);

        if (error) {
            alert('Error creando cupón: ' + error.message);
        } else {
            setShowModal(false);
            setFormData({
                code: '',
                discount_type: 'percentage',
                value: 0,
                expiration_date: '',
                usage_limit: 0,
                active: true
            });
            fetchCoupons();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Cupones de Descuento</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
                >
                    <span className="material-symbols-outlined">add</span>
                    Crear Cupón
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Código</th>
                                <th className="p-4 font-semibold">Descuento</th>
                                <th className="p-4 font-semibold">Usos</th>
                                <th className="p-4 font-semibold">Expiración</th>
                                <th className="p-4 font-semibold">Estado</th>
                                <th className="p-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Cargando...</td></tr>
                            ) : coupons.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No hay cupones activos.</td></tr>
                            ) : (
                                coupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4 font-mono font-bold text-primary">{coupon.code}</td>
                                        <td className="p-4 text-slate-700 dark:text-slate-300">
                                            {coupon.discount_type === 'percentage' ? `${coupon.value}%` : `$${coupon.value} MXN`}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400">
                                            {coupon.usage_count} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : ''}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400">
                                            {coupon.expiration_date ? new Date(coupon.expiration_date).toLocaleDateString() : 'Sin exp.'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${coupon.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
                                                {coupon.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDelete(coupon.id)}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Create */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Nuevo Cupón</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Código</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 p-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white uppercase"
                                    placeholder="EJ: VERANO10"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                                    <select
                                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 p-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        value={formData.discount_type}
                                        onChange={e => setFormData({ ...formData, discount_type: e.target.value as any })}
                                    >
                                        <option value="percentage">Porcentaje (%)</option>
                                        <option value="fixed">Monto Fijo ($)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 p-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Límite de Usos</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 p-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        placeholder="Ilimitado"
                                        value={formData.usage_limit || ''}
                                        onChange={e => setFormData({ ...formData, usage_limit: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expiración</label>
                                    <input
                                        type="date"
                                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 p-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        value={formData.expiration_date}
                                        onChange={e => setFormData({ ...formData, expiration_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Guardar Cupón
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCouponsPage;
