
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) throw error;

            setMessage({
                type: 'success',
                text: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
            });
            // Optional: clear email
            setEmail('');
        } catch (error: any) {
            console.error('Error reset password:', error);
            setMessage({
                type: 'error',
                text: error.message || 'Hubo un error al intentar enviar el correo.',
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
                        <h2 className="text-3xl font-bold tracking-tight">Recuperar Contraseña</h2>
                        <p className="mt-2 text-sm text-text-secondary">
                            Ingresa tu correo electrónico y te enviaremos un enlace para restablecerla.
                        </p>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                            {message.text}
                        </div>
                    )}

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
                                Correo Electrónico
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-lg border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark pl-4 pr-10 py-3 focus:border-primary focus:ring-primary sm:text-sm text-slate-900 dark:text-white"
                                    placeholder="ejemplo@correo.com"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative flex w-full justify-center rounded-lg bg-primary py-3 px-4 text-sm font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 transition-all"
                            >
                                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                            </button>
                        </div>

                        <div className="text-sm text-center">
                            <Link to="/login" className="font-medium text-primary hover:text-blue-500">
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
