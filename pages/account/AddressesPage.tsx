import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

import { Icon } from '../../components/Icon';
interface Address {
    id: string;
    name: string;
    recipient_name: string;
    street: string;
    colonia: string;
    city: string;
    state: string;
    zip_code: string;
    phone: string;
    reference: string;
    is_default: boolean;
}

const AddressesPage = () => {
    const { user } = useAuth();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const initialFormState = {
        name: 'Casa',
        recipient_name: '',
        street: '',
        colonia: '',
        city: '',
        state: '',
        zip_code: '',
        phone: '',
        reference: '',
        is_default: false
    };

    const [formData, setFormData] = useState(initialFormState);
    const [zipLoading, setZipLoading] = useState(false);
    const [zipError, setZipError] = useState('');

    useEffect(() => {
        if (user) fetchAddresses();
    }, [user]);

    const fetchAddresses = async () => {
        try {
            const { data, error } = await supabase
                .from('user_addresses')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAddresses(data || []);
        } catch (error) {
            console.error('Error fetching addresses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const zip = e.target.value.replace(/\D/g, '').slice(0, 5);
        setFormData(prev => ({ ...prev, zip_code: zip }));
        setZipError('');

        if (zip.length === 5) {
            setZipLoading(true);
            try {
                // Try to find city with API
                const response = await fetch(`https://api.copomex.com/query/info_cp/${zip}?token=pruebas`);
                // Note: 'pruebas' token is for dev/sandbox but often rate limited or restricted. 
                // Fallback validation if API fails or for specific Chihuahua requirement:

                // Using a known reliable free source or simple validation
                // Simply checking if it starts with 31 for Chihuahua validation as per user request context (local business)

                // Let's rely on the requirement: "if city defined... is not Chihuahua"
                // Heuristic:
                let city = '';
                let state = '';

                // Fetch from sepomex implementation
                const sepomexRes = await fetch(`https://sepomex.icalialabs.com/api/v1/zip_codes/${zip}`);
                if (sepomexRes.ok) {
                    const data = await sepomexRes.json();
                    if (data.zip_codes && data.zip_codes.length > 0) {
                        const info = data.zip_codes[0];
                        city = info.d_ciudad || info.d_mnpio;
                        state = info.d_estado;
                    }
                }

                if (!city) {
                    // Fallback if API fails
                    if (zip.startsWith('31')) {
                        city = 'Chihuahua';
                        state = 'Chihuahua';
                    } else if (zip.startsWith('64')) {
                        city = 'Monterrey';
                        state = 'Nuevo León';
                    } else {
                        city = 'Otra Ciudad';
                        state = 'Otro Estado';
                    }
                }

                // Normalizing for comparison
                const normalizedCity = city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                if (!normalizedCity.includes('chihuahua')) {
                    setZipError(`Lo sentimos, por ahora solo entregamos en Chihuahua. (Código postal detectado en: ${city})`);
                    setFormData(prev => ({ ...prev, city, state }));
                } else {
                    setFormData(prev => ({ ...prev, city, state }));
                }

            } catch (error) {
                console.error("Zip validation error", error);
                // Fallback validation
                if (!zip.startsWith('31')) {
                    setZipError('Lo sentimos, por ahora solo entregamos en Chihuahua.');
                } else {
                    setFormData(prev => ({ ...prev, city: 'Chihuahua', state: 'Chihuahua' }));
                }
            } finally {
                setZipLoading(false);
            }
        }
    };

    const handleEdit = (addr: Address) => {
        setFormData({
            name: addr.name,
            recipient_name: addr.recipient_name,
            street: addr.street,
            colonia: addr.colonia,
            city: addr.city,
            state: addr.state,
            zip_code: addr.zip_code || '',
            phone: addr.phone,
            reference: addr.reference || '',
            is_default: addr.is_default
        });
        setEditingId(addr.id);
        setIsEditing(true);
        setZipError('');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta dirección?')) return;

        try {
            const { error } = await supabase
                .from('user_addresses')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setAddresses(addresses.filter(a => a.id !== id));
        } catch (error) {
            console.error('Error deleting address:', error);
            alert('Error al eliminar dirección');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (zipError) return;
        if (!formData.city.toLowerCase().includes('chihuahua') && !formData.state.toLowerCase().includes('chihuahua') && formData.zip_code) {
            alert("La dirección debe ser de Chihuahua.");
            return;
        }

        try {
            if (editingId) {
                // Update
                const { error } = await supabase
                    .from('user_addresses')
                    .update(formData)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from('user_addresses')
                    .insert([{ ...formData, user_id: user?.id }]);
                if (error) throw error;
            }

            setIsEditing(false);
            setEditingId(null);
            setFormData(initialFormState);
            setZipError('');
            fetchAddresses();
        } catch (error) {
            console.error('Error saving address:', error);
            alert('Error al guardar dirección');
        }
    };

    if (loading) return <div>Cargando direcciones...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-border-light dark:border-border-dark">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <Icon name="location_on" size={30} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Mis Direcciones</h1>
                        <p className="text-text-secondary">Gestiona tus lugares de entrega</p>
                    </div>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => { setIsEditing(true); setEditingId(null); setFormData(initialFormState); setZipError(''); }}
                        className="bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Icon name="add" size={18} />
                        Nueva Dirección
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg mb-6">
                    <h3 className="font-bold text-lg mb-4">{editingId ? 'Editar Dirección' : 'Nueva Dirección'}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nombre (Alias)</label>
                            <input
                                required
                                placeholder="Ej: Casa, Oficina"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Nombre de quien recibe</label>
                            <input
                                required
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                value={formData.recipient_name}
                                onChange={e => setFormData({ ...formData, recipient_name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Código Postal</label>
                            <div className="relative">
                                <input
                                    required
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={5}
                                    placeholder="31000"
                                    className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-700 ${zipError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-slate-600'}`}
                                    value={formData.zip_code}
                                    onChange={handleZipChange}
                                />
                                {zipLoading && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                                    </div>
                                )}
                            </div>
                            {zipError && <p className="text-red-500 text-xs mt-1">{zipError}</p>}
                        </div>

                        <div>
                            {/* Placeholder for alignment */}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Estado</label>
                            <input
                                readOnly
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-600 text-gray-500"
                                value={formData.state}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Ciudad</label>
                            <input
                                readOnly
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-600 text-gray-500"
                                value={formData.city}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Calle y Número</label>
                            <input
                                required
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                value={formData.street}
                                onChange={e => setFormData({ ...formData, street: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Colonia</label>
                            <input
                                required
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                value={formData.colonia}
                                onChange={e => setFormData({ ...formData, colonia: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Teléfono</label>
                            <input
                                required
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Referencia (Opcional)</label>
                            <input
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                value={formData.reference}
                                onChange={e => setFormData({ ...formData, reference: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={!!zipError || zipLoading}
                                className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Guardar Dirección
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {addresses.length === 0 ? (
                        <div className="col-span-2 text-center py-12 text-slate-400">
                            <Icon name="no_meeting_room" size={36} className="mb-2" />
                            <p>No tienes direcciones guardadas.</p>
                        </div>
                    ) : (
                        addresses.map((addr) => (
                            <div key={addr.id} className="relative bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors group">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(addr)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-blue-600">
                                        <Icon name="edit" size={20} />
                                    </button>
                                    <button onClick={() => handleDelete(addr.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-red-600">
                                        <Icon name="delete" size={20} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon name="home_pin" size={24} className="text-text-secondary" />
                                    <h3 className="font-bold text-lg">{addr.name}</h3>
                                    {addr.is_default && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">Default</span>}
                                </div>
                                <p className="font-medium">{addr.recipient_name}</p>
                                <p className="text-text-secondary text-sm">{addr.street}, {addr.colonia}</p>
                                <p className="text-text-secondary text-sm">CP: {addr.zip_code} - {addr.city}</p>
                                <p className="text-text-secondary text-sm mt-2 font-mono">{addr.phone}</p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default AddressesPage;


