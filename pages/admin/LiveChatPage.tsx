import React, { useState, useEffect, useRef } from 'react';
import { supabaseCRM as supabase } from '../../lib/supabase-crm';

interface Customer {
    id: string;
    phone_number: string;
    name: string | null;
    tags: string[];
    created_at: string;
    last_message?: {
        content: string;
        media_url?: string;
        created_at: string;
        direction: 'inbound' | 'outbound';
    };
}

interface Message {
    id: string;
    customer_id: string;
    direction: 'inbound' | 'outbound';
    status: string;
    type: string;
    content: string;
    media_url?: string;
    created_at: string;
}

interface Order {
    id: string;
    customer_id: string;
    status: string;
    product_details: any;
    total_amount: number;
    delivery_date: string;
    delivery_time_window: string;
    recipient_name: string;
    delivery_address: string;
    card_message: string;
    created_at: string;
}

export default function LiveChatPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeOrders, setActiveOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isBotGlobalEnabled, setIsBotGlobalEnabled] = useState(true);
    const [isTogglingGlobalBot, setIsTogglingGlobalBot] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const orderProductRef = useRef<HTMLInputElement>(null);
    const orderAmountRef = useRef<HTMLInputElement>(null);
    const orderRecipientRef = useRef<HTMLInputElement>(null);
    const orderAddressRef = useRef<HTMLInputElement>(null);
    const orderDateRef = useRef<HTMLInputElement>(null);
    const orderTimeRef = useRef<HTMLInputElement>(null);
    const orderNoteRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 0. Fetch global bot state on mount
    useEffect(() => {
        const fetchGlobalBotState = async () => {
            const { data } = await supabase
                .from('crm_settings')
                .select('value')
                .eq('key', 'bot_global_enabled')
                .single();
            if (data) setIsBotGlobalEnabled(data.value === 'true');
        };
        fetchGlobalBotState();
    }, []);

    // 1. Fetch all customers and their latest message on mount
    useEffect(() => {
        const fetchCustomers = async () => {
            setIsLoading(true);

            // Fetch customers
            const { data: customersData, error: customersError } = await supabase
                .from('customers')
                .select('*')
                .order('created_at', { ascending: false });

            if (!customersError && customersData) {
                // Fetch the latest message for all these customers
                // For a highly optimized app this would be a DB view, but doing it clientside for now is fine
                const enhancedCustomers = await Promise.all(customersData.map(async (customer) => {
                    const { data: msgData } = await supabase
                        .from('messages')
                        .select('content, media_url, created_at, direction')
                        .eq('customer_id', customer.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    return {
                        ...customer,
                        last_message: msgData || undefined
                    } as Customer;
                }));

                // Sort by last message time, falling back to customer created time
                enhancedCustomers.sort((a, b) => {
                    const timeA = new Date(a.last_message?.created_at || a.created_at).getTime();
                    const timeB = new Date(b.last_message?.created_at || b.created_at).getTime();
                    return timeB - timeA;
                });

                setCustomers(enhancedCustomers);
            } else {
                console.error("Error fetching customers:", customersError);
            }
            setIsLoading(false);
        };

        fetchCustomers();

        // Subscribe to new customers
        const customerChannel = supabase.channel('public:customers')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'customers' },
                (payload) => {
                    setCustomers((prev) => [payload.new as Customer, ...prev]);
                }
            )
            .subscribe();

        // Subscribe to ALL new messages to update the customer preview list
        const allMessagesChannel = supabase.channel('public:all_messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const newMsg = payload.new as Message;
                    setCustomers((prevCustomers) => {
                        const updated = prevCustomers.map(c => {
                            if (c.id === newMsg.customer_id) {
                                return {
                                    ...c,
                                    last_message: {
                                        content: newMsg.content,
                                        media_url: newMsg.media_url,
                                        created_at: newMsg.created_at,
                                        direction: newMsg.direction
                                    }
                                };
                            }
                            return c;
                        });

                        // Re-sort the array so the active chat jumps to the top
                        return updated.sort((a, b) => {
                            const timeA = new Date(a.last_message?.created_at || a.created_at).getTime();
                            const timeB = new Date(b.last_message?.created_at || b.created_at).getTime();
                            return timeB - timeA;
                        });
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(customerChannel);
            supabase.removeChannel(allMessagesChannel);
        };
    }, []);

    // 2. Fetch messages and orders when a customer is selected
    useEffect(() => {
        if (!activeCustomer) return;

        const fetchDetails = async () => {
            // Fetch Messages
            const { data: msgData, error: msgError } = await supabase
                .from('messages')
                .select('*')
                .eq('customer_id', activeCustomer.id)
                .order('created_at', { ascending: true });

            if (!msgError && msgData) {
                setMessages(msgData as Message[]);
                scrollToBottom();
            }

            // Fetch Orders
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('customer_id', activeCustomer.id)
                .order('created_at', { ascending: false });

            if (!orderError && orderData) {
                setActiveOrders(orderData as Order[]);
            }
        };

        fetchDetails();

        // Real-time Messages for this customer
        const msgChannel = supabase.channel(`public:messages:${activeCustomer.id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `customer_id=eq.${activeCustomer.id}` },
                (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages((prev) => {
                        // Evitar mensajes duplicados (optimistic vs realtime)
                        if (prev.some(m => m.id === newMsg.id)) {
                            return prev.map(m => m.id === newMsg.id ? newMsg : m);
                        }
                        return [...prev, newMsg];
                    });
                    scrollToBottom();
                }
            )
            .subscribe();

        // Real-time Orders for this customer
        const orderChannel = supabase.channel(`public:orders:${activeCustomer.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${activeCustomer.id}` },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setActiveOrders((prev) => [payload.new as Order, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        const newOrder = payload.new as Order;
                        setActiveOrders((prev) => prev.map(o => o.id === newOrder.id ? newOrder : o));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(msgChannel);
            supabase.removeChannel(orderChannel);
        };
    }, [activeCustomer]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const replyInputRef = useRef<HTMLTextAreaElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleSendMessage = async (e: React.FormEvent, mediaUrl?: string) => {
        if (e) e.preventDefault();
        const replyText = replyInputRef.current?.value || '';
        if ((!replyText.trim() && !mediaUrl) || !activeCustomer) return;

        const tempId = crypto.randomUUID();
        const newMessage = {
            id: tempId,
            customer_id: activeCustomer.id,
            direction: 'outbound',
            status: 'sent',
            type: mediaUrl ? 'media' : 'text',
            content: replyText || (mediaUrl ? '[IMAGEN O ARCHIVO ENVIADO]' : ''),
            media_url: mediaUrl || null
        };

        // UI Optimistic update
        setMessages((prev) => [...prev, { ...newMessage, created_at: new Date().toISOString() } as Message]);
        if (replyInputRef.current) replyInputRef.current.value = '';
        scrollToBottom();

        // Save to DB
        const { error } = await supabase.from('messages').insert([newMessage]);
        if (error) {
            console.error("Failed to send message:", error);
        }

        // TRIGGER N8N TO SEND THE WHATSAPP MESSAGE
        const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
        if (webhookUrl && !webhookUrl.includes('<AQUI_PONES_TU_IP>')) {
            try {
                // Ensure Mexican numbers drop the '1' to avoid WhatsApp API errors for proactive messages
                let cleanPhone = activeCustomer.phone_number;
                if (cleanPhone.startsWith('521') && cleanPhone.length === 13) {
                    cleanPhone = cleanPhone.replace(/^521/, '52');
                }

                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: cleanPhone,
                        message: newMessage.content,
                        mediaUrl: mediaUrl || null
                    })
                });
            } catch (err) {
                console.error("Error Triggering N8N Webhook:", err);
            }
        } else {
            console.warn("N8N Webhook URL not configured in .env.local, message only saved to CRM.");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeCustomer) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_outbound.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload the file to the whatsapp_media bucket
            const { error: uploadError } = await supabase.storage
                .from('whatsapp_media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('whatsapp_media')
                .getPublicUrl(filePath);

            // Send message with the public URL
            await handleSendMessage(null as any, publicUrl);

        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Hubo un error al subir el archivo.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const formatOrderCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    const formatChatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) + ', ' + date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    };

    const handleToggleBot = async () => {
        if (!activeCustomer) return;

        const isHumanMode = activeCustomer.tags?.includes('human_mode');
        const newTags = isHumanMode
            ? (activeCustomer.tags || []).filter(t => t !== 'human_mode')
            : [...(activeCustomer.tags || []), 'human_mode'];

        // Optimistic update
        setActiveCustomer({ ...activeCustomer, tags: newTags });
        setCustomers(prev => prev.map(c => c.id === activeCustomer.id ? { ...c, tags: newTags } : c));

        // Save to Supabase
        const { error } = await supabase
            .from('customers')
            .update({ tags: newTags })
            .eq('id', activeCustomer.id);

        if (error) {
            console.error("Error updating bot status:", error);
            // Revert on error
            setActiveCustomer(activeCustomer);
        }
    };

    const handleToggleOrderMark = async () => {
        if (!activeCustomer) return;

        const hasOrder = activeCustomer.tags?.includes('tiene_pedido');
        const newTags = hasOrder
            ? (activeCustomer.tags || []).filter(t => t !== 'tiene_pedido')
            : [...(activeCustomer.tags || []), 'tiene_pedido'];

        setActiveCustomer({ ...activeCustomer, tags: newTags });
        setCustomers(prev => prev.map(c => c.id === activeCustomer.id ? { ...c, tags: newTags } : c));

        await supabase
            .from('customers')
            .update({ tags: newTags })
            .eq('id', activeCustomer.id);
    };

    const handleSaveOrder = async () => {
        if (!activeCustomer || !orderAmountRef.current?.value) return;
        setIsSavingOrder(true);
        try {
            const product = orderProductRef.current?.value || '';
            const recipient = orderRecipientRef.current?.value || '';
            const address = orderAddressRef.current?.value || '';
            const date = orderDateRef.current?.value || '';
            const timeSlot = orderTimeRef.current?.value || '';

            const { data: insertedOrder, error: insertError } = await supabase.from('orders').insert({
                customer_id: activeCustomer.id,
                status: 'pending',
                total_amount: parseFloat(orderAmountRef.current.value),
                product_details: product ? { descripcion: product } : null,
                recipient_name: recipient || null,
                delivery_address: address || null,
                delivery_date: date || null,
                delivery_time_window: timeSlot || null,
                shipping_details: {
                    fullName: recipient,
                    street: address,
                    date: date,
                    timeSlot: timeSlot,
                },
                card_message: orderNoteRef.current?.value || null,
                message_details: orderNoteRef.current?.value ? { note: orderNoteRef.current.value } : null,
            }).select('id').single();
            if (insertError) throw insertError;

            // UPDATE to 'confirmed' — this fires N8N's UPDATE trigger → Meta CAPI
            const { error: updateError } = await supabase.from('orders')
                .update({ status: 'confirmed' })
                .eq('id', insertedOrder.id);
            if (updateError) throw updateError;

            // Auto-mark chat as has order
            if (!activeCustomer.tags?.includes('tiene_pedido')) {
                const newTags = [...(activeCustomer.tags || []), 'tiene_pedido'];
                await supabase.from('customers').update({ tags: newTags }).eq('id', activeCustomer.id);
                setActiveCustomer({ ...activeCustomer, tags: newTags });
                setCustomers(prev => prev.map(c => c.id === activeCustomer.id ? { ...c, tags: newTags } : c));
            }

            // Llamar webhook de N8N directamente → Meta CAPI (más confiable que Postgres Trigger)
            try {
                await fetch('https://api-bluevelvet.cloud/webhook/manual-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'confirmed',
                        id: insertedOrder.id,
                        customer_id: activeCustomer.id,
                        total_amount: parseFloat(orderAmountRef.current!.value),
                        phone_number: activeCustomer.phone_number,
                        name: activeCustomer.name,
                    }),
                });
            } catch (webhookErr) {
                console.warn('Webhook Meta CAPI falló (pedido guardado igual):', webhookErr);
            }

            setShowOrderModal(false);
            alert('✅ Pedido registrado y señal enviada a Meta.');
        } catch (err) {
            console.error('Error saving order:', err);
            alert('❌ Error al registrar el pedido.');
        } finally {
            setIsSavingOrder(false);
        }
    };

    const handleToggleGlobalBot = async () => {
        setIsTogglingGlobalBot(true);
        const newEnabled = !isBotGlobalEnabled;

        try {
            // 1. Update the global setting flag
            await supabase.from('crm_settings')
                .upsert({ key: 'bot_global_enabled', value: String(newEnabled), updated_at: new Date().toISOString() });

            if (!newEnabled) {
                // 2a. Turning OFF: add human_mode to all existing customers
                const { data: allCustomers } = await supabase.from('customers').select('id, tags');
                if (allCustomers) {
                    await Promise.all(allCustomers.map(c => {
                        const tags = c.tags || [];
                        if (!tags.includes('human_mode')) {
                            return supabase.from('customers').update({ tags: [...tags, 'human_mode'] }).eq('id', c.id);
                        }
                    }));
                }
                // Update local UI
                setCustomers(prev => prev.map(c => ({
                    ...c,
                    tags: c.tags?.includes('human_mode') ? c.tags : [...(c.tags || []), 'human_mode']
                })));
                if (activeCustomer) {
                    setActiveCustomer(prev => prev ? { ...prev, tags: [...(prev.tags || []), 'human_mode'] } : prev);
                }
            } else {
                // 2b. Turning ON: remove human_mode from all customers
                const { data: allCustomers } = await supabase.from('customers').select('id, tags');
                if (allCustomers) {
                    await Promise.all(allCustomers.map(c => {
                        if (c.tags?.includes('human_mode')) {
                            return supabase.from('customers').update({ tags: (c.tags || []).filter((t: string) => t !== 'human_mode') }).eq('id', c.id);
                        }
                    }));
                }
                // Update local UI
                setCustomers(prev => prev.map(c => ({
                    ...c,
                    tags: (c.tags || []).filter(t => t !== 'human_mode')
                })));
                if (activeCustomer) {
                    setActiveCustomer(prev => prev ? { ...prev, tags: (prev.tags || []).filter(t => t !== 'human_mode') } : prev);
                }
            }

            setIsBotGlobalEnabled(newEnabled);
        } catch (err) {
            console.error('Error toggling global bot:', err);
        } finally {
            setIsTogglingGlobalBot(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'paid': 'bg-blue-100 text-blue-800',
            'preparing': 'bg-orange-100 text-orange-800',
            'delivered': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <>
        <div className="flex h-[calc(100vh-100px)] border rounded-xl overflow-hidden bg-white shadow-xl font-sans">

            {/* LEFT SIDEBAR: Customer List */}
            <div className="w-1/4 border-r bg-gray-50 flex flex-col">
                <div className="p-4 border-b bg-white shadow-sm z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 tracking-tight">CRM Inbox</h2>
                            <p className="text-xs text-gray-500 mt-1">Ventas & Consultas</p>
                        </div>
                        <button
                            onClick={handleToggleGlobalBot}
                            disabled={isTogglingGlobalBot}
                            title={isBotGlobalEnabled ? 'Melissa activa en todos los chats. Click para apagar.' : 'Melissa apagada en todos los chats. Click para activar.'}
                            className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full border transition-all ${
                                isTogglingGlobalBot ? 'opacity-50 cursor-wait' :
                                isBotGlobalEnabled
                                    ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                                    : 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${isBotGlobalEnabled ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                            {isTogglingGlobalBot ? '...' : isBotGlobalEnabled ? 'Melissa ON' : 'Melissa OFF'}
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-400">Cargando clientes...</div>
                    ) : customers.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No hay clientes aún.</div>
                    ) : (
                        customers.map(customer => (
                            <div
                                key={customer.id}
                                onClick={() => setActiveCustomer(customer)}
                                className={`p-4 border-b cursor-pointer hover:bg-gray-100 transition-colors ${
                                    activeCustomer?.id === customer.id
                                        ? 'bg-blue-50 border-l-4 border-l-blue-600'
                                        : customer.tags?.includes('tiene_pedido')
                                            ? 'border-l-4 border-l-red-500 bg-red-50 ring-1 ring-inset ring-red-300'
                                            : 'border-l-4 border-l-transparent'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="font-semibold text-gray-900 truncate pr-2 flex items-center gap-1">
                                        {customer.tags?.includes('tiene_pedido') && (
                                            <span title="Con pedido" className="text-sm">🛍️</span>
                                        )}
                                        {customer.name || customer.phone_number}
                                    </div>
                                    <div className="text-[10px] text-gray-400 whitespace-nowrap">
                                        {customer.last_message ? formatChatDate(customer.last_message.created_at) : new Date(customer.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                    </div>
                                </div>
                                {customer.name && (
                                    <div className="text-[11px] text-gray-400 mt-0.5">{customer.phone_number}</div>
                                )}

                                {/* Last Message Preview */}
                                <div className="mt-1.5 flex items-center gap-1 opacity-80">
                                    {customer.last_message && (
                                        <div className="flex-1 w-0">
                                            <p className={`text-[12px] truncate ${customer.last_message.direction === 'inbound' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                                {customer.last_message.direction === 'outbound' && <span className="mr-1">✓✓</span>}
                                                {customer.last_message.media_url ? '📸 [Imagen]' : (customer.last_message.content === 'undefined' ? '📸 [Imagen Recibida]' : customer.last_message.content)}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {customer.tags && customer.tags.filter(t => t !== 'tiene_pedido').length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {customer.tags.filter(t => t !== 'tiene_pedido').map(tag => (
                                            <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded-sm ${tag === 'human_mode' ? 'bg-orange-100 text-orange-700 font-bold' : 'bg-slate-200 text-slate-600'}`}>
                                                {tag === 'human_mode' ? 'PAUSADO' : tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* MIDDLE: Chat Window */}
            <div className="w-2/4 flex flex-col bg-[#efeae2] border-r relative">
                {/* Decorative WhatsApp-like Background Pattern */}
                <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'url("https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-new-theme-whatsapp.jpg")', backgroundSize: 'cover' }}></div>

                {activeCustomer ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 bg-white shadow-sm z-10 flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg mr-3">
                                    {activeCustomer.name ? activeCustomer.name.charAt(0).toUpperCase() : '#'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{activeCustomer.name || activeCustomer.phone_number}</h3>
                                    <p className="text-[11px] text-gray-500">ID: {activeCustomer.id.split('-')[0]}</p>
                                </div>
                            </div>

                            {/* Register Order Button */}
                            <button
                                onClick={() => setShowOrderModal(true)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-bold bg-blue-600 border-blue-600 text-white hover:bg-blue-700 transition-colors"
                                title="Registrar pedido y enviar señal a Meta"
                            >
                                + Registrar Pedido
                            </button>

                            {/* Order Mark Button */}
                            <button
                                onClick={handleToggleOrderMark}
                                className={`flex items-center px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${
                                    activeCustomer.tags?.includes('tiene_pedido')
                                        ? 'bg-emerald-100 border-emerald-400 text-emerald-700 hover:bg-emerald-200'
                                        : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200'
                                }`}
                                title={activeCustomer.tags?.includes('tiene_pedido') ? 'Quitar marca de pedido' : 'Marcar como con pedido'}
                            >
                                🛍️ {activeCustomer.tags?.includes('tiene_pedido') ? 'Con Pedido' : 'Sin Pedido'}
                            </button>

                            {/* Bot Toggle Switch */}
                            <button
                                onClick={handleToggleBot}
                                className={`flex items-center px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${activeCustomer.tags?.includes('human_mode')
                                    ? 'bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200'
                                    : 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
                                    }`}
                                title={activeCustomer.tags?.includes('human_mode') ? "Bot Pausado. Haz clic para reactivarlo." : "Bot Activo. Haz clic para pausarlo."}
                            >
                                <span className={`w-2 h-2 rounded-full mr-2 ${activeCustomer.tags?.includes('human_mode') ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
                                {activeCustomer.tags?.includes('human_mode') ? 'Atención Humana (Bot Pausado)' : 'Bot Activo (Melissa)'}
                            </button>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 z-10">
                            {messages.length === 0 ? (
                                <div className="text-center text-gray-500 text-sm mt-10 bg-white/60 mx-auto w-max px-4 py-2 rounded-lg">
                                    No hay mensajes registrados.
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-xl p-3 shadow-sm relative ${msg.direction === 'outbound' ? 'bg-[#dcf8c6] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                                            {msg.media_url && (
                                                <div className="mb-2">
                                                    <img src={msg.media_url} alt="Imagen enviada" className="max-w-full h-auto rounded-lg" style={{ maxHeight: '250px' }} />
                                                </div>
                                            )}
                                            {msg.content !== 'undefined' && <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                                            {msg.content === 'undefined' && !msg.media_url && <p className="text-[14px] leading-relaxed whitespace-pre-wrap italic text-gray-500">📸 [Imagen recibida en WhatsApp]</p>}
                                            <div className="flex justify-end items-center mt-1 space-x-1">
                                                <span className="text-[10px] text-gray-500">
                                                    {formatChatDate(msg.created_at)}
                                                </span>
                                                {msg.direction === 'outbound' && (
                                                    <span className="text-[10px] text-gray-400">
                                                        {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : '✓'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div className="p-4 bg-[#f0f2f5] z-10">
                            <form onSubmit={(e) => handleSendMessage(e)} className="flex space-x-2 bg-white p-2 rounded-full shadow-sm">
                                {/* Hidden File Input */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept="image/*,.pdf,.doc,.docx"
                                />
                                {/* Attachment Button */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-full disabled:opacity-50"
                                    title="Adjuntar archivo o imagen"
                                >
                                    {isUploading ? (
                                        <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                    )}
                                </button>

                                <textarea
                                    ref={replyInputRef}
                                    defaultValue=""
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const ta = e.currentTarget;
                                            const start = ta.selectionStart ?? ta.value.length;
                                            const end = ta.selectionEnd ?? ta.value.length;
                                            ta.value = ta.value.substring(0, start) + '\n' + ta.value.substring(end);
                                            ta.selectionStart = ta.selectionEnd = start + 1;
                                        }
                                    }}
                                    className="flex-1 px-4 py-2 bg-transparent focus:outline-none text-gray-800 disabled:opacity-50 resize-none self-center"
                                    placeholder="Escribe un mensaje al cliente..."
                                    disabled={isUploading}
                                />
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-full p-2 w-10 h-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 flex-col z-10">
                        <svg className="w-20 h-20 mb-6 opacity-30" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.03 2 11c0 2.87 1.48 5.43 3.8 7.07l-1.09 3.28a1 1 0 001.25 1.25l3.22-1.07A10.86 10.86 0 0012 20c5.52 0 10-4.03 10-9s-4.48-9-10-9zM7 12a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" /></svg>
                        <h3 className="text-xl font-medium text-gray-500">CRM unificado</h3>
                        <p className="mt-2 text-sm">Selecciona un cliente de la lista para ver su conversación y pedidos.</p>
                    </div>
                )}
            </div>

            {/* RIGHT SIDEBAR: Order Info */}
            <div className="w-1/4 bg-gray-50 flex flex-col overflow-y-auto">
                {activeCustomer ? (
                    <>
                        <div className="p-6 border-b bg-white">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Información del Cliente</h2>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-gray-500 mb-1">Nombre</p>
                                    <p className="font-medium text-gray-900">{activeCustomer.name || 'No registrado'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Teléfono</p>
                                    <p className="font-medium text-gray-900">{activeCustomer.phone_number}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-800">Pedidos Activos</h2>
                                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{activeOrders.length}</span>
                            </div>

                            {activeOrders.length === 0 ? (
                                <div className="text-sm text-gray-500 border-2 border-dashed border-gray-200 p-6 rounded-lg text-center bg-gray-50/50">
                                    Este cliente no tiene pedidos registrados en el sistema.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {activeOrders.map(order => (
                                        <div key={order.id} className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    {formatOrderCurrency(order.total_amount)}
                                                </span>
                                            </div>

                                            <div className="space-y-2 text-xs">
                                                <div className="flex">
                                                    <span className="text-gray-500 w-16">Para:</span>
                                                    <span className="font-medium text-gray-800 flex-1">{order.recipient_name || 'N/A'}</span>
                                                </div>
                                                <div className="flex">
                                                    <span className="text-gray-500 w-16">Fecha:</span>
                                                    <span className="font-medium text-gray-800 flex-1">{order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'N/A'}</span>
                                                </div>
                                                <div className="flex">
                                                    <span className="text-gray-500 w-16">Horario:</span>
                                                    <span className="font-medium text-gray-800 flex-1">{order.delivery_time_window || 'N/A'}</span>
                                                </div>
                                                <div className="flex pt-1 mt-2 border-t border-gray-100">
                                                    <span className="text-gray-500 w-16">Lugar:</span>
                                                    <span className="text-gray-700 flex-1 line-clamp-2" title={order.delivery_address}>{order.delivery_address || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center p-6 text-center text-gray-400 text-sm">
                        El perfil y los pedidos del cliente aparecerán aquí.
                    </div>
                )}
            </div>

        </div>

        {/* Manual Order Modal */}
        {showOrderModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                    <div className="p-6 border-b">
                        <h2 className="text-lg font-bold text-gray-800">📋 Registrar Pedido</h2>
                        <p className="text-sm text-gray-500 mt-1">Cliente: {activeCustomer?.name || activeCustomer?.phone_number}</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Monto Total (MXN) *</label>
                            <input type="number" placeholder="ej. 930" ref={orderAmountRef} defaultValue=""
                                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Producto / Descripción</label>
                            <input type="text" placeholder="ej. 5 girasoles con complemento floral" ref={orderProductRef} defaultValue=""
                                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Nombre de quien recibe</label>
                            <input type="text" placeholder="ej. Ana García" ref={orderRecipientRef} defaultValue=""
                                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Dirección de entrega</label>
                            <input type="text" placeholder="ej. Calle Nogal 123, Col. Centro" ref={orderAddressRef} defaultValue=""
                                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Fecha de entrega</label>
                                <input type="date" ref={orderDateRef} defaultValue=""
                                        className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Horario</label>
                                <input type="text" ref={orderTimeRef} defaultValue="" placeholder="ej. 10am - 2pm"
                                        className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Dedicatoria / Mensaje de regalo</label>
                            <textarea ref={orderNoteRef} defaultValue="" rows={3} placeholder="ej. Feliz cumpleaños, te quiero mucho ❤️"
                                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                        </div>
                    </div>
                    <div className="px-6 pb-6 flex gap-3">
                        <button onClick={() => setShowOrderModal(false)}
                            className="flex-1 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancelar
                        </button>
                        <button onClick={handleSaveOrder} disabled={isSavingOrder}
                            className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                            {isSavingOrder ? 'Guardando...' : '✅ Confirmar Pedido'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        </>
    );
}
