import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const ProfilePage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        id: ''
    });

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single();

            if (error) {
                // Check if it's "row not found" which is tolerable for new users
                if (error.code !== 'PGRST116') throw error;
            }

            if (data) {
                setFormData({
                    full_name: data.full_name || '',
                    phone: data.phone || '',
                    id: data.id
                });
            }
        } catch (error: any) {
            console.error('Error fetching profile:', error);
            setMessage({ type: 'error', text: 'Error al cargar perfil' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const updates = {
                id: user?.id,
                full_name: formData.full_name,
                phone: formData.phone,
                updated_at: new Date(),
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
        } catch (error: any) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: 'Error al actualizar perfil' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Cargando...</div>;

    return (
        <div>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border-light dark:border-border-dark">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl">person</span>
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Mi Perfil</h1>
                    <p className="text-text-secondary">Actualiza tu información personal</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="max-w-md space-y-6">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Correo Electrónico</label>
                    <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-text-secondary cursor-not-allowed"
                    />
                    <p className="text-xs text-text-secondary mt-1">El correo no se puede cambiar.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                    <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        placeholder="Tu nombre completo"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Teléfono</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        placeholder="Tu número de teléfono"
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                Guardando...
                            </>
                        ) : (
                            'Guardar Cambios'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfilePage;
