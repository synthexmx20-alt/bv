import {
  corsHeaders,
  isAllowedOrigin,
  jsonResponse,
} from './http.ts';

type RetiredFlowOptions = {
  code: string;
  message: string;
};

export function createRetiredFlowHandler(options: RetiredFlowOptions) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin');

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return jsonResponse(origin, 405, {
        error: 'Método no permitido.',
        code: 'METHOD_NOT_ALLOWED',
      });
    }

    if (!isAllowedOrigin(origin)) {
      return jsonResponse(origin, 403, {
        error: 'El origen de la solicitud no está autorizado.',
        code: 'ORIGIN_NOT_ALLOWED',
      });
    }

    return jsonResponse(origin, 410, {
      error: options.message,
      code: options.code,
    });
  };
}
