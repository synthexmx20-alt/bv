import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { Icon } from './Icon';
const CheckoutHeader = () => {
    const { session, signOut } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-border-dark px-6 lg:px-10 py-4 bg-background-dark sticky top-0 z-50">
            <Link to="/" className="flex items-center gap-4 text-white">
                <img
                    src="/logo_principal_comprimido.webp"
                    alt="Blue Velvet"
                    className="h-10 w-auto object-contain brightness-0 invert"
                />
            </Link>
            <div className="flex items-center gap-4">
                <span className="hidden md:flex items-center gap-2 text-[#9da1b9] text-xs font-medium uppercase tracking-wider">
                    <Icon name="lock" size={18} className="text-green-500" />
                    Pago Seguro SSL
                </span>

                {/* Auth Dropdown */}
                {session ? (
                    <div className="relative z-50" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="bg-center bg-no-repeat bg-cover rounded-full size-10 border border-[#282b39] cursor-pointer hover:border-primary transition-colors"
                            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDs9jXdeHkPGE9Q7ClueWuom_JXdL009wBSvnHEuRLMwQdEyoq43qY1Y7M94_WN1j-yhtKhUw13exFA5sMTXCv5X-jIV-WjGrfPJVQ05EXpqZbbJ05ehuo9h9IUz0ooPKhRXiG3FjfEdG3EvjcVeCOnOAXJ2_MJqudDZsWfAZhqAE1DixKUcbq07nsYI7ftCKkGwIr-dIqfIH5PKU5XpDvoD3Dq1rSb1un5TP3oGOXlyGLHQsYACl5PX_bDRgEHg-ZyWdaWOupfKhM")' }}
                        ></button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-surface-dark border border-[#282b39] rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <button
                                    onClick={() => {
                                        signOut();
                                        setIsDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-background-dark transition-colors"
                                >
                                    <Icon name="logout" size={24} />
                                    <span className="text-sm font-medium">Cerrar Sesión</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Link to="/login" className="px-4 py-2 text-sm font-bold text-white bg-[#282b39] hover:bg-[#3a3d4d] rounded-lg transition-colors">
                            Iniciar Sesión
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
};

export default CheckoutHeader;