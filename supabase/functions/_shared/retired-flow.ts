import {
  corsHeaders,
  getBearerToken,
  HttpError,
  isAllowedOrigin,
  jsonResponse,
} from './http.ts';

type RetiredFlowOptions = {
  code: string;
  message: string;
  authenticate: (token: string) => Promise<boolean>;
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

    let token: string;
    try {
      token = getBearerToken(request);
    } catch (error) {
      if (error instanceof HttpError) {
        return jsonResponse(origin, error.status, { error: error.message, code: error.code });
      }
      return jsonResponse(origin, 401, {
        error: 'Falta una autorización válida.',
        code: 'AUTH_REQUIRED',
      });
    }

    try {
      if (!(await options.authenticate(token))) {
        return jsonResponse(origin, 401, {
          error: 'Tu sesión expiró. Inicia sesión de nuevo.',
          code: 'AUTH_INVALID',
        });
      }
    } catch {
      return jsonResponse(origin, 503, {
        error: 'El servicio de autenticación no está disponible.',
        code: 'AUTH_UNAVAILABLE',
      });
    }

    return jsonResponse(origin, 410, {
      error: options.message,
      code: options.code,
    });
  };
}
