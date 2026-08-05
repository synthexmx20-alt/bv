import { createRetiredFlowHandler } from '../_shared/retired-flow.ts';

Deno.serve(createRetiredFlowHandler({
  code: 'CHECKOUT_FLOW_RETIRED',
  message: 'Este flujo de pago fue reemplazado. Actualiza la página e intenta de nuevo.',
}));
