import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';

import { Icon } from '../../components/Icon';
import type { IconName } from '../../components/Icon';
const ProfileLayout = () => {
    const { signOut } = useAuth();

    const navItems: { path: string; label: string; icon: IconName }[] = [
        { path: '/account/profile', label: 'Mi Perfil', icon: 'person' },
        { path: '/account/addresses', label: 'Direcciones', icon: 'location_on' },
        { path: '/account/orders', label: 'Mis Pedidos', icon: 'shopping_bag' },
    ];

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white">
            <Header />
            <div className="py-12 px-4">

                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Sidebar Navigation */}
                    <div className="md:col-span-1">
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-4 sticky top-24">
                            <nav className="space-y-2">
                                {navItems.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                                ? 'bg-primary text-white font-medium'
                                                : 'text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }`
                                        }
                                    >
                                        <Icon name={item.icon} size={20} />
                                        {item.label}
                                    </NavLink>
                                ))}
                                <button
                                    onClick={() => signOut()}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-4 border-t border-border-light dark:border-border-dark pt-4"
                                >
                                    <Icon name="logout" size={20} />
                                    Cerrar Sesión
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="md:col-span-3">
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6 md:p-8">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileLayout;
