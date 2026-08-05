const ALLOWED_ORIGINS = new Set([
  'https://bluevelvetcuu.com',
  'https://www.bluevelvetcuu.com',
  'http://localhost:3000',
  'http://localhost:4173',
]);

const PAGES_ORIGIN_PATTERN = /^https:\/\/(?:[a-z0-9-]+\.)?bluevelvet-1zu\.pages\.dev$/;

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function isAllowedOrigin(origin: string | null): boolean {
  return Boolean(origin && (ALLOWED_ORIGINS.has(origin) || PAGES_ORIGIN_PATTERN.test(origin)));
}

export function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin as string : 'null',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
}

export function jsonResponse(origin: string | null, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

export function getBearerToken(request: Request): string {
  const authorization = request.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) {
    throw new HttpError('Falta una autorización válida.', 401, 'AUTH_REQUIRED');
  }
  return match[1];
}

export async function readJsonBody(request: Request, maxBytes = 50_000): Promise<unknown> {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new HttpError('La solicitud es demasiado grande.', 413, 'REQUEST_TOO_LARGE');
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new HttpError('La solicitud es demasiado grande.', 413, 'REQUEST_TOO_LARGE');
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError('El cuerpo JSON no es válido.', 400, 'INVALID_JSON');
  }
}
