
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Check if we have a session (Supabase handles the magic link exchange automatically)
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                setMessage({ type: 'error', text: 'Enlace inválido o expirado. Por favor solicita uno nuevo.' });
            }
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
            return;
        }

        if (password.length < 6) {
            setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' });

            // Redirect after short delay
            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (error: any) {
            console.error('Error updating password:', error);
            setMessage({
                type: 'error',
                text: error.message || 'Error al actualizar la contraseña.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white flex flex-col">
            <Header />

            <div className="flex-grow flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md space-y-8 bg-surface-light dark:bg-surface-dark p-8 rounded-xl shadow-lg border border-border-light dark:border-border-dark">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight">Nueva Contraseña</h2>
                        <p className="mt-2 text-sm text-text-secondary">
                            Ingresa tu nueva contraseña a continuación.
                        </p>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                            {message.text}
                        </div>
                    )}

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
                                    Nueva Contraseña
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full rounded-lg border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark pl-4 pr-10 py-3 focus:border-primary focus:ring-primary sm:text-sm text-slate-900 dark:text-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary">
                                    Confirmar Contraseña
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="block w-full rounded-lg border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark pl-4 pr-10 py-3 focus:border-primary focus:ring-primary sm:text-sm text-slate-900 dark:text-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative flex w-full justify-center rounded-lg bg-primary py-3 px-4 text-sm font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 transition-all"
                            >
                                {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
