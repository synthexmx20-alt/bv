import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import { Product, ProductSize } from '../types';
import ProductCard from '../components/ProductCard';
import { CheckoutContext } from '../context/CheckoutContext';
import SEO from '../components/SEO';

import { Icon } from '../components/Icon';
const ProductDetailsPage = () => {
    const navigate = useNavigate();
    const { addToCart } = React.useContext(CheckoutContext);
    const { id } = useParams();

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
    const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
    const [addons, setAddons] = useState<any[]>([]);

    useEffect(() => {
        const fetchAddons = async () => {
            const { data } = await supabase
                .from('addons')
                .select('*')
                .eq('active', true)
                .order('price');
            if (data) setAddons(data);
        };
        fetchAddons();
    }, []);



    const handleAddonToggle = (addon: any) => {
        setSelectedAddons(prev => {
            const exists = prev.find(a => a.id === addon.id);
            if (exists) {
                // If clicking same addon, remove it
                return prev.filter(a => a.id !== addon.id);
            } else {
                // If it's a type that requires exclusivity (mariposa/corona), remove others of same type
                const others = prev.filter(a => a.type !== addon.type);
                if (addon.type === 'banda') {
                    // Banda is independent, but if we treat exclusivity it's fine. 
                    // Actually maybe allow both butterfly and crown? 
                    // User didn't specify exclusivity between types, just within types logically (1 vs 3 butterflies).
                    // Let's assume exclusivty within 'mariposa' group and 'corona' group.
                    return [...prev, addon];
                }

                // For radio-like behavior groups:
                const sameType = prev.find(a => a.type === addon.type);
                if (sameType) {
                    return [...prev.filter(a => a.type !== addon.type), addon];
                }
                return [...prev, addon];
            }
        });
    };

    useEffect(() => {
        if (id) {
            fetchProduct();
        }
    }, [id]);

    const fetchProduct = async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error("Error fetching product:", error);
        } else if (data) {
            const p = data as Product;
            setProduct(p);

            // Initialize size
            const initialSize = p.sizes?.find(s => s.name === 'Standard') ||
                p.sizes?.[0] ||
                { name: 'Standard', price: p.price, description: p.description };
            setSelectedSize(initialSize);

            // Fetch related products (same category, excluding current)
            if (p.category) {
                const { data: relatedData, error: relatedError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('category', p.category)
                    .neq('id', p.id)
                    .limit(4);

                if (relatedError) {
                    // console.error("Error fetching related products:", relatedError);
                }

                if (relatedData) {
                    setRelatedProducts(relatedData as Product[]);
                }
            }
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <div className="flex-1 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!product || !selectedSize) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <div className="flex-1 flex flex-col justify-center items-center gap-4">
                    <h2 className="text-2xl font-bold dark:text-white">Producto no encontrado</h2>
                    <Link to="/catalog" className="text-primary hover:underline">Volver al catálogo</Link>
                </div>
            </div>
        );
    }

    const currentPrice = (selectedSize.price || 0) + selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const currentDescription = selectedSize.description || product.description;

    return (
        <div className="flex flex-col min-h-screen">
            <SEO
                title={product.meta_title || product.name}
                description={product.meta_description || product.description}
                image={product.image}
                type="product"
            />
            <Header />
            <main className="layout-container flex flex-col min-h-screen">
                {/* Breadcrumbs */}
                <div className="px-6 lg:px-40 py-4">
                    <div className="flex flex-wrap gap-2 text-sm">
                        <Link className="text-gray-500 dark:text-[#9da1b9] hover:text-primary transition-colors" to="/">Inicio</Link>
                        <span className="text-gray-400 dark:text-[#5a5d72]">/</span>
                        <Link className="text-gray-500 dark:text-[#9da1b9] hover:text-primary transition-colors" to="/catalog">{product.category}</Link>
                        <span className="text-gray-400 dark:text-[#5a5d72]">/</span>
                        <span className="text-gray-900 dark:text-white font-medium">{product.name}</span>
                    </div>
                </div>
                <div className="px-6 lg:px-40 pb-20">
                    <div className="flex flex-col lg:flex-row gap-12 max-w-[1280px] mx-auto">
                        {/* Left Column: Gallery */}
                        <div className="flex-1 w-full lg:w-[60%] flex flex-col gap-10">
                            <div className="flex flex-col gap-4">
                                <div className="w-full aspect-square rounded-xl overflow-hidden bg-surface-dark relative group">
                                    <img alt={product.name} className="w-full h-full object-cover" src={product.image} />
                                </div>
                            </div>
                        </div>
                        {/* Right Column: Details */}
                        <div className="w-full lg:w-[40%] flex flex-col relative">
                            <div className="sticky top-24 flex flex-col gap-6">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{product.name}</h1>
                                    <div className="flex items-end gap-3 mb-1 mt-4">
                                        <span className="text-3xl font-bold text-primary animate-fadeIn">${currentPrice}</span>
                                        {/* Original price logic can be adjusted if we have that in DB, assuming product.originalPrice exists in type but maybe logic needs check */}
                                        {product.originalPrice && selectedSize.name === 'Standard' && (
                                            <span className="text-lg text-gray-400 line-through mb-1">${product.originalPrice}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="h-px w-full bg-gray-200 dark:bg-border-dark"></div>

                                <div className="min-h-[60px] animate-fadeIn">
                                    <p className="text-text-secondary leading-relaxed transition-all duration-300">{currentDescription}</p>
                                </div>

                                {/* Add-ons Selection */}
                                <div className="flex flex-col gap-4 animate-fadeIn">
                                    <h3 className="font-bold text-gray-900 dark:text-white">Complementos</h3>

                                    {/* Mariposas */}
                                    {addons.some(a => a.type === 'mariposa') && (
                                        <div className="flex flex-col gap-2">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Mariposas</p>
                                            <div className="flex flex-wrap gap-3">
                                                {addons.filter(a => a.type === 'mariposa').map(addon => (
                                                    <button
                                                        key={addon.id}
                                                        onClick={() => handleAddonToggle(addon)}
                                                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${selectedAddons.find(a => a.id === addon.id)
                                                            ? 'border-primary bg-primary/10 text-primary'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 text-gray-700 dark:text-gray-300'
                                                            }`}
                                                    >
                                                        {addon.name} (+${addon.price})
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Coronas */}
                                    {addons.some(a => a.type === 'corona') && (
                                        <div className="flex flex-col gap-2 mt-2">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Coronas</p>
                                            <div className="flex flex-wrap gap-3">
                                                {addons.filter(a => a.type === 'corona').map(addon => (
                                                    <button
                                                        key={addon.id}
                                                        onClick={() => handleAddonToggle(addon)}
                                                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${selectedAddons.find(a => a.id === addon.id)
                                                            ? 'border-primary bg-primary/10 text-primary'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 text-gray-700 dark:text-gray-300'
                                                            }`}
                                                    >
                                                        {addon.name} (+${addon.price})
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Extras (Bandas & Otros) */}
                                    {addons.some(a => a.type === 'banda' || a.type === 'extra') && (
                                        <div className="flex flex-col gap-2 mt-2">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Extras</p>
                                            <div className="flex flex-col gap-3">
                                                <div className="flex flex-wrap gap-3">
                                                    {addons.filter(a => a.type === 'banda' || a.type === 'extra').map(addon => (
                                                        <button
                                                            key={addon.id}
                                                            onClick={() => handleAddonToggle(addon)}
                                                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${selectedAddons.find(a => a.id === addon.id)
                                                                ? 'border-primary bg-primary/10 text-primary'
                                                                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 text-gray-700 dark:text-gray-300'
                                                                }`}
                                                        >
                                                            <Icon name={addon.type === 'banda' ? 'workspace_premium' : 'star'} size={18} />
                                                            {addon.name} (+${addon.price})
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Custom Text Input for Banda */}
                                                {selectedAddons.filter(a => a.type === 'banda').map(banda => (
                                                    <div key={`text-${banda.id}`} className="animate-fadeIn mt-1">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-xs font-bold text-primary uppercase tracking-wider">
                                                                Frase para la {banda.name}
                                                            </label>
                                                            <span className="text-[10px] text-gray-400">
                                                                {(banda.customText?.length || 0)}/30
                                                            </span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder="Escribe la frase aquí (Máx. 30 letras)"
                                                            maxLength={30}
                                                            className="w-full bg-input-light dark:bg-input-dark border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                            value={banda.customText || ''}
                                                            onChange={(e) => {
                                                                const newText = e.target.value;
                                                                setSelectedAddons(prev => prev.map(a =>
                                                                    a.id === banda.id ? { ...a, customText: newText } : a
                                                                ));
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Size selection removed as per user request */}
                                <button onClick={() => {
                                    if (addToCart) {
                                        addToCart(product, selectedSize, 1, selectedAddons);
                                        window.dispatchEvent(new Event('open-cart-drawer'));
                                    }
                                }} className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-lg py-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2">
                                    <span>Agregar al Carrito</span>
                                    <Icon name="shopping_cart" size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products Section */}
                {relatedProducts.length > 0 && (
                    <div className="mt-20 border-t border-gray-800 pt-16 mb-20 px-6 lg:px-40">
                        <h2 className="text-3xl font-serif text-white mb-10 text-center">También te pueden interesar</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 main-container">
                            {relatedProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default ProductDetailsPage;