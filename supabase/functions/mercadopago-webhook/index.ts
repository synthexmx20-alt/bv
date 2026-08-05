import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { MercadoPagoConfig, Payment } from 'npm:mercadopago'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!accessToken || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    // Init Supabase Admin Client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Init Mercado Pago
    const client = new MercadoPagoConfig({ accessToken: accessToken });
    const payment = new Payment(client);

    // Parse the webhook body
    const body = await req.json().catch(() => ({}));

    // Mercado Pago creates a payment notification with { action: 'payment.created', type: 'payment', data: { id: '...' } }
    // Or sometimes checks via query params.
    // We prioritize the body.
    console.log('Webhook Body:', JSON.stringify(body));

    const eventType = body.type || body.topic;
    const paymentId = body.data?.id || body.id;

    if (eventType === 'payment' && paymentId) {
      console.log(`Processing payment checking for ID: ${paymentId}`);

      // 1. Verify exact status with Mercado Pago
      const paymentData = await payment.get({ id: paymentId });
      console.log(`Payment Status from API: ${paymentData.status} (Order: ${paymentData.external_reference})`);

      // 2. If approved, update Supabase
      if (paymentData.status === 'approved') {
        const orderId = paymentData.external_reference;

        if (orderId) {
          const { error } = await supabase
            .from('orders')
            .update({
              status: 'confirmed',
              payment_id: String(paymentId)
            })
            .eq('id', orderId);

          if (error) {
            console.error('Error updating order:', error);
            // Return 500 to force Mercado Pago to retry later
            return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
          console.log('Order updated successfully');
        }
      }
    }

    // Always return 200 OK to Mercado Pago so they stop sending the same notification
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Return 400 for bad request logic
    })
  }
})
