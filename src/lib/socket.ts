/**
 * Standard WebSocket wrapper for Reactive Spring WebFlux backend.
 * Replaces Socket.IO since the backend uses raw WebSockets.
 * Provides a Socket.IO-compatible interface (on, off, emit).
 */

function getJwtToken(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/(?:^|; )accessToken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

const getBaseUrl = () => {
    // Prefer dedicated WS URL
    if (process.env.NEXT_PUBLIC_WS_URL) {
        return process.env.NEXT_PUBLIC_WS_URL.replace(/\/$/, '');
    }
    // Fallback to API URL with ws protocol
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';
    return apiUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws';
};

const SOCKET_URL = getBaseUrl();
const SOCKET_PATH = '/queue';

type SocketCallback = (data?: unknown) => void;

function isSocketMessage(value: unknown): value is { type?: unknown; event?: unknown; data?: unknown } {
    return typeof value === 'object' && value !== null;
}

class SocketClient {
    private socket: WebSocket | null = null;
    private eventListeners: Map<string, Set<SocketCallback>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private manualDisconnect = false;

    get connected() {
        return this.socket?.readyState === WebSocket.OPEN;
    }

    connect() {
        if (this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) return;

        this.manualDisconnect = false;
        const token = getJwtToken();
        const url = token ? `${SOCKET_URL}${SOCKET_PATH}?token=${encodeURIComponent(token)}` : `${SOCKET_URL}${SOCKET_PATH}`;
        console.debug(`Connecting to WebSocket: ${url}`);
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            console.debug('WebSocket connected');
            this.reconnectAttempts = 0;
            this.triggerEvent('connect');
        };

        this.socket.onmessage = (event) => {
            const rawData = event.data;
            let parsedData: unknown;

            try {
                parsedData = JSON.parse(rawData);
            } catch {
                parsedData = rawData;
            }

            // Trigger general message event
            this.triggerEvent('message', parsedData);

            // If it's a simple string, treat it as an event name (common in this backend)
            if (typeof parsedData === 'string') {
                this.triggerEvent(parsedData);
            }
            // If it's an object with a type/event field
            else if (isSocketMessage(parsedData)) {
                const eventName = parsedData.type || parsedData.event;
                if (typeof eventName === 'string') {
                    this.triggerEvent(eventName, parsedData.data || parsedData);
                }
            }
        };

        this.socket.onclose = (event) => {
            console.debug('WebSocket disconnected', event.reason);
            this.triggerEvent('disconnect');

            if (!this.manualDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.debug(`Reconnecting in ${2 * this.reconnectAttempts}s... (Attempt ${this.reconnectAttempts})`);
                setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
            }
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.triggerEvent('error', error);
        };
    }

    on(event: string, callback: SocketCallback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)!.add(callback);
    }

    off(event: string, callback: SocketCallback) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.delete(callback);
        }
    }

    emit(event: string, data?: unknown) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            const payload = JSON.stringify({ type: event, data });
            this.socket.send(payload);
        } else {
            console.error('WebSocket not connected');
        }
    }

    disconnect() {
        this.manualDisconnect = true;
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    private triggerEvent(event: string, data?: unknown) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`Error in WebSocket listener for event "${event}":`, e);
                }
            });
        }
    }
}

export const socket = new SocketClient();
