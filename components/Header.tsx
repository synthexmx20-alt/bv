import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckoutContext } from '../context/CheckoutContext';
import CartDrawer from './CartDrawer';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const { checkoutData } = useContext(CheckoutContext);

    const userMenuRef = useRef<HTMLDivElement>(null);
    const cartItemCount = checkoutData.items?.length || 0;

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };

        const handleOpenCart = () => setIsCartOpen(true);
        window.addEventListener('open-cart-drawer', handleOpenCart);

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('open-cart-drawer', handleOpenCart);
        };
    }, []);

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            navigate(`/catalog?q=${encodeURIComponent(searchTerm)}`);
            setIsMenuOpen(false);
        }
    };

    const handleSignOut = () => {
        signOut();
        setIsUserMenuOpen(false);
        navigate('/');
    };

    return (
        <>
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e5e7eb] dark:border-[#282b39] bg-background-light dark:bg-[#101322] px-6 lg:px-10 py-3 sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-4 text-[#111418] dark:text-white">
                        <img
                            src="/logo_principal_comprimido.webp"
                            alt="Blue Velvet Florería"
                            className="h-12 w-auto object-contain dark:brightness-0 dark:invert"
                        />
                    </Link>
                    <nav className="hidden lg:flex items-center gap-9">
                        <Link className="text-[#111418] dark:text-white text-sm font-medium leading-normal hover:text-primary transition-colors" to="/catalog">Catálogo</Link>
                        <Link className="text-gray-500 dark:text-[#9da1b9] text-sm font-medium leading-normal hover:text-primary transition-colors" to="/about">Nosotros</Link>
                        <Link className="text-gray-500 dark:text-[#9da1b9] text-sm font-medium leading-normal hover:text-primary transition-colors" to="/contact">Contacto</Link>
                    </nav>
                </div>
                <div className="flex flex-1 justify-end gap-4 lg:gap-8">
                    <label className="hidden md:flex flex-col min-w-40 !h-10 max-w-64">
                        <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                            <div className="text-[#637588] dark:text-[#9da1b9] flex border-none bg-[#f0f2f4] dark:bg-[#282b39] items-center justify-center pl-4 rounded-l-lg border-r-0">
                                <span className="material-symbols-outlined text-[24px]">search</span>
                            </div>
                            <input
                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-0 border-none bg-[#f0f2f4] dark:bg-[#282b39] focus:border-none h-full placeholder:text-[#637588] dark:placeholder:text-[#9da1b9] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                        </div>
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#f0f2f4] dark:bg-[#282b39] text-[#111418] dark:text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5 hover:bg-[#e5e7eb] dark:hover:bg-[#3e4255] transition-colors relative group"
                        >
                            <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                            {cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold size-5 flex items-center justify-center rounded-full border-2 border-white dark:border-[#101322]">
                                    {cartItemCount}
                                </span>
                            )}
                        </button>

                        {/* User Menu Dropdown */}
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#f0f2f4] dark:bg-[#282b39] text-[#111418] dark:text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5 hover:bg-[#e5e7eb] dark:hover:bg-[#3e4255] transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">account_circle</span>
                            </button>

                            {isUserMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-100 dark:border-slate-700 py-1 z-50 animate-fadeIn">
                                    {user ? (
                                        <>
                                            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Hola,</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.email}</p>
                                            </div>
                                            <Link
                                                to="/account/profile"
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">person</span>
                                                Mi Perfil
                                            </Link>
                                            <Link
                                                to="/account/addresses"
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">location_on</span>
                                                Mis Direcciones
                                            </Link>
                                            <Link
                                                to="/account/orders"
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">history</span>
                                                Mis Pedidos
                                            </Link>
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full text-left max-w-full cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">logout</span>
                                                Cerrar Sesión
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Link
                                                to="/login"
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">login</span>
                                                Iniciar Sesión
                                            </Link>
                                            <Link
                                                to="/register"
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">person_add</span>
                                                Registrarse
                                            </Link>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#f0f2f4] dark:bg-[#282b39] text-[#111418] dark:text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5 hover:bg-[#e5e7eb] dark:hover:bg-[#3e4255] transition-colors">
                            <span className="material-symbols-outlined text-[20px]">menu</span>
                        </button>
                    </div>
                </div>
                {isMenuOpen && (
                    <div className="absolute top-full left-0 w-full bg-[#101322] border-b border-[#282b39] p-4 flex flex-col gap-4 lg:hidden shadow-xl animate-fadeIn">
                        <input
                            className="w-full h-10 rounded-lg bg-[#282b39] border-none text-white px-4 placeholder:text-gray-500 mb-2"
                            placeholder="Buscar flores..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                        <Link className="text-white hover:text-primary" to="/catalog" onClick={() => setIsMenuOpen(false)}>Catálogo</Link>
                        <Link className="text-gray-400 hover:text-primary" to="/about" onClick={() => setIsMenuOpen(false)}>Nosotros</Link>
                        <Link className="text-gray-400 hover:text-primary" to="/contact" onClick={() => setIsMenuOpen(false)}>Contacto</Link>
                    </div>
                )}
            </header>
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
};

export default Header;