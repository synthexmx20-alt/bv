import { createClient } from 'npm:@supabase/supabase-js@2.89.0';
import { createRetiredFlowHandler } from '../_shared/retired-flow.ts';

Deno.serve(createRetiredFlowHandler({
  code: 'CHECKOUT_FLOW_RETIRED',
  message: 'Este flujo de pago fue reemplazado. Actualiza la página e intenta de nuevo.',
  authenticate: async token => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !anonKey) {
      throw new Error('Supabase authentication is not configured');
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await authClient.auth.getUser(token);
    return !error && Boolean(data.user?.id);
  },
}));
