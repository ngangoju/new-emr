// Native WebSocket implementation for Spring WebFlux raw WebSockets
const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';

// Set to true to enable debug logging
const WS_DEBUG = false;

function debugLog(...args: any[]) {
    if (WS_DEBUG) {
        console.log('[WebSocket]', ...args);
    }
}

function debugWarn(...args: any[]) {
    if (WS_DEBUG) {
        console.warn('[WebSocket]', ...args);
    }
}

// Helper to get JWT token from localStorage/cookies
function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    // Try to get from localStorage (where auth hook stores it) - key is 'accessToken'
    return localStorage.getItem('accessToken');
}

class SocketManager {
    private socket: WebSocket | null = null;
    private listeners: Map<string, Array<(data: any) => void>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private isConnecting = false;

    connect() {
        if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) return;

        // Get JWT token for authentication
        const token = getAuthToken();
        const url = token ? `${SOCKET_URL}?token=${encodeURIComponent(token)}` : SOCKET_URL;

        debugLog('Connecting to:', url);

        try {
            this.isConnecting = true;
            this.socket = new WebSocket(url);

            this.socket.onopen = () => {
                debugLog('Connected');
                this.reconnectAttempts = 0;
                this.isConnecting = false;
                this.notify('connect', null);
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // If it's a simple string like "queue:update"
                    if (typeof data === 'string') {
                        this.notify(data, null);
                    } else if (data.type) {
                        // If it's an object with a type/event field
                        this.notify(data.type, data);
                    }
                    // Always notify a general message event
                    this.notify('message', data);
                } catch (e) {
                    // Fallback for non-JSON messages
                    this.notify(event.data, null);
                }
            };

            this.socket.onclose = (event) => {
                debugLog('Disconnected:', event.reason);
                this.isConnecting = false;
                this.notify('disconnect', null);
                this.attemptReconnect();
            };

            this.socket.onerror = (error) => {
                debugWarn('Connection failed. Server may be unavailable.');
                this.isConnecting = false;
                // Don't spam errors - just log once and let reconnect handle it
            };
        } catch (error) {
            debugWarn('Failed to create WebSocket');
            this.isConnecting = false;
            this.attemptReconnect();
        }
    }

    private attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            debugLog(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
            setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
        } else {
            debugWarn('Max reconnect attempts reached.');
            this.notify('connect-failed', null);
        }
    }

    on(event: string, callback: (data: any) => void) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);
    }

    off(event: string, callback: (data: any) => void) {
        const list = this.listeners.get(event);
        if (list) {
            this.listeners.set(event, list.filter(cb => cb !== callback));
        }
    }

    private notify(event: string, data: any) {
        this.listeners.get(event)?.forEach(callback => callback(data));
    }

    send(data: any) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            debugWarn('Not connected. Message not sent.');
        }
    }

    disconnect() {
        this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnect
        this.socket?.close();
    }

    get connected() {
        return this.socket?.readyState === WebSocket.OPEN;
    }
}

export const socket = new SocketManager();
