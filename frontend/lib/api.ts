interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  private getBaseURL() {
    if (typeof window === 'undefined') {
      return process.env.API_URL_INTERNAL || 'http://backend:3006';
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
  }


  private async getToken(): Promise<string | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const response = await fetch('/api/auth/token');
      if (response.ok) {
        const data = await response.json();
        return data.token || null;
      }
    } catch (error) {
      console.error('Failed to get token:', error);
    }
    return null;
  }

  private async refreshToken(oldToken: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.getBaseURL()}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: oldToken }),
      });

      if (response.ok) {
        const data = await response.json();
        const newToken = data.token;

        await fetch('/api/auth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: newToken }),
        });

        return newToken;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    return null;
  }

  private subscribeTokenRefresh(callback: (_token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private async handleUnauthorized(
    url: string,
    config: RequestConfig
  ): Promise<Response> {
    const token = await this.getToken();
      if (!token) {
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      throw new Error('No token available');
    }    if (!this.isRefreshing) {
      this.isRefreshing = true;

      const newToken = await this.refreshToken(token);

      if (newToken) {
        this.isRefreshing = false;
        this.onTokenRefreshed(newToken);
        return this.request(url, { ...config, skipAuth: false });
      } else {
        this.isRefreshing = false;
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        throw new Error('Token refresh failed');
      }
    } else {
      return new Promise((resolve, reject) => {
        this.subscribeTokenRefresh(async () => {
          try {
            const response = await this.request(url, {
              ...config,
              skipAuth: false,
            });
            resolve(response);
          } catch (error) {
            reject(error);
          }
        });
      });
    }
  }

  async request(url: string, config: RequestConfig = {}): Promise<Response> {
    const { skipAuth, ...fetchConfig } = config;
    const fullURL = url.startsWith('http') ? url : `${this.getBaseURL()}${url}`;

    const isFormData = fetchConfig.body instanceof FormData;
    
    const headers: Record<string, string> = isFormData 
      ? { ...((fetchConfig.headers as Record<string, string>) || {}) }
      : {
          'Content-Type': 'application/json',
          ...((fetchConfig.headers as Record<string, string>) || {}),
        };

    if (!skipAuth) {
      const token = await this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(fullURL, {
      ...fetchConfig,
      headers,
      credentials: 'include',
    });

    if (response.status === 401 && !skipAuth) {
      return this.handleUnauthorized(url, config);
    }

    return response;
  }

  async get(url: string, config?: RequestConfig): Promise<Response> {
    return this.request(url, { ...config, method: 'GET' });
  }

  async post(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<Response> {
    return this.request(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(url: string, data?: any, config?: RequestConfig): Promise<Response> {
    return this.request(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(url: string, config?: RequestConfig): Promise<Response> {
    return this.request(url, { ...config, method: 'DELETE' });
  }

  async patch(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<Response> {
    return this.request(url, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export const api = new ApiClient()
