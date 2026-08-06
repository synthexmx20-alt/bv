
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Occasion } from '../../types';

import { Icon } from '../../components/Icon';
const AdminOccasionsPage = () => {
    const [occasions, setOccasions] = useState<Occasion[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItemName, setNewItemName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchOccasions();
    }, []);

    const fetchOccasions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('occasions').select('*').order('name');
            if (error) throw error;
            setOccasions(data || []);
        } catch (error) {
            console.error('Error fetching occasions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        setSubmitting(true);
        try {
            const { error } = await supabase.from('occasions').insert([{ name: newItemName.trim() }]);
            if (error) throw error;
            setNewItemName('');
            await fetchOccasions();
        } catch (error: any) {
            alert('Error al crear ocasión: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`¿Seguro que quieres eliminar la ocasión "${name}"?`)) return;

        try {
            const { error } = await supabase.from('occasions').delete().eq('id', id);
            if (error) throw error;
            await fetchOccasions();
        } catch (error: any) {
            alert('Error al eliminar: ' + error.message);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-serif text-slate-800 dark:text-white">Ocasiones</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gestiona las ocasiones disponibles para los productos.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* List */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300">
                        Lista de Ocasiones
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Cargando...</div>
                    ) : occasions.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No hay ocasiones creadas.</div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                            {occasions.map((item) => (
                                <li key={item.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <span className="text-slate-900 dark:text-white font-medium">{item.name}</span>
                                    <button
                                        onClick={() => handleDelete(item.id, item.name)}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                        title="Eliminar"
                                    >
                                        <Icon name="delete" size={20} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Create Form */}
                <div className="h-fit bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Agregar Nueva Ocasión</h3>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                                placeholder="Ej. Graduación"
                                value={newItemName}
                                onChange={e => setNewItemName(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting || !newItemName.trim()}
                            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {submitting ? 'Guardando...' : 'Crear Ocasión'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminOccasionsPage;
