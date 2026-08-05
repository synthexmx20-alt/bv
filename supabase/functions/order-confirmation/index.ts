
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ADMIN_EMAIL = "pedidos@bluevelvetcuu.com";

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  product_name: string;
  quantity: number;
  size: string;
  addons?: any[];
  price: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 0. Environment Check
    if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
    if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");

    // 1. Parsing
    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error("Failed to parse JSON body: " + e.message);
    }

    const { orderId } = body;

    if (!orderId) {
      throw new Error("Missing orderId in body");
    }

    // 2. Fetch Order Details
    // Using simple query first to test connection
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          product_name,
          quantity,
          quantity,
          size,
          addons,
          price
        ),
        profiles:user_id (
          full_name
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError) {
      console.error("DB Error:", orderError);
      throw new Error("Database error fetching order: " + JSON.stringify(orderError));
    }
    if (!order) {
      throw new Error("Order not found with ID: " + orderId);
    }

    const { shipping_details, order_items, total_amount, id, user_id } = order;

    // 3. Get User Email
    // Try getting from profile relation first if available
    let customerEmail = order.profiles?.email;
    let customerName = order.profiles?.full_name || shipping_details?.fullName || "Cliente";

    if (!customerEmail) {
      // Fallback to Auth Admin
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
      if (userError || !userData.user) {
        console.error("Auth Error:", userError);
        throw new Error("Could not find user email in Auth: " + (userError?.message || "User not found"));
      }
      customerEmail = userData.user.email;
    }

    if (!customerEmail) throw new Error("No email found for user");

    // 2. Build Email HTML
    const itemsHtml = order_items.map((item: OrderItem) => {
      const addonsHtml = item.addons && item.addons.length > 0
        ? `<div style="margin-top: 4px; padding-left: 8px; border-left: 2px solid #eee; font-size: 12px; color: #666;">
             ${item.addons.map((a: any) => `<div>+ ${a.name} ($${a.price})</div>`).join('')}
           </div>`
        : '';

      return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${item.product_name}</strong><br/>
          <span style="color: #666; font-size: 14px;">${item.size}</span>
          ${addonsHtml}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${item.price}</td>
      </tr>
    `}).join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #000; margin: 0; }
          .details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .footer { text-align: center; font-size: 12px; color: #888; margin-top: 40px; }
          .btn { background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>¡Gracias por tu compra, ${customerName}!</h2>
            <p>Tu pedido <strong>#${id.slice(0, 8)}</strong> ha sido recibido.</p>
          </div>

          <div class="details">
            <h3 style="margin-top: 0;">Detalles de Entrega</h3>
            <p>
              <strong>Dirección:</strong> ${shipping_details.street}, ${shipping_details.colonia}<br/>
              <strong>Recibe:</strong> ${shipping_details.fullName}<br/>
              <strong>Teléfono:</strong> ${shipping_details.phone}<br/>
              <strong>Recibe:</strong> ${shipping_details.fullName}<br/>
              <strong>Teléfono:</strong> ${shipping_details.phone}<br/>
              <strong>Fecha:</strong> ${shipping_details.date} (${shipping_details.timeSlot})<br/>
              <strong>Pago:</strong> ${shipping_details.paymentMethod === 'spei' ? 'Transferencia Bancaria' : 'Tarjeta de Crédito/Débito'}
            </p>
          </div>

          <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
            <thead>
              <tr style="background: #eee;">
                <th style="padding: 12px; text-align: left;">Producto</th>
                <th style="padding: 12px;">Cant.</th>
                <th style="padding: 12px; text-align: right;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
               <tr>
                <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold;">Total:</td>
                <td style="padding: 12px; text-align: right; font-weight: bold;">$${total_amount}</td>
               </tr>
            </tfoot>
          </table>

          <div style="text-align: center;">
            <a href="https://bluevelvetcuu.com/#/account/orders" class="btn">Ver mi pedido</a>
          </div>

          <div class="footer">
            <p>Si tienes alguna duda, contáctanos respondiendo a este correo.</p>
            <p>Blue Velvet Florería - Chihuahua, Chih.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 3. Send Email via Resend (To Customer)
    const sendScan = async (to: string, subject: string) => {
      return await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Blue Velvet <pedidos@bluevelvetcuu.com>",
          to: [to],
          subject: subject,
          html: emailHtml,
        }),
      });
    };

    // Send to Customer
    const resCustomer = await sendScan(customerEmail, `Confirmación de Pedido #${id.slice(0, 8)} - Blue Velvet`);

    // Send to Admin
    const resAdmin = await sendScan(ADMIN_EMAIL, `[NUEVO PEDIDO] #${id.slice(0, 8)} - ${customerName}`);

    const data = await resCustomer.json();

    if (!resCustomer.ok) {
      console.error("Resend API Error (Customer):", data);
      throw new Error("Resend API failed: " + JSON.stringify(data));
    }

    return new Response(JSON.stringify({ success: true, allSent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Function Error:", error);
    // RETURN 200 even on error to bypass CLIENT-SIDE generic exceptions, so we can see the message
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
