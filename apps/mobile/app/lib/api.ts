export type ApiClientOptions = {
  baseUrl?: string;
  getAuthToken?: () => string | null;
};

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private getAuthToken?: () => string | null;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:3000';
    this.getAuthToken = options.getAuthToken;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private resolveToken() {
    if (this.token) {
      return this.token;
    }
    if (this.getAuthToken) {
      return this.getAuthToken();
    }
    return null;
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const token = this.resolveToken();
    const headers = new Headers(init.headers ?? {});
    headers.set('Content-Type', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Request failed');
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  get<T>(path: string) {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    });
  }
}

export const apiClient = new ApiClient();
