import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CheckoutHeader from '../../components/CheckoutHeader';
import { CheckoutContext } from '../../context/CheckoutContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

import { Icon } from '../../components/Icon';
const CheckoutShipping = () => {
    const navigate = useNavigate();
    const { checkoutData, updateCheckoutData, getEffectivePrice } = useContext(CheckoutContext);
    const { user } = useAuth();
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [showAddressBook, setShowAddressBook] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [saveAddress, setSaveAddress] = useState(false);
    const [dateError, setDateError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchSavedAddresses();
        }
    }, [user]);

    const fetchSavedAddresses = async () => {
        const { data } = await supabase
            .from('user_addresses')
            .select('*')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false });
        if (data) setSavedAddresses(data);
    };

    const handleSelectAddress = (addr: any) => {
        updateCheckoutData('shipping', {
            ...checkoutData.shipping,
            fullName: addr.recipient_name,
            street: addr.street,
            colonia: addr.colonia,
            state: addr.state,
            zipCode: addr.zip_code,
            phone: addr.phone,
            reference: addr.reference || ''
        });
        setShowAddressBook(false);
    };

    const [availableColonies, setAvailableColonies] = useState<any[]>([]);
    const [zipError, setZipError] = useState<string | null>(null);

    const handleZipCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 5);

        // Update state immediately
        let newState = { ...checkoutData.shipping, zipCode: val, colonia: '', shippingCost: 0 };
        setAvailableColonies([]);
        setZipError(null);
        updateCheckoutData('shipping', newState);
        updateCheckoutData('shippingCost', 0); // Reset cost

        if (val.length === 5) {
            try {
                const { data, error } = await supabase
                    .from('shipping_zones')
                    .select('*')
                    .eq('zip_code', val);

                if (error) throw error;

                if (!data || data.length === 0) {
                    // No Rules Found -> Fallback Logic
                    if (val.startsWith('31')) {
                        // Default Open for 31xxx if no specific rule exists? 
                        // Or strict blocking if we want "Whitelist Only". 
                        // User asked for "Whitelist". So if not in DB, it should be Blocked.
                        // BUT, for transition, maybe we warn. 
                        // Let's implement Strict Whitelist as requested ("No match? -> Show error").
                        setZipError('Lo sentimos, este Código Postal no está en nuestra zona de cobertura actual.');
                    } else {
                        setZipError('Lo sentimos, solo tenemos cobertura en la ciudad de Chihuahua (CP 31XXX).');
                    }
                } else {
                    // Check if *all* are blocked or filter valid ones
                    const validZones = data.filter(z => z.status !== 'blocked');

                    if (validZones.length === 0) {
                        setZipError('Lo sentimos, esta zona se encuentra temporalmente sin servicio.');
                    } else {
                        setAvailableColonies(validZones);
                        // Auto-select if only one? No, let user choose to be sure.
                    }
                }
            } catch (err) {
                console.error("Error validating zip:", err);
                // Fallback to allow typing if offline? safe fail:
                // setAvailableColonies([]); 
            }
        }
    };

    const handleColonyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const zone = availableColonies.find(c => c.id === selectedId);

        if (zone) {
            updateCheckoutData('shipping', {
                ...checkoutData.shipping,
                colonia: zone.colony,
                // If the zone has a surcharge, set it
            });

            // Set Shipping Cost
            const cost = zone.status === 'surcharge' ? (Number(zone.surcharge) || 0) : 0;
            updateCheckoutData('shippingCost', cost); // We need to ensure 'shippingCost' updates Context
            // Note: checkoutData structure in Context has shippingCost at root, not inside shipping object.
            // Check updateCheckoutData implementation: `updateCheckoutData(section, data)`
            // So we call `updateCheckoutData('shippingCost', cost)`
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedDate = e.target.value;
        setDateError(null); // Reset error on change

        // Valentine's Restriction (Feb 9 - Feb 18)
        const isValentineRange = selectedDate >= '2026-02-09' && selectedDate <= '2026-02-18';

        if (isValentineRange) {
            // Check if cart has items NOT from '14 de febrero' or 'San Valentin'
            const hasInvalidItems = checkoutData.items.some(item => {
                const category = item.product.category?.toLowerCase() || '';
                return !category.includes('14 de febrero') && !category.includes('san valentin') && !category.includes('san valentín');
            });

            if (hasInvalidItems) {
                setDateError('Para entregas entre el 9 y el 18 de Febrero, SOLO aceptamos productos de la categoría "14 de febrero".');
            } else {
                // Warning for pricing (optional, can be just a text info)
                // setDateError('Aviso: Se aplicarán precios de temporada.'); 
            }
        }

        updateCheckoutData('shipping', { ...checkoutData.shipping, date: selectedDate });
    };

    const handleNext = async () => {
        setSubmitted(true);
        const { fullName, phone, street, colonia, reference, date, timeSlot, zipCode, city, state } = checkoutData.shipping;

        if (!fullName || !phone || !street || !colonia || !date || !timeSlot || !zipCode || dateError) {
            return;
        }

        if (saveAddress && user) {
            try {
                await supabase.from('user_addresses').insert({
                    user_id: user.id,
                    name: 'Mi Dirección', // Default name
                    recipient_name: fullName,
                    street,
                    colonia,
                    city: city || 'Chihuahua', // Fallback or use from context
                    state: state || 'Chihuahua',
                    zip_code: zipCode,
                    phone,
                    reference
                });
            } catch (error) {
                console.error('Error saving address:', error);
                // Optionally show a toast/alert, but don't block the flow
            }
        }

        navigate('/checkout/message');
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-[#111418] dark:text-white font-display min-h-screen flex flex-col overflow-x-hidden">
            <CheckoutHeader />
            <div className="flex-1 flex justify-center py-8 lg:py-12 px-4 lg:px-0">
                <div className="w-full max-w-[1200px] flex flex-col gap-8">
                    {/* Stepper */}
                    <div className="w-full max-w-[800px] mx-auto mb-4">
                        <div className="relative flex items-center justify-between w-full">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[#282b39] -z-10 rounded"></div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm ring-4 ring-background-dark">1</div>
                                <span className="text-white text-sm font-bold absolute -bottom-6 w-32 text-center">Envío</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="size-8 rounded-full bg-[#282b39] flex items-center justify-center text-[#9da1b9] font-bold text-sm ring-4 ring-background-dark">2</div>
                                <span className="text-[#9da1b9] text-sm font-medium absolute -bottom-6 w-32 text-center">Mensaje</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="size-8 rounded-full bg-[#282b39] flex items-center justify-center text-[#9da1b9] font-bold text-sm ring-4 ring-background-dark">3</div>
                                <span className="text-[#9da1b9] text-sm font-medium absolute -bottom-6 w-32 text-center">Pago</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-6">
                        <div className="lg:col-span-8 flex flex-col gap-8">
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center justify-between border-b border-[#282b39] pb-4">
                                    <div className="flex items-center gap-3">
                                        <Icon name="person_pin_circle" size={24} className="text-primary" />
                                        <h2 className="text-2xl font-bold text-white">Información de Envío</h2>
                                    </div>
                                    {user && savedAddresses.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAddressBook(!showAddressBook)}
                                            className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
                                        >
                                            <Icon name="bookmarks" size={18} />
                                            Mis Direcciones
                                        </button>
                                    )}
                                </div>

                                {!user ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-4 bg-surface-dark rounded-xl border border-[#282b39] text-center">
                                        <div className="size-16 rounded-full bg-[#282b39] flex items-center justify-center text-primary mb-6">
                                            <Icon name="lock" size={36} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Inicia sesión para continuar</h3>
                                        <p className="text-[#9da1b9] max-w-md mb-8">
                                            Para asegurar la seguridad de tu pedido y poder guardar tu dirección, necesitamos que inicies sesión o crees una cuenta.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                                            <Link
                                                to="/login?redirect=/checkout/shipping"
                                                className="flex-1 bg-primary hover:bg-blue-700 text-white font-bold h-12 rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                Iniciar Sesión
                                            </Link>
                                            <Link
                                                to="/register?redirect=/checkout/shipping"
                                                className="flex-1 bg-[#282b39] hover:bg-[#3e4255] text-white font-bold h-12 rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                Registrarse
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {showAddressBook && (
                                            <div className="mb-4 p-4 bg-surface-dark rounded-xl border border-primary/20">
                                                <h3 className="font-bold mb-3 text-sm uppercase tracking-wide text-slate-400">Selecciona una dirección</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {savedAddresses.map(addr => (
                                                        <button
                                                            key={addr.id}
                                                            type="button"
                                                            onClick={() => handleSelectAddress(addr)}
                                                            className="text-left p-3 rounded-lg border border-[#282b39] bg-[#1c202a] hover:border-primary hover:shadow-md transition-all group"
                                                        >
                                                            <div className="font-bold text-white flex items-center gap-2 group-hover:text-primary transition-colors">
                                                                <Icon name="place" size={16} />
                                                                {addr.name}
                                                            </div>
                                                            <div className="text-sm text-slate-400 mt-1">
                                                                {addr.street}, {addr.colonia}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-4">
                                            <h3 className="text-lg font-bold text-white mb-1">¿Quién recibe?</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[#9da1b9] text-sm font-medium">Nombre completo</label>
                                                    <input
                                                        className={`h-12 w-full rounded-lg bg-input-dark dark:bg-[#282b39] text-white px-4 focus:ring-2 focus:outline-none ${submitted && !checkoutData.shipping.fullName ? 'border-red-500 ring-1 ring-red-500' : 'border-transparent focus:ring-primary'}`}
                                                        placeholder="Ej. Ana García"
                                                        type="text"
                                                        value={checkoutData.shipping.fullName}
                                                        onChange={(e) => updateCheckoutData('shipping', { ...checkoutData.shipping, fullName: e.target.value })}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[#9da1b9] text-sm font-medium">Teléfono</label>
                                                    <input
                                                        className={`h-12 w-full rounded-lg bg-input-dark dark:bg-[#282b39] text-white px-4 focus:ring-2 focus:outline-none ${submitted && !checkoutData.shipping.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-transparent focus:ring-primary'}`}
                                                        placeholder="+52 (614) ..."
                                                        type="tel"
                                                        value={checkoutData.shipping.phone}
                                                        onChange={(e) => updateCheckoutData('shipping', { ...checkoutData.shipping, phone: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4 mt-2">
                                            <h3 className="text-lg font-bold text-white mb-1">Dirección de entrega</h3>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[#9da1b9] text-sm font-medium">Código Postal</label>
                                                <input
                                                    className={`h-12 w-full rounded-lg bg-input-dark dark:bg-[#282b39] text-white px-4 focus:ring-2 focus:outline-none ${submitted && !checkoutData.shipping.zipCode ? 'border-red-500 ring-1 ring-red-500' : 'border-transparent focus:ring-primary'}`}
                                                    placeholder="31xxx"
                                                    type="text"
                                                    value={checkoutData.shipping.zipCode || ''}
                                                    onChange={handleZipCodeChange}
                                                />
                                                {/* Display City/State if validated */}
                                                {checkoutData.shipping.city && checkoutData.shipping.state && (
                                                    <p className="text-xs text-green-500 font-bold ml-1">
                                                        {checkoutData.shipping.city}, {checkoutData.shipping.state}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1.5 mt-2">
                                                <label className="text-[#9da1b9] text-sm font-medium">Calle y número</label>
                                                <input
                                                    className={`h-12 w-full rounded-lg bg-input-dark dark:bg-[#282b39] text-white px-4 focus:ring-2 focus:outline-none ${submitted && !checkoutData.shipping.street ? 'border-red-500 ring-1 ring-red-500' : 'border-transparent focus:ring-primary'}`}
                                                    placeholder="Ej. Av. Reforma 123"
                                                    type="text"
                                                    value={checkoutData.shipping.street}
                                                    onChange={(e) => updateCheckoutData('shipping', { ...checkoutData.shipping, street: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5 mt-2">
                                                <label className="text-[#9da1b9] text-sm font-medium">Colonia</label>
                                                {availableColonies.length > 0 ? (
                                                    <div className="relative">
                                                        <select
                                                            className={`h-12 w-full rounded-lg bg-input-dark dark:bg-[#282b39] text-white px-4 appearance-none focus:ring-2 focus:outline-none ${submitted && !checkoutData.shipping.colonia ? 'border-red-500 ring-1 ring-red-500' : 'border-transparent focus:ring-primary'}`}
                                                            value={availableColonies.find(c => c.colony === checkoutData.shipping.colonia)?.id || ''}
                                                            onChange={handleColonyChange}
                                                        >
                                                            <option value="">Selecciona tu colonia</option>
                                                            {availableColonies.map(zone => (
                                                                <option key={zone.id} value={zone.id}>
                                                                    {zone.colony} {zone.surcharge > 0 ? `(+$${zone.surcharge} ENVÍO)` : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <Icon name="expand_more" size={24} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                    </div>
                                                ) : (
                                                    <input
                                                        className={`h-12 w-full rounded-lg bg-input-dark dark:bg-[#282b39] text-white px-4 focus:ring-2 focus:outline-none ${submitted && !checkoutData.shipping.colonia ? 'border-red-500 ring-1 ring-red-500' : 'border-transparent focus:ring-primary'} ${zipError ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        placeholder={zipError ? "Código Postal no válido" : "Ingresa tu CP primero"}
                                                        type="text"
                                                        value={checkoutData.shipping.colonia}
                                                        onChange={(e) => updateCheckoutData('shipping', { ...checkoutData.shipping, colonia: e.target.value })}
                                                        disabled={availableColonies.length === 0} // Disable manual typing if we enforce whitelist
                                                    />
                                                )}
                                                {zipError && <p className="text-red-500 text-xs mt-1">{zipError}</p>}
                                                {checkoutData.shippingCost > 0 && (
                                                    <p className="text-yellow-500 text-xs mt-1 font-bold">
                                                        ⚠️ Esta zona tiene un costo de envío adicional de ${checkoutData.shippingCost}.
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1.5 mt-2">
                                                <label className="text-[#9da1b9] text-sm font-medium">Referencia del domicilio o negocio</label>
                                                <textarea
                                                    className="h-20 w-full rounded-lg bg-input-dark dark:bg-[#282b39] text-white px-4 py-3 focus:ring-2 focus:outline-none resize-none border-transparent focus:ring-primary"
                                                    placeholder="Ej. Frente al parque, casa blanca zaguán negro..."
                                                    value={checkoutData.shipping.reference}
                                                    onChange={(e) => updateCheckoutData('shipping', { ...checkoutData.shipping, reference: e.target.value })}
                                                />
                                            </div>

                                            {user && (
                                                <div className="flex items-center gap-2 mt-4">
                                                    <input
                                                        type="checkbox"
                                                        id="saveAddress"
                                                        checked={saveAddress}
                                                        onChange={(e) => setSaveAddress(e.target.checked)}
                                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                    />
                                                    <label htmlFor="saveAddress" className="text-white text-sm select-none cursor-pointer">
                                                        Guardar esta dirección para futuros pedidos
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-[#282b39]">
                                            <div className="flex items-center gap-3">
                                                <Icon name="calendar_clock" size={24} className="text-primary" />
                                                <h2 className="text-xl font-bold text-white">Fecha y Hora de Entrega</h2>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[#9da1b9] text-sm font-medium">Fecha de Entrega</label>
                                                    <input
                                                        className={`h-12 w-full rounded-lg bg-input-dark dark:bg-[#282b39] text-white px-4 focus:ring-2 focus:outline-none ${submitted && !checkoutData.shipping.date ? 'border-red-500 ring-1 ring-red-500' : 'border-transparent focus:ring-primary'}`}
                                                        type="date"
                                                        min={new Date().toISOString().split('T')[0]}
                                                        value={checkoutData.shipping.date}
                                                        onChange={handleDateChange}
                                                    />
                                                    {dateError && (
                                                        <p className="text-red-500 text-xs mt-1 font-bold">
                                                            {dateError}
                                                        </p>
                                                    )}
                                                    {/* Info for Valentine's Season */}
                                                    {checkoutData.shipping.date >= '2026-02-09' && checkoutData.shipping.date <= '2026-02-18' && !dateError && (
                                                        <p className="text-primary text-xs mt-1 font-bold">
                                                            * Precios de temporada de San Valentín aplicados.
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[#9da1b9] text-sm font-medium">Horario de Entrega</label>
                                                    <div className="relative">
                                                        <select
                                                            className={`h-12 w-full rounded-lg bg-input-dark dark:bg-[#282b39] text-white px-4 appearance-none focus:ring-2 focus:outline-none ${submitted && !checkoutData.shipping.timeSlot ? 'border-red-500 ring-1 ring-red-500' : 'border-transparent focus:ring-primary'}`}
                                                            value={checkoutData.shipping.timeSlot}
                                                            onChange={(e) => updateCheckoutData('shipping', { ...checkoutData.shipping, timeSlot: e.target.value })}
                                                        >
                                                            <option value="">Selecciona un horario</option>
                                                            {(() => {
                                                                const slots = [];
                                                                const selectedDate = checkoutData.shipping.date;

                                                                // Special Logic for Valentine's Day (Feb 14)
                                                                if (selectedDate && selectedDate.endsWith('-02-14')) {
                                                                    const valentineSlots = [
                                                                        { label: "Bloque Mañana (9:00 AM - 3:00 PM)", startHour: 9 },
                                                                        { label: "Bloque Tarde (3:00 PM - 9:00 PM)", startHour: 15 }
                                                                    ];

                                                                    const today = new Date();
                                                                    const isToday = () => {
                                                                        const [year, month, day] = selectedDate.split('-').map(Number);
                                                                        return today.getFullYear() === year &&
                                                                            today.getMonth() + 1 === month &&
                                                                            today.getDate() === day;
                                                                    };
                                                                    const currentHour = today.getHours();

                                                                    return valentineSlots.map(slot => {
                                                                        // If it's today (Feb 14 same day order), disable if start time passed
                                                                        const isDisabled = isToday() && currentHour >= slot.startHour;
                                                                        return (
                                                                            <option key={slot.label} value={slot.label} disabled={isDisabled}>
                                                                                {slot.label} {isDisabled ? '(No disponible)' : ''}
                                                                            </option>
                                                                        );
                                                                    });
                                                                }

                                                                // Standard Logic
                                                                const startHour = 9; // 9:00 AM
                                                                const endHour = 15;  // 3:00 PM (Last slot 3-8 PM)

                                                                const today = new Date();
                                                                const isToday = () => {
                                                                    if (!selectedDate) return false;
                                                                    // Parse "YYYY-MM-DD" safely
                                                                    const [year, month, day] = selectedDate.split('-').map(Number);
                                                                    return today.getFullYear() === year &&
                                                                        today.getMonth() + 1 === month &&
                                                                        today.getDate() === day;
                                                                };

                                                                const currentHour = today.getHours();

                                                                for (let h = startHour; h <= endHour; h++) {
                                                                    // Simple formatting
                                                                    const formatTime = (hour: number) => {
                                                                        const period = hour >= 12 ? 'PM' : 'AM';
                                                                        const displayHour = hour > 12 ? hour - 12 : hour;
                                                                        return `${displayHour}:00 ${period}`;
                                                                    };

                                                                    // Logic: If today, slot must start STRICTLY AFTER current hour
                                                                    // Example: It's 12:05. currentHour = 12.
                                                                    // Can I book 12-5? No, it's already started/passed. 
                                                                    // Can I book 1-6? Yes.
                                                                    // So condition: h > currentHour
                                                                    if (isToday() && h <= currentHour) {
                                                                        continue;
                                                                    }

                                                                    const label = `${formatTime(h)} - ${formatTime(h + 5)}`;
                                                                    slots.push(
                                                                        <option key={h} value={label}>
                                                                            {label}
                                                                        </option>
                                                                    );
                                                                }

                                                                if (slots.length === 0 && isToday()) {
                                                                    return <option value="" disabled>Ya no hay horarios disponibles para hoy</option>;
                                                                }

                                                                return slots;
                                                            })()}
                                                        </select>
                                                        <Icon name="expand_more" size={24} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-[#282b39]">
                                            <Link to="/product/1" className="text-[#9da1b9] hover:text-white text-sm font-bold flex items-center gap-2 transition-colors">
                                                <Icon name="arrow_back" size={18} />Volver
                                            </Link>
                                            <button onClick={handleNext} className="w-full md:w-auto bg-primary hover:bg-blue-700 text-white font-bold h-12 px-8 rounded-lg transition-colors flex items-center justify-center gap-2">
                                                Continuar a Mensaje <Icon name="arrow_forward" size={18} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="lg:col-span-4">
                            <div className="sticky top-24 flex flex-col gap-6">
                                <div className="bg-surface-dark rounded-xl p-6 shadow-xl border border-[#282b39]">
                                    <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">Resumen</h3>
                                    <div className="flex flex-col gap-4 mb-6">
                                        {(checkoutData.items || []).map((item: any, idx: number) => (
                                            <div key={idx} className="flex gap-4">
                                                <div className="size-20 rounded-lg bg-cover bg-center shrink-0 border border-[#282b39] overflow-hidden">
                                                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex flex-col justify-center py-0.5">
                                                    <div><p className="text-white text-sm font-bold leading-tight">{item.product.name}</p></div>
                                                    <p className="text-gray-400 text-xs">{item.size.name} x {item.quantity}</p>
                                                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {item.selectedAddons.map((addon: any, i: number) => (
                                                                <span key={i} className="text-[10px] bg-[#282b39] text-gray-300 px-1.5 py-0.5 rounded">
                                                                    + {addon.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <p className="text-white font-bold text-sm">${(((getEffectivePrice ? getEffectivePrice(item.size, checkoutData.shipping.date) : item.size.price) + (item.selectedAddons?.reduce((sum: number, a: any) => sum + a.price, 0) || 0)) * item.quantity).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center mb-6 pt-4 border-t border-[#282b39]">
                                        <span className="text-white font-bold text-lg">Total</span>
                                        <span className="text-primary font-bold text-xl">
                                            ${(checkoutData.items || []).reduce((sum: number, item: any) => sum + (((getEffectivePrice ? getEffectivePrice(item.size, checkoutData.shipping.date) : item.size.price) + (item.selectedAddons?.reduce((s: number, a: any) => s + a.price, 0) || 0)) * item.quantity), 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutShipping;