import { describe, expect, it } from 'vitest';
import {
  corsHeaders,
  getBearerToken,
  isAllowedOrigin,
} from '../supabase/functions/_shared/http';

describe('Edge Function HTTP boundary', () => {
  it.each([
    'https://bluevelvetcuu.com',
    'https://68459e41.bluevelvet-1zu.pages.dev',
    'http://localhost:3000',
  ])('allows %s', origin => {
    expect(isAllowedOrigin(origin)).toBe(true);
    expect(corsHeaders(origin)['Access-Control-Allow-Origin']).toBe(origin);
  });

  it('does not reflect an untrusted origin', () => {
    expect(isAllowedOrigin('https://evil.example')).toBe(false);
    expect(corsHeaders('https://evil.example')['Access-Control-Allow-Origin']).toBe('null');
  });

  it('extracts a bearer token', () => {
    const request = new Request('https://example.test', {
      headers: { Authorization: 'Bearer valid-token' },
    });
    expect(getBearerToken(request)).toBe('valid-token');
  });

  it('rejects malformed authorization', () => {
    const request = new Request('https://example.test', {
      headers: { Authorization: 'Basic invalid' },
    });
    expect(() => getBearerToken(request)).toThrow(/autorización/i);
  });
});
