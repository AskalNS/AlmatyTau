import type { ApiError } from '@atm/contracts';
import { API } from '@atm/contracts';

/**
 * HTTP-клиент админки.
 *
 * Токены хранятся в памяти + localStorage. При 401 из-за истёкшего access
 * клиент один раз пытается обновить пару по refresh и повторяет запрос —
 * пользователь не видит разлогинов каждые 15 минут. Если и refresh мёртв,
 * происходит выход.
 */
const BASE = import.meta.env.VITE_API_URL || '';

let accessToken: string | null = localStorage.getItem('atm_access');
let refreshToken: string | null = localStorage.getItem('atm_refresh');
let onLogout: (() => void) | null = null;

export function setTokens(access: string | null, refresh: string | null) {
  accessToken = access;
  refreshToken = refresh;
  if (access) localStorage.setItem('atm_access', access);
  else localStorage.removeItem('atm_access');
  if (refresh) localStorage.setItem('atm_refresh', refresh);
  else localStorage.removeItem('atm_refresh');
}

export function setLogoutHandler(fn: () => void) {
  onLogout = fn;
}

export function hasSession(): boolean {
  return !!accessToken;
}

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

async function raw(path: string, init: RequestInit, retry = true): Promise<Response> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  // Истёк access — пробуем обновить один раз и повторить.
  if (res.status === 401 && retry && refreshToken && path !== API.auth.refresh) {
    const refreshed = await tryRefresh();
    if (refreshed) return raw(path, init, false);
    onLogout?.();
  }
  return res;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}${API.auth.refresh}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function parse<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }
  let body: ApiError | null = null;
  try {
    body = (await res.json()) as ApiError;
  } catch {
    /* тело не JSON */
  }
  throw new ApiRequestError(
    res.status,
    body?.code || 'ERROR',
    body?.message || `Ошибка ${res.status}`,
    body?.fields,
  );
}

export const api = {
  get: <T>(path: string) => raw(path, { method: 'GET' }).then((r) => parse<T>(r)),
  post: <T>(path: string, body?: unknown) =>
    raw(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }).then((r) => parse<T>(r)),
  put: <T>(path: string, body: unknown) =>
    raw(path, { method: 'PUT', body: JSON.stringify(body) }).then((r) => parse<T>(r)),
  patch: <T>(path: string, body: unknown) =>
    raw(path, { method: 'PATCH', body: JSON.stringify(body) }).then((r) => parse<T>(r)),
  del: <T>(path: string) => raw(path, { method: 'DELETE' }).then((r) => parse<T>(r)),
  upload: <T>(path: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return raw(path, { method: 'POST', body: fd }).then((r) => parse<T>(r));
  },
};
