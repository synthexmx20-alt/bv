import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const NotFoundPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-md w-full flex flex-col items-center gap-6">
                    {/* Icon / Image Placeholder */}
                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                        <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">
                            local_florist
                        </span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-serif font-bold text-slate-200 dark:text-slate-800 tracking-tighter">
                        404
                    </h1>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-white">
                            Esta flor no está en nuestro jardín
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            Lo sentimos, la página que buscas no existe o ha sido movida.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
                        <Link
                            to="/"
                            className="flex-1 px-6 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Ir al Inicio
                        </Link>
                        <Link
                            to="/catalog"
                            className="flex-1 px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-600 transition-colors shadow-lg shadow-primary/20"
                        >
                            Ver Catálogo
                        </Link>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default NotFoundPage;
