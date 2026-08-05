import React, { useState, useEffect } from 'react';
import { CheckoutContext } from './CheckoutContext';
import { CheckoutState, Product, ProductSize } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

export const CheckoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize state from localStorage if available
    const [checkoutData, setCheckoutData] = useState<CheckoutState>(() => {
        const savedData = localStorage.getItem('checkoutData');
        return savedData ? JSON.parse(savedData) : {
            shipping: { fullName: '', phone: '', street: '', colonia: '', reference: '', date: '', timeSlot: '' },
            message: { from: '', to: '', note: '', isAnonymous: false, withoutNote: false },
            shippingCost: 0,
            paymentMethod: 'card',
            items: []
        };
    });

    const { user } = useAuth();
    const [isInitialized, setIsInitialized] = useState(false);



    // 2. Sync with DB when User Logs In or Mounts
    useEffect(() => {
        if (!user) {
            setIsInitialized(true);
            return;
        }

        const syncCartWithDB = async () => {
            try {
                // Fetch DB Cart
                const { data: dbItems, error } = await supabase.from('cart_items').select('*');
                if (error) throw error;

                // Format DB items to match local state structure
                const formattedDbItems = dbItems.map((item: any) => ({
                    product: { id: item.product_id, ...item.product_data }, // Using stored product data or fetch?
                    // Note: Ideally we store basic storage data in DB, but for now we assume we might need to fetch full product?
                    // Actually, simple solution: We just sync the structure.
                    // But WAIT, our DB schema just has product_id. We need full Product object for UI.
                    // Complex approach: Fetch products.
                    // Simpler approach (Strategy B): We store the FULL product JSON in DB for now to avoid massive refactor.
                    // Let's modify the push to store full product context if possible, OR fetch fresh.
                    // Given constraints, I will fetch fresh product details if needed, but to match current architecture:
                    // I will Assume the DB 'size' and 'addons' columns are JSON.
                    // I need to fetch the actual PRODUCT details from 'products' table using the ID.

                    // REVISION: To make this robust, I'll do a join or separate fetch.
                    // Let's do a join in the select if RLS allows.
                    // supabase.from('cart_items').select('*, product:products(*)')
                }));

                // Real Fetch with Join
                const { data: fullDbItems, error: fetchError } = await supabase
                    .from('cart_items')
                    .select(`
                        id, quantity, size, addons,
                        product:products (*)
                    `);

                if (fetchError) throw fetchError;

                const parsedDbItems = fullDbItems.map((item: any) => ({
                    id: item.id,
                    product: item.product,
                    size: item.size, // stored as json
                    quantity: item.quantity,
                    selectedAddons: item.addons // stored as json
                }));

                // Merge Strategy: Combine Local (if any) and DB.
                // If local items exist and are different, we should probably add them to DB.
                const localItems = checkoutData.items || [];

                if (localItems.length > 0) {
                    // Push local items to DB (items without ID are considered new)

                    const newItemsToPush = localItems.filter(lItem => !lItem.id);
                    // Better logic: Only push items that don't have an ID or aren't in DB list.
                    // But if we just look at ID, what if user logged in with items that match DB content but have no ID?
                    // We should content-match to avoid duplicates.

                    const trulyNewItems = newItemsToPush.filter(newItem =>
                        !parsedDbItems.some(dbItem =>
                            dbItem.product.id === newItem.product.id &&
                            dbItem.size.name === newItem.size.name &&
                            JSON.stringify(dbItem.selectedAddons) === JSON.stringify(newItem.selectedAddons)
                        )
                    );

                    if (trulyNewItems.length > 0) {
                        const itemsPayload = trulyNewItems.map(item => ({
                            user_id: user.id,
                            product_id: item.product.id,
                            quantity: item.quantity,
                            size: item.size,
                            addons: item.selectedAddons || []
                        }));

                        await supabase.from('cart_items').insert(itemsPayload);

                        // Refetch after insert to get IDs
                        const { data: refreshedItems } = await supabase.from('cart_items').select('id, quantity, size, addons, product:products(*)');

                        if (refreshedItems) {
                            const finalItems = refreshedItems.map((item: any) => ({
                                id: item.id,
                                product: item.product,
                                size: item.size,
                                quantity: item.quantity,
                                selectedAddons: item.addons
                            }));
                            setCheckoutData(prev => ({ ...prev, items: finalItems }));
                        }
                    } else {
                        // If no new items, we can safely overwrite local with DB (which includes IDs)
                        setCheckoutData(prev => ({ ...prev, items: parsedDbItems }));
                    }
                } else {
                    // Local is empty, just load DB
                    if (parsedDbItems.length > 0) {
                        setCheckoutData(prev => ({ ...prev, items: parsedDbItems }));
                    }
                }

            } catch (err) {
                console.error("Error syncing cart:", err);
            } finally {
                setIsInitialized(true);
            }
        };

        syncCartWithDB();
    }, [user]);

    // 3. Save to LocalStorage (Always)
    useEffect(() => {
        localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
    }, [checkoutData]);

    // 4. Save to DB (Debounced or on Action)
    // We'll wrap the state updaters to validly update DB as well.

    const updateCheckoutData = (section: keyof CheckoutState, data: any) => {
        setCheckoutData(prev => ({
            ...prev,
            [section]: data
        }));
    };

    const addToCart = async (product: Product, size: ProductSize, quantity: number = 1, selectedAddons: any[] = []) => {
        // Update State (Optimistic)
        // We temporarily add without ID.
        setCheckoutData(prev => {
            const currentItems = prev.items || [];
            const getAddonsId = (addons: any[]) => addons.map(a => a.id).sort().join(',');

            const existingItemIndex = currentItems.findIndex(
                item => item.product.id === product.id &&
                    item.size.name === size.name &&
                    getAddonsId(item.selectedAddons || []) === getAddonsId(selectedAddons)
            );

            let newItems;
            if (existingItemIndex >= 0) {
                newItems = [...currentItems];
                newItems[existingItemIndex] = {
                    ...newItems[existingItemIndex],
                    quantity: newItems[existingItemIndex].quantity + quantity
                };
            } else {
                newItems = [...currentItems, { product, size, quantity, selectedAddons }];
            }

            return { ...prev, items: newItems };
        });

        // Update DB if logged in
        if (user) {
            try {
                // Check if exists using content match
                const { data: existingRows } = await supabase
                    .from('cart_items')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('product_id', product.id);

                const match = existingRows?.find(row =>
                    row.size.name === size.name &&
                    JSON.stringify(row.addons) === JSON.stringify(selectedAddons)
                );

                if (match) {
                    await supabase.from('cart_items').update({ quantity: match.quantity + quantity }).eq('id', match.id);
                    // Update local state with the ID if it was missing?
                    // Ideally we should sync back the ID.
                } else {
                    const { data: inserted } = await supabase.from('cart_items').insert({
                        user_id: user.id,
                        product_id: product.id,
                        quantity: quantity,
                        size: size,
                        addons: selectedAddons
                    }).select().single();

                    if (inserted) {
                        // Update local state to inject the new ID
                        setCheckoutData(prev => {
                            const currentItems = [...prev.items];
                            // Find the item we just added (last one or search)
                            // Safe bet: search again
                            const getAddonsId = (addons: any[]) => addons.map(a => a.id).sort().join(',');
                            const idx = currentItems.findIndex(
                                item => item.product.id === product.id &&
                                    item.size.name === size.name &&
                                    getAddonsId(item.selectedAddons || []) === getAddonsId(selectedAddons) &&
                                    !item.id // key: update the one without ID
                            );
                            if (idx >= 0) {
                                currentItems[idx] = { ...currentItems[idx], id: inserted.id };
                            }
                            return { ...prev, items: currentItems };
                        });
                    }
                }

            } catch (error) {
                console.error("Error saving to DB:", error);
            }
        }
    };

    const updateCartItemQuantity = async (index: number, quantity: number) => {
        const itemToUpdate = checkoutData.items?.[index];

        if (!itemToUpdate) return;

        setCheckoutData(prev => {
            const newItems = [...prev.items];

            if (quantity <= 0) {
                newItems.splice(index, 1);
            } else {
                newItems[index] = { ...newItems[index], quantity };
            }
            return { ...prev, items: newItems };
        });

        if (user) {
            // Delete/Update using ID if available (Robust)
            if (itemToUpdate.id) {
                if (quantity <= 0) {
                    await supabase.from('cart_items').delete().eq('id', itemToUpdate.id);
                } else {
                    await supabase.from('cart_items').update({ quantity }).eq('id', itemToUpdate.id);
                }
            } else {
                // Fallback for items without ID (Legacy)
                const { data: existingRows } = await supabase
                    .from('cart_items')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('product_id', itemToUpdate.product.id);

                const match = existingRows?.find(row =>
                    row.size.name === itemToUpdate.size.name &&
                    JSON.stringify(row.addons) === JSON.stringify(itemToUpdate.selectedAddons)
                );

                if (match) {
                    if (quantity <= 0) {
                        await supabase.from('cart_items').delete().eq('id', match.id);
                    } else {
                        await supabase.from('cart_items').update({ quantity }).eq('id', match.id);
                    }
                }
            }
        }
    };

    const clearCart = async () => {
        setCheckoutData(prev => ({ ...prev, items: [], discount: undefined }));
        if (user) {
            await supabase.from('cart_items').delete().eq('user_id', user.id);
        }
    };

    const getEffectivePrice = (size: ProductSize, date: string): number => {
        if (!date) return size.price;
        // Valentine's text range: Feb 9 - Feb 18
        const isSeasonal = date >= '2026-02-09' && date <= '2026-02-18';
        if (isSeasonal && size.seasonalPrice) {
            return size.seasonalPrice;
        }
        return size.price;
    };

    return (
        <CheckoutContext.Provider value={{ checkoutData, updateCheckoutData, addToCart, updateCartItemQuantity, clearCart, getEffectivePrice }}>
            {children}
        </CheckoutContext.Provider>
    );

};
