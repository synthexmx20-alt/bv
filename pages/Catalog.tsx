import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

import { Icon } from '../components/Icon';
const CatalogPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Get search term from URL
    const querySearch = searchParams.get('q') || '';

    // URL Params State
    const selectedCategory = searchParams.get('category') || "";

    const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 10000 });

    const [occasionsList, setOccasionsList] = useState<string[]>([]);

    // New Supabase State
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch Products
                const productsPromise = supabase.from('products').select('*');
                // Fetch Categories
                const categoriesPromise = supabase.from('categories').select('*').order('name');
                // Fetch Occasions
                const occasionsPromise = supabase.from('occasions').select('*').order('name');

                // Timeout promise
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timed out')), 25000)
                );

                const [productsResponse, categoriesResponse, occasionsResponse] = await Promise.race([
                    Promise.all([productsPromise, categoriesPromise, occasionsPromise]),
                    timeoutPromise
                ]) as any;

                if (productsResponse.error) throw productsResponse.error;
                if (categoriesResponse.error) throw categoriesResponse.error;

                // Occasion error is non-fatal (table might not exist yet)
                if (occasionsResponse.error) {
                    console.warn("Could not fetch occasions (table missing?)", occasionsResponse.error);
                } else {
                    setOccasionsList(occasionsResponse.data.map((o: any) => o.name));
                }

                // Shuffle products for random display order on refresh
                const shuffledProducts = (productsResponse.data as Product[]).sort(() => Math.random() - 0.5);
                setProducts(shuffledProducts);
                setCategories(categoriesResponse.data || []);
            } catch (err: any) {
                console.error('Error fetching data:', err);
                setError(err.message || 'Error desconocido');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredProducts = products.filter(product => {
        // Filter by category if one is selected
        const matchesCategory = selectedCategory === "" ||
            product.category?.toLowerCase() === selectedCategory.toLowerCase() ||
            (selectedCategory === "Baúles o Cofres" && product.category?.toLowerCase().includes("baúl")) ||
            (selectedCategory === "Ramos o Bouquets" && (product.category?.toLowerCase().includes("ramo") || product.category?.toLowerCase().includes("bouquet")));

        const searchLower = querySearch.toLowerCase();
        const matchesSearch = querySearch === '' ||
            product.name.toLowerCase().includes(searchLower) ||
            product.description.toLowerCase().includes(searchLower);

        // Filter by Price
        const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max;

        // Filter by Occasion
        const matchesOccasion = selectedOccasions.length === 0 ||
            (product.occasions && product.occasions.some(occ => selectedOccasions.includes(occ)));

        return matchesCategory && matchesSearch && matchesPrice && matchesOccasion;
    });

    const handleCategoryClick = (category: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (selectedCategory === category) {
            newParams.delete('category'); // Toggle off
        } else {
            newParams.set('category', category); // Set new
        }
        setSearchParams(newParams);
    };

    const handleOccasionChange = (occasion: string) => {
        setSelectedOccasions(prev => {
            if (prev.includes(occasion)) {
                return prev.filter(o => o !== occasion);
            } else {
                return [...prev, occasion];
            }
        });
    };

    return (
        <div className="flex flex-col min-h-screen bg-black">
            <Header />
            <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-8 py-8">

                {/* Breadcrumbs & Title */}
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Link to="/" className="hover:text-primary transition-colors">Inicio</Link>
                        <span>/</span>
                        <span className="text-white">Catálogo</span>
                    </div>
                    <div className="w-full h-px bg-gradient-to-r from-primary/50 to-transparent" />
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
                        {/* Categories */}
                        <div className="border border-primary/30 p-6 rounded-none">
                            <h2 className="text-xl font-serif text-primary border-b border-primary/30 pb-4 mb-6 tracking-wide">
                                Categorías
                            </h2>
                            <nav className="flex flex-col gap-2">
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => handleCategoryClick(category.name)}
                                        className={`text-left py-2 px-2 text-sm uppercase tracking-wider transition-all duration-300 border-l-2 ${selectedCategory === category.name
                                            ? 'border-primary text-primary pl-4 bg-primary/5'
                                            : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600 hover:pl-4'
                                            }`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Price Filter */}
                        <div className="border border-primary/30 p-6 rounded-none">
                            <h2 className="text-xl font-serif text-primary border-b border-primary/30 pb-4 mb-6 tracking-wide">
                                Precio
                            </h2>
                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="number"
                                    min="0"
                                    value={priceRange.min}
                                    onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                                    className="w-full bg-black border border-gray-700 rounded p-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="Min"
                                />
                                <span className="text-gray-500">-</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={priceRange.max}
                                    onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                                    className="w-full bg-black border border-gray-700 rounded p-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="Max"
                                />
                            </div>
                        </div>
                    </aside>

                    {/* Product Grid */}
                    <div className="flex-1">
                        {/* Top Bar */}
                        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 border border-primary/30 p-4 rounded-none">
                            <div className="flex items-center gap-4 text-gray-400 text-sm">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`transition-colors ${viewMode === 'grid' ? 'text-primary' : 'text-gray-600 hover:text-white'}`}
                                >
                                    <Icon name="grid_view" size={24} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`transition-colors ${viewMode === 'list' ? 'text-primary' : 'text-gray-600 hover:text-white'}`}
                                >
                                    <Icon name="view_list" size={24} />
                                </button>
                                <div className="h-4 w-px bg-gray-700 mx-2"></div>
                                <span>Mostrando {filteredProducts.length} resultados</span>
                            </div>

                            {/* Active Filters Badges */}
                            {(selectedCategory || selectedOccasions.length > 0 || priceRange.min > 0 || priceRange.max < 10000) && (
                                <button
                                    onClick={() => {
                                        setSearchParams({}); // Clear all URL params
                                        setSelectedOccasions([]);
                                        setPriceRange({ min: 0, max: 10000 });
                                    }}
                                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                                >
                                    <Icon name="close" size={14} />
                                    Limpiar Filtros
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                            </div>
                        ) : error ? (
                            <div className="bg-red-900/20 text-red-200 p-6 text-center border border-red-800">
                                {error}
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-20 bg-[#111] border border-gray-800">
                                <p className="text-gray-400 text-lg">No se encontraron productos con estos filtros.</p>
                                <button
                                    onClick={() => {
                                        setSearchParams({});
                                        setSelectedOccasions([]);
                                        setPriceRange({ min: 0, max: 10000 });
                                    }}
                                    className="mt-4 text-primary hover:underline"
                                >
                                    Limpiar todos los filtros
                                </button>
                            </div>
                        ) : (
                            viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredProducts.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {filteredProducts.map((product) => (
                                        <Link
                                            key={product.id}
                                            to={`/product/${product.id}`}
                                            className="flex flex-col sm:flex-row bg-[#111] border border-gray-800 hover:border-primary/50 transition-all duration-300 group"
                                        >
                                            <div className="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 relative overflow-hidden">
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                            </div>
                                            <div className="p-6 flex flex-col justify-center flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-white font-serif text-xl mb-2 group-hover:text-primary transition-colors">
                                                            {product.name}
                                                        </h3>
                                                        <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                                                            {product.description}
                                                        </p>
                                                    </div>
                                                    <p className="text-primary font-bold text-xl ml-4">
                                                        ${product.price}
                                                    </p>
                                                </div>
                                                <div className="mt-auto pt-4 flex items-center gap-2 text-primary text-sm font-bold uppercase tracking-wider opacity-0 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                                                    Ver Detalle <Icon name="arrow_forward" size={16} />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CatalogPage;