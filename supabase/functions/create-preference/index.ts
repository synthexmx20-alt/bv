import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { MercadoPagoConfig, Preference } from 'npm:mercadopago'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { orderId, items, user, origin, discount } = await req.json()
        const accessToken = Deno.env.get('MP_ACCESS_TOKEN')

        if (!accessToken) {
            throw new Error('MP_ACCESS_TOKEN not found in environment variables')
        }

        const client = new MercadoPagoConfig({ accessToken: accessToken });
        const preference = new Preference(client);

        const preferenceItems = items.map((item: any) => ({
            id: item.product.id,
            title: `${item.product.name} - ${item.size.name}`,
            quantity: Number(item.quantity),
            unit_price: Number(item.size.price),
            currency_id: 'MXN',
        }));

        if (discount && Number(discount) > 0) {
            preferenceItems.push({
                id: 'discount',
                title: 'Descuento / Cupón',
                quantity: 1,
                unit_price: -Number(discount),
                currency_id: 'MXN'
            });
        }

        const body = {
            items: preferenceItems,
            payer: {
                email: user.email,
                name: user.name ? user.name.split(' ')[0] : undefined,
                surname: user.name ? user.name.split(' ').slice(1).join(' ') : undefined,
            },
            back_urls: {
                success: `${origin}/#/checkout/callback`,
                failure: `${origin}/#/checkout/callback`,
                pending: `${origin}/#/checkout/callback`,
            },
            // auto_return: 'approved', // Disabled to avoid validation errors on localhost/sandbox
            external_reference: orderId,
            notification_url: 'https://zbzywcjkiyhodecpytnt.supabase.co/functions/v1/mercadopago-webhook'
        };

        const result = await preference.create({ body });

        return new Response(
            JSON.stringify({
                preferenceId: result.id,
                initPoint: result.init_point
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error("Error creating preference:", error);
        return new Response(
            JSON.stringify({
                error: error.message || 'Unknown error occurred',
                details: error
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    }
})
