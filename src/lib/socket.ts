/**
 * Standard WebSocket wrapper for Reactive Spring WebFlux backend.
 * Auth: short-lived WS ticket from POST /auth/ws-ticket (cookie credentials).
 * Access tokens are HttpOnly and must not be read from document.cookie.
 */

const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_WS_URL) {
        return process.env.NEXT_PUBLIC_WS_URL.replace(/\/$/, '');
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';
    return apiUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws';
};

const getApiBase = () => '/backend';

const SOCKET_URL = getBaseUrl();
const SOCKET_PATH = '/queue';

type SocketCallback = (data?: unknown) => void;

function isSocketMessage(value: unknown): value is { type?: unknown; event?: unknown; data?: unknown } {
    return typeof value === 'object' && value !== null;
}

async function fetchWsTicket(): Promise<string | null> {
    try {
        const res = await fetch(`${getApiBase()}/auth/ws-ticket`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return null;
        const body = (await res.json()) as { ticket?: string };
        return body.ticket || null;
    } catch {
        return null;
    }
}

class SocketClient {
    private socket: WebSocket | null = null;
    private eventListeners: Map<string, Set<SocketCallback>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private manualDisconnect = false;
    private connecting = false;

    get connected() {
        return this.socket?.readyState === WebSocket.OPEN;
    }

    connect() {
        if (
            this.connecting ||
            this.socket?.readyState === WebSocket.OPEN ||
            this.socket?.readyState === WebSocket.CONNECTING
        ) {
            return;
        }

        this.manualDisconnect = false;
        this.connecting = true;

        void (async () => {
            try {
                const ticket = await fetchWsTicket();
                const url = ticket
                    ? `${SOCKET_URL}${SOCKET_PATH}?ticket=${encodeURIComponent(ticket)}`
                    : `${SOCKET_URL}${SOCKET_PATH}`;
                console.debug(`Connecting to WebSocket: ${url.replace(/ticket=[^&]+/, 'ticket=***')}`);
                this.socket = new WebSocket(url);
                this.bindSocketHandlers();
            } catch (err) {
                console.error('WebSocket connect failed:', err);
                this.connecting = false;
                this.scheduleReconnect();
            }
        })();
    }

    private bindSocketHandlers() {
        if (!this.socket) return;

        this.socket.onopen = () => {
            console.debug('WebSocket connected');
            this.connecting = false;
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

            this.triggerEvent('message', parsedData);

            if (typeof parsedData === 'string') {
                this.triggerEvent(parsedData);
            } else if (isSocketMessage(parsedData)) {
                const eventName = parsedData.type || parsedData.event;
                if (typeof eventName === 'string') {
                    this.triggerEvent(eventName, parsedData.data || parsedData);
                }
            }
        };

        this.socket.onclose = (event) => {
            console.debug('WebSocket disconnected', event.reason);
            this.connecting = false;
            this.triggerEvent('disconnect');
            this.scheduleReconnect();
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.connecting = false;
            this.triggerEvent('error', error);
        };
    }

    private scheduleReconnect() {
        if (!this.manualDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.debug(`Reconnecting in ${2 * this.reconnectAttempts}s... (Attempt ${this.reconnectAttempts})`);
            setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
        }
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
        }
    }

    disconnect() {
        this.manualDisconnect = true;
        this.socket?.close();
        this.socket = null;
        this.connecting = false;
    }

    private triggerEvent(event: string, data?: unknown) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach((cb) => {
                try {
                    cb(data);
                } catch (e) {
                    console.error(`Error in socket listener for ${event}:`, e);
                }
            });
        }
    }
}

export const socket = new SocketClient();
export default socket;
