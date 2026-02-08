type SSEEventHandler<T> = (data: T) => void;

interface SSEManagerOptions<T> {
  url: string;
  token?: string | null;
  onMessage: SSEEventHandler<T>;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  withCredentials?: boolean;
}

export class SSEManager<T = unknown> {
  private eventSource: EventSource | null = null;
  private url: string;
  private options: SSEManagerOptions<T>;
  private isConnected = false;

  constructor(options: SSEManagerOptions<T>) {
    this.options = options;
    const urlObj = new URL(options.url);
    if (options.token) {
      urlObj.searchParams.set('token', options.token);
    }
    this.url = urlObj.toString();
  }

  connect(): void {
    if (this.isConnected || this.eventSource) {
      return;
    }

    this.eventSource = new EventSource(this.url, {
      withCredentials: this.options.withCredentials ?? true,
    });

    this.eventSource.onopen = () => {
      this.isConnected = true;
      this.options.onOpen?.();
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data: T = JSON.parse(event.data);
        this.options.onMessage(data);
      } catch (error) {
        console.error('[SSEManager] Failed to parse message:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      this.options.onError?.(error);
    };
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
      this.options.onClose?.();
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/token');
    if (response.ok) {
      const data = await response.json();
      return data.token;
    }
  } catch (error) {
    console.error('[SSEManager] Failed to get auth token:', error);
  }
  return null;
}

export function createSSEUrl(baseUrl: string, path: string, token?: string | null): string {
  const url = new URL(path, baseUrl);
  if (token) {
    url.searchParams.set('token', token);
  }
  return url.toString();
}
