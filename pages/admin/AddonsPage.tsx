import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ProductAddon } from '../../types';

import { Icon } from '../../components/Icon';
const AdminAddonsPage = () => {
    const [addons, setAddons] = useState<ProductAddon[]>([]);
    const [loading, setLoading] = useState(true);
    const [newAddon, setNewAddon] = useState({ name: '', price: '', type: 'mariposa' });
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchAddons();
    }, []);

    const fetchAddons = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('addons')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching addons:', error);
            setError('Error al cargar complementos. Asegúrate de haber corrido la migración.');
        } else {
            setAddons(data || []);
        }
        setLoading(false);
    };

    const handleAddAddon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAddon.name.trim() || !newAddon.price) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const { error } = await supabase
                .from('addons')
                .insert([{
                    name: newAddon.name.trim(),
                    price: parseFloat(newAddon.price),
                    type: newAddon.type,
                    active: true
                }]);

            if (error) throw error;

            setNewAddon({ name: '', price: '', type: 'mariposa' });
            await fetchAddons();
        } catch (err: any) {
            console.error('Error adding addon:', err);
            setError(err.message || 'Error al agregar complemento');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAddon = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este complemento?')) return;

        try {
            const { error } = await supabase
                .from('addons')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await fetchAddons();
        } catch (err: any) {
            console.error('Error deleting addon:', err);
            setError(err.message || 'Error al eliminar complemento');
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('addons')
                .update({ active: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            await fetchAddons();
        } catch (err: any) {
            console.error('Error updating status:', err);
            setError(err.message);
        }
    }

    if (loading) return <div className="p-8 text-center">Cargando complementos...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-serif dark:text-white mb-6">Gestión de Complementos</h2>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {/* Add Addon Form */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-8 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Agregar Nuevo Complemento</h3>
                <form onSubmit={handleAddAddon} className="flex gap-4 items-end flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                        <input
                            type="text"
                            value={newAddon.name}
                            onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
                            placeholder="Ej. Mariposa Dorada"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="w-[120px]">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Precio ($)</label>
                        <input
                            type="number"
                            value={newAddon.price}
                            onChange={(e) => setNewAddon({ ...newAddon, price: e.target.value })}
                            placeholder="0.00"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="w-[150px]">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                        <select
                            value={newAddon.type}
                            onChange={(e) => setNewAddon({ ...newAddon, type: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                            disabled={isSubmitting}
                        >
                            <option value="mariposa">Mariposa</option>
                            <option value="corona">Corona</option>
                            <option value="banda">Banda</option>
                            <option value="extra">Extra</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting || !newAddon.name.trim() || !newAddon.price}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 h-[42px]"
                    >
                        {isSubmitting ? '...' : 'Agregar'}
                        {!isSubmitting && <Icon name="add" size={14} />}
                    </button>
                </form>
            </div>

            {/* Addons List */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Nombre</th>
                                <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Tipo</th>
                                <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Precio</th>
                                <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400 text-center">Activo</th>
                                <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {addons.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        No hay complementos registrados.
                                    </td>
                                </tr>
                            ) : (
                                addons.map((addon: any) => (
                                    <tr key={addon.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                            {addon.name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-gray-400 capitalize">
                                            {addon.type}
                                        </td>
                                        <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">
                                            ${addon.price}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleToggleActive(addon.id, addon.active)}
                                                className={`px-2 py-1 rounded text-xs font-bold ${addon.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                                            >
                                                {addon.active ? 'Activo' : 'Inactivo'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDeleteAddon(addon.id)}
                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-slate-400 hover:text-red-600 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Icon name="delete" size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminAddonsPage;
