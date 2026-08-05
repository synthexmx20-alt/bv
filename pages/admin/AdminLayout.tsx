import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
    const { user, isAdmin, loading, signOut } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500">Cargando panel...</div>;
    }

    // If not logged in or not admin, redirect to admin login
    if (!user || !isAdmin) {
        return <Navigate to="/admin/login" replace />;
    }

    const navLinks = [
        { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' }, // New Dashboard Link
        { path: '/admin/orders', label: 'Pedidos', icon: 'orders' },
        { path: '/admin/users', label: 'Usuarios', icon: 'group' },

        { path: '/admin/products', label: 'Productos', icon: 'inventory_2' },
        { path: '/admin/categories', label: 'Categorías', icon: 'category' },
        { path: '/admin/addons', label: 'Complementos', icon: 'extension' },
        { path: '/admin/occasions', label: 'Ocasiones', icon: 'event' },
        { path: '/admin/coupons', label: 'Cupones', icon: 'local_offer' },
        { path: '/admin/shipping', label: 'Envíos / CP', icon: 'local_shipping' }, // New Shipping Rules Link
        { path: '/admin/chat', label: 'Live Chat (N8N)', icon: 'chat' },
        { path: '/admin/meta-events', label: 'Meta ADS Manual', icon: 'campaign' },

        { path: '/admin/settings', label: 'Configuración', icon: 'settings' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white fixed h-full z-10 flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-serif font-bold tracking-wide">Blue Velvet</h1>
                    <p className="text-xs text-slate-400 mt-1">Admin Panel</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navLinks.map((link) => (
                        <a
                            key={link.path}
                            href={`#${link.path}`}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                            <span className="font-medium text-sm">{link.label}</span>
                        </a>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-slate-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        <span className="font-medium text-sm">Cerrar Sesión</span>
                    </button>
                    <div className="px-4 py-2 mt-2">
                        <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
