import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types';
import { Category } from '../../types';

const AdminProductsPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [occasions, setOccasions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form state
    const [formData, setFormData] = useState<Partial<Product>>({
        name: '',
        price: 0,
        description: '',
        category: '',
        image: '',
        occasions: [],
        sizes: [],
        meta_title: '',
        meta_description: '',
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const productsPromise = supabase.from('products').select('*').order('created_at', { ascending: false });
            const categoriesPromise = supabase.from('categories').select('*').order('name');
            const occasionsPromise = supabase.from('occasions').select('*').order('name');

            const [productsRes, categoriesRes, occasionsRes] = await Promise.all([
                productsPromise,
                categoriesPromise,
                occasionsPromise
            ]);

            if (productsRes.error) console.error('Error fetching products:', productsRes.error);
            else setProducts(productsRes.data as Product[]);

            if (categoriesRes.error) console.error('Error fetching categories:', categoriesRes.error);
            else setCategories(categoriesRes.data || []);

            if (occasionsRes.error) {
                console.error('Error fetching occasions (table might not exist):', occasionsRes.error);
                // Fallback or empty
                setOccasions([]);
            } else {
                setOccasions(occasionsRes.data?.map((o: any) => o.name) || []);
            }

        } catch (err) {
            console.error('Unexpected error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product: Product | null = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                ...product,
                occasions: product.occasions || [],
                sizes: product.sizes || []
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                price: 0,
                description: '',
                category: '',
                image: '',
                occasions: [],
                sizes: [],
                meta_title: '',
                meta_description: '',
            });
        }
        setIsModalOpen(true);
    };

    const handleOccasionChange = (occasion: string) => {
        setFormData(prev => {
            const currentOccasions = prev.occasions || [];
            if (currentOccasions.includes(occasion)) {
                return { ...prev, occasions: currentOccasions.filter(o => o !== occasion) };
            } else {
                return { ...prev, occasions: [...currentOccasions, occasion] };
            }
        });
    };

    const handleSizeChange = (index: number, field: string, value: any) => {
        setFormData(prev => {
            const currentSizes = [...(prev.sizes || [])];
            currentSizes[index] = { ...currentSizes[index], [field]: value };
            return { ...prev, sizes: currentSizes };
        });
    };

    const handleAddSize = () => {
        setFormData(prev => ({
            ...prev,
            sizes: [...(prev.sizes || []), { name: '', price: 0, description: '' }]
        }));
    };

    const handleRemoveSize = (index: number) => {
        setFormData(prev => {
            const currentSizes = [...(prev.sizes || [])];
            currentSizes.splice(index, 1);
            return { ...prev, sizes: currentSizes };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { id, created_at, ...updates } = formData as any; // Exclude non-updatable fields

            // Handle Image Upload
            if ((formData as any).imageFile) {
                const file = (formData as any).imageFile;
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('products')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error('Error uploading image:', uploadError);
                    alert('Error al subir la imagen. Asegúrate de que el bucket "products" exista y tengas permisos.');
                    setLoading(false);
                    return;
                }

                const { data: urlData } = supabase.storage
                    .from('products')
                    .getPublicUrl(filePath);

                updates.image = urlData.publicUrl;
                delete updates.imageFile; // Remove file object from updates
            }

            if (editingProduct) {
                // Update
                const { error } = await supabase
                    .from('products')
                    .update(updates)
                    .eq('id', editingProduct.id);

                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from('products')
                    .insert([updates]);

                if (error) throw error;
            }

            await fetchProducts();
            setIsModalOpen(false);
        } catch (error: any) {
            console.error('Error submitting product:', error);
            alert('Error al guardar el producto: ' + (error.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        // ... logic remains same ...
        if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (!error) {
            fetchProducts();
        }
    };

    // ... render ...
    if (loading && !isModalOpen) return <div>Cargando productos...</div>;

    return (
        <div>
            {/* ... Header and Table ... */}
            <div className="flex justify-between items-center mb-6">
                {/* ... */}
                <h2 className="text-2xl font-serif dark:text-white">Inventario de Productos</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <span className="material-symbols-outlined">add</span>
                    Agregar Producto
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Producto</th>
                            <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Categoría</th>
                            <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Precio</th>
                            <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4 flex items-center gap-4">
                                    <img src={product.image} alt={product.name} className="w-10 h-10 rounded object-cover bg-slate-100" />
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-900 dark:text-white">{product.name}</span>
                                        {/* Show simple badges for first 2 occasions */}
                                        <div className="flex gap-1 mt-1">
                                            {product.occasions?.slice(0, 2).map(occ => (
                                                <span key={occ} className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1 rounded text-slate-500">{occ}</span>
                                            ))}
                                            {product.occasions && product.occasions.length > 2 && (
                                                <span className="text-[10px] text-slate-400">+{product.occasions.length - 2}</span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{product.category}</td>
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">${product.price}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleOpenModal(product)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-blue-600 transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                        <button onClick={() => handleDelete(product.id)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-red-600 transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4 dark:text-white">
                            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Precio</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                                    <select
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="">Seleccionar categoría...</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Occasions Selection */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ocasiones</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {occasions.map((occasion) => (
                                        <label key={occasion} className="inline-flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary dark:bg-slate-700 dark:border-gray-600"
                                                checked={formData.occasions?.includes(occasion)}
                                                onChange={() => handleOccasionChange(occasion)}
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{occasion}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Size Variants */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Variantes de Tamaño</label>
                                    <button
                                        type="button"
                                        onClick={handleAddSize}
                                        className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-2 py-1 rounded text-slate-600 dark:text-slate-300 transition-colors"
                                    >
                                        + Agregar Tamaño
                                    </button>
                                </div>

                                {(!formData.sizes || formData.sizes.length === 0) && (
                                    <p className="text-sm text-slate-500 italic">Sin variantes. Se usará el precio base.</p>
                                )}

                                <div className="space-y-3">
                                    {formData.sizes?.map((size, index) => (
                                        <div key={index} className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Nombre (ej. Chico)"
                                                    className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                                                    value={size.name}
                                                    onChange={e => handleSizeChange(index, 'name', e.target.value)}
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Precio"
                                                    className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                                                    value={size.price}
                                                    onChange={e => handleSizeChange(index, 'price', Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-pink-500">♥ San Valentín:</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Precio Temporada"
                                                        className="flex-1 px-3 py-1.5 rounded border border-pink-200 dark:border-pink-900/30 bg-pink-50 dark:bg-pink-900/10 text-sm"
                                                        value={size.seasonalPrice || ''}
                                                        onChange={e => handleSizeChange(index, 'seasonalPrice', e.target.value ? Number(e.target.value) : undefined)}
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Descripción (opcional)"
                                                    className="w-full px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                                                    value={size.description || ''}
                                                    onChange={e => handleSizeChange(index, 'description', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSize(index)}
                                                    className="text-xs text-red-500 hover:text-red-600 hover:underline"
                                                >
                                                    Eliminar variante
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Image Upload Section */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Imagen del Producto</label>

                                <div className="flex flex-col gap-4">
                                    {/* Preview */}
                                    {(formData.image || (formData as any).imageFile) && (
                                        <div className="relative w-full aspect-video md:w-48 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                                            <img
                                                src={(formData as any).imageFile ? URL.createObjectURL((formData as any).imageFile) : formData.image}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* File Input */}
                                    <div className="flex flex-col gap-2">
                                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors w-fit">
                                            <span className="material-symbols-outlined">upload</span>
                                            <span className="text-sm font-medium">Subir Imagen</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setFormData({ ...formData, image: '', imageFile: file } as any);
                                                    }
                                                }}
                                            />
                                        </label>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            O ingresa una URL:
                                        </p>
                                        <input
                                            type="text"
                                            placeholder="https://ejemplo.com/imagen.jpg"
                                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                            value={formData.image}
                                            onChange={e => setFormData({ ...formData, image: e.target.value, imageFile: null } as any)} // Clear file if URL is manually edited
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Configuración SEO (Opcional)</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Meta Título</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-gray-400"
                                            placeholder={formData.name || "Título para buscadores"}
                                            value={formData.meta_title || ''}
                                            onChange={e => setFormData({ ...formData, meta_title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Meta Descripción</label>
                                        <textarea
                                            rows={2}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none placeholder:text-gray-400"
                                            placeholder={formData.description?.slice(0, 150) || "Descripción breve para buscadores"}
                                            value={formData.meta_description || ''}
                                            onChange={e => setFormData({ ...formData, meta_description: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                >
                                    {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProductsPage;
