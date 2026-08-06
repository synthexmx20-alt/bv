import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

import { Icon } from '../../components/Icon';
interface ShippingZone {
    id: string;
    zip_code: string;
    colony: string;
    status: 'standard' | 'surcharge' | 'blocked';
    surcharge: number;
    created_at: string;
}

const AdminShippingRulesPage = () => {
    const [zones, setZones] = useState<ShippingZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [showModal, setShowModal] = useState(false);
    const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
    const [formData, setFormData] = useState({
        zip_code: '',
        colony: '',
        status: 'standard',
        surcharge: 0
    });

    useEffect(() => {
        fetchZones();
    }, []);

    const fetchZones = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('shipping_zones')
                .select('*')
                .order('zip_code', { ascending: true });

            if (error) throw error;
            setZones(data || []);
        } catch (err: any) {
            console.error('Error fetching zones:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (zone?: ShippingZone) => {
        if (zone) {
            setEditingZone(zone);
            setFormData({
                zip_code: zone.zip_code,
                colony: zone.colony,
                status: zone.status as any,
                surcharge: zone.surcharge
            });
        } else {
            setEditingZone(null);
            setFormData({ zip_code: '', colony: '', status: 'standard', surcharge: 0 });
        }
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingZone) {
                const { error } = await supabase
                    .from('shipping_zones')
                    .update(formData)
                    .eq('id', editingZone.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('shipping_zones')
                    .insert([formData]);
                if (error) throw error;
            }
            setShowModal(false);
            fetchZones();
        } catch (err: any) {
            alert('Error guardando: ' + err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar esta zona?')) return;
        try {
            const { error } = await supabase.from('shipping_zones').delete().eq('id', id);
            if (error) throw error;
            fetchZones();
        } catch (err: any) {
            alert('Error eliminando: ' + err.message);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif dark:text-white">Reglas de Envío (CP y Colonias)</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                >
                    <Icon name="add" size={24} />
                    Nueva Zona
                </button>
            </div>

            {loading ? (
                <div>Cargando reglas...</div>
            ) : error ? (
                <div className="text-red-500">Error: {error}</div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Código Postal</th>
                                <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Colonia</th>
                                <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Estado</th>
                                <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Costo Extra</th>
                                <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {zones.map((zone) => (
                                <tr key={zone.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">{zone.zip_code}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{zone.colony}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${zone.status === 'blocked' ? 'bg-red-100 text-red-700' :
                                                zone.status === 'surcharge' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-green-100 text-green-700'
                                            }`}>
                                            {zone.status === 'surcharge' ? 'Costo Extra' :
                                                zone.status === 'blocked' ? 'Bloqueado' : 'Estándar'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400">
                                        {zone.surcharge > 0 ? `+$${zone.surcharge}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <button onClick={() => handleOpenModal(zone)} className="text-blue-500 hover:text-blue-700">
                                            <Icon name="edit" size={20} />
                                        </button>
                                        <button onClick={() => handleDelete(zone.id)} className="text-red-500 hover:text-red-700">
                                            <Icon name="delete" size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {zones.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        No hay reglas configuradas. Todas las colonias pasan como estándar si el CP es válido.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4 dark:text-white">
                            {editingZone ? 'Editar Zona' : 'Nueva Zona'}
                        </h3>
                        <form onSubmit={handleSave} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">Código Postal</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full h-10 px-3 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                    value={formData.zip_code}
                                    onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
                                    maxLength={5}
                                    placeholder="Ej. 31000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">Colonia</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full h-10 px-3 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                    value={formData.colony}
                                    onChange={e => setFormData({ ...formData, colony: e.target.value })}
                                    placeholder="Ej. Centro"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-1">Estatus</label>
                                    <select
                                        className="w-full h-10 px-3 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="standard">Estándar (Gratis)</option>
                                        <option value="surcharge">Costo Extra</option>
                                        <option value="blocked">Bloqueado</option>
                                    </select>
                                </div>
                                {formData.status === 'surcharge' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Monto Extra ($)</label>
                                        <input
                                            type="number"
                                            className="w-full h-10 px-3 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                            value={formData.surcharge}
                                            onChange={e => setFormData({ ...formData, surcharge: Number(e.target.value) })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded bg-primary text-white font-bold hover:bg-blue-700 transition-colors"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminShippingRulesPage;
