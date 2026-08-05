import React from 'react';
import { Link } from 'react-router-dom';

import { Icon } from './Icon';
const Footer = () => (
    <footer className="bg-white dark:bg-[#101322] border-t border-gray-200 dark:border-[#282b39] pt-16 pb-8">
        <div className="max-w-[1200px] mx-auto px-10">
            <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
                <div className="flex flex-col gap-4 max-w-sm">
                    <div className="flex items-center gap-2 text-primary">
                        <Icon name="local_florist" size={24} />
                        <h3 className="text-[#111418] dark:text-white text-xl font-bold">Blue Velvet</h3>
                    </div>
                    <p className="text-gray-500 dark:text-[#9da1b9] text-sm">Transformando el lenguaje de las flores desde el corazón de Chihuahua con una visión global de elegancia y sostenibilidad.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16">
                    <div className="flex flex-col gap-4">
                        <h4 className="text-[#111418] dark:text-white font-bold">Tienda</h4>
                        <Link className="text-gray-500 dark:text-[#9da1b9] text-sm hover:text-primary" to="/catalog">Catálogo Completo</Link>
                        <Link className="text-gray-500 dark:text-[#9da1b9] text-sm hover:text-primary" to="/catalog">Sostenibilidad</Link>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h4 className="text-[#111418] dark:text-white font-bold">Ayuda</h4>
                        <Link className="text-gray-500 dark:text-[#9da1b9] text-sm hover:text-primary" to="/about">Nosotros</Link>
                        <Link className="text-gray-500 dark:text-[#9da1b9] text-sm hover:text-primary" to="/contact">Contacto</Link>
                        <Link className="text-gray-500 dark:text-[#9da1b9] text-sm hover:text-primary" to="/privacy-policy">Aviso de Privacidad</Link>
                        <Link className="text-gray-500 dark:text-[#9da1b9] text-sm hover:text-primary" to="/terms">Términos y Condiciones</Link>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h4 className="text-[#111418] dark:text-white font-bold">Ubicación</h4>
                        <span className="text-gray-400">Chihuahua, Chihuahua, México</span>
                    </div>
                </div>
            </div>
            <div className="border-t border-gray-200 dark:border-[#282b39] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Blue Velvet Florería. Todos los derechos reservados.</p>
                <div className="flex gap-6"></div>
            </div>
        </div>
    </footer>
);

export default Footer;