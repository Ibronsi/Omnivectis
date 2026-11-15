import { getCachedIdToken, refreshIdToken } from '../lib/firebase';

export const PASSWORD_STORAGE_KEY = 'omnivectis_app_password';

export function getStoredPassword(): string {
  try {
    return localStorage.getItem(PASSWORD_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredPassword(pwd: string): void {
  try {
    localStorage.setItem(PASSWORD_STORAGE_KEY, pwd);
  } catch (e) {
    console.error('Failed to save password in localStorage', e);
  }
}

export function clearStoredPassword(): void {
  try {
    localStorage.removeItem(PASSWORD_STORAGE_KEY);
  } catch (e) {
    console.error(e);
  }
}

let interceptorInstalled = false;

export function setupFetchInterceptor(): void {
  if (interceptorInstalled || typeof window === 'undefined') return;
  interceptorInstalled = true;

  const originalFetch = window.fetch ? window.fetch.bind(window) : window.fetch;

  const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else if (input && typeof input === 'object' && 'url' in input) {
      url = (input as Request).url;
    }

    // Attach password and Firebase Bearer ID token headers if targeting an /api route
    if (url.startsWith('/api') || url.includes('/api/')) {
      const isPublicAuthRoute =
        url.includes('/api/health') ||
        url.includes('/api/auth/verify') ||
        url.includes('/api/auth/status');

      const storedPwd = getStoredPassword();
      const customInit: RequestInit = init ? { ...init } : {};
      const headers = new Headers(
        customInit.headers || (input instanceof Request ? input.headers : {})
      );

      if (storedPwd && !headers.has('x-app-password')) {
        headers.set('x-app-password', storedPwd);
      }

      if (!isPublicAuthRoute && !headers.has('Authorization')) {
        let idToken = getCachedIdToken();
        if (!idToken) {
          try {
            idToken = await refreshIdToken();
          } catch {
            idToken = null;
          }
        }
        if (idToken) {
          headers.set('Authorization', `Bearer ${idToken}`);
        }
      }

      customInit.headers = headers;

      let response = await originalFetch(input, customInit);

      // Retry once with refreshed Firebase ID token if token expired
      if (response.status === 401 && !isPublicAuthRoute) {
        try {
          const freshToken = await refreshIdToken();
          if (freshToken) {
            const retryHeaders = new Headers(headers);
            retryHeaders.set('Authorization', `Bearer ${freshToken}`);
            response = await originalFetch(input, { ...customInit, headers: retryHeaders });
          }
        } catch {
          // ignore refresh failure
        }
      }

      if (response.status === 401 && !isPublicAuthRoute) {
        let code: string | undefined;
        try {
          const cloned = response.clone();
          const data = await cloned.json();
          code = data?.code;
        } catch {
          // ignore JSON parse errors
        }
        window.dispatchEvent(
          new CustomEvent('omnivectis:unauthorized', {
            detail: { url, code },
          })
        );
      }

      return response;
    }

    return originalFetch(input, init);
  };

  try {
    Object.defineProperty(window, 'fetch', {
      value: customFetch,
      writable: true,
      configurable: true,
    });
  } catch {
    console.info('Using window.fetch proxy fallback');
  }
}

export async function checkAuthStatus(): Promise<{ required: boolean; authenticated: boolean }> {
  try {
    const pwd = getStoredPassword();
    const res = await fetch('/api/auth/status', {
      headers: pwd ? { 'x-app-password': pwd } : {},
    });
    const data = await res.json();
    return {
      required: Boolean(data?.required),
      authenticated: Boolean(data?.authenticated),
    };
  } catch {
    return { required: false, authenticated: true };
  }
}

export async function verifyPasswordOnServer(
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();

    if (res.ok && data?.status === 'ok') {
      setStoredPassword(password);
      return { success: true };
    }

    return {
      success: false,
      error: data?.error || 'Mot de passe incorrect.',
    };
  } catch (e: any) {
    return {
      success: false,
      error: e?.message || 'Erreur de connexion au serveur.',
    };
  }
}
