const apiBaseUrl = window.__BUGBOARD_CONFIG__?.API_BASE_URL || 'http://localhost:3000/api';

export class ApiError extends Error {
  constructor(message, { status, code, details, requestId } = {}) {
    super(message); this.name = 'ApiError'; this.status = status; this.code = code;
    this.details = details || []; this.requestId = requestId;
  }
}

export async function apiRequest(path, { token, method = 'GET', body, signal } = {}) {
  const isFormData = body instanceof FormData;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method, signal,
    headers: { Accept: 'application/json', ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: isFormData ? body : JSON.stringify(body) } : {}),
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload?.error;
    throw new ApiError(error?.message || 'Il servizio non ha completato la richiesta.', { status: response.status, code: error?.code, details: error?.details, requestId: error?.requestId });
  }
  return payload;
}

export async function apiBlobRequest(path, { token, signal } = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    signal,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const error = payload?.error;
    throw new ApiError(error?.message || 'L’immagine non è disponibile.', { status: response.status, code: error?.code, details: error?.details, requestId: error?.requestId });
  }
  return response.blob();
}
