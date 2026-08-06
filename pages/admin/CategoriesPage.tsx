import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Category } from '../../types';

import { Icon } from '../../components/Icon';
const AdminCategoriesPage = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCategory, setNewCategory] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching categories:', error);
            setError('Error al cargar categorías');
        } else {
            setCategories(data || []);
        }
        setLoading(false);
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const { error } = await supabase
                .from('categories')
                .insert([{ name: newCategory.trim() }]);

            if (error) throw error;

            setNewCategory('');
            await fetchCategories();
        } catch (err: any) {
            console.error('Error adding category:', err);
            setError(err.message || 'Error al agregar categoría');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return;

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await fetchCategories();
        } catch (err: any) {
            console.error('Error deleting category:', err);
            setError(err.message || 'Error al eliminar categoría');
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando categorías...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-serif dark:text-white mb-6">Gestión de Categorías</h2>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {/* Add Category Form */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-8 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Agregar Nueva Categoría</h3>
                <form onSubmit={handleAddCategory} className="flex gap-4">
                    <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Nombre de la categoría"
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        disabled={isSubmitting}
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting || !newCategory.trim()}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                    >
                        {isSubmitting ? 'Guardando...' : 'Agregar'}
                        {!isSubmitting && <Icon name="add" size={14} />}
                    </button>
                </form>
            </div>

            {/* Categories List */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Nombre</th>
                                <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400 w-32 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {categories.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        No hay categorías registradas.
                                    </td>
                                </tr>
                            ) : (
                                categories.map((category) => (
                                    <tr key={category.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                            {category.name}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDeleteCategory(category.id)}
                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-slate-400 hover:text-red-600 transition-colors"
                                                title="Eliminar categoría"
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

export default AdminCategoriesPage;
