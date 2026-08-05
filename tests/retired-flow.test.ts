import { describe, expect, it } from 'vitest';
import { createRetiredFlowHandler } from '../supabase/functions/_shared/retired-flow';

const endpoint = 'https://example.supabase.co/functions/v1/create-preference';

describe('retired Edge Function flow', () => {
  const handler = createRetiredFlowHandler({
    code: 'CHECKOUT_FLOW_RETIRED',
    message: 'Este flujo de pago fue reemplazado. Actualiza la página e intenta de nuevo.',
  });

  it('returns 410 for the retired checkout endpoint', async () => {
    const response = await handler(new Request(endpoint, {
      method: 'POST',
      headers: { Origin: 'https://bluevelvetcuu.com' },
    }));

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({
      code: 'CHECKOUT_FLOW_RETIRED',
    });
  });

  it('keeps CORS preflight available for allowed storefront origins', async () => {
    const response = await handler(new Request(endpoint, {
      method: 'OPTIONS',
      headers: { Origin: 'https://phase0-cachefix.bluevelvet-1zu.pages.dev' },
    }));

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin'))
      .toBe('https://phase0-cachefix.bluevelvet-1zu.pages.dev');
  });

  it('rejects untrusted origins before returning retirement details', async () => {
    const response = await handler(new Request(endpoint, {
      method: 'POST',
      headers: { Origin: 'https://evil.example' },
    }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: 'ORIGIN_NOT_ALLOWED' });
  });
});
