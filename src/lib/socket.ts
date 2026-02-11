/**
 * Standard WebSocket wrapper for Reactive Spring WebFlux backend.
 * Replaces Socket.IO since the backend uses raw WebSockets.
 * Provides a Socket.IO-compatible interface (on, off, emit).
 */

const SOCKET_URL = (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8888')
    .replace('http', 'ws');

type SocketCallback = (data?: any) => void;

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
        console.log(`Connecting to WebSocket: ${SOCKET_URL}/ws/queue`);
        this.socket = new WebSocket(`${SOCKET_URL}/ws/queue`);

        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
            this.triggerEvent('connect');
        };

        this.socket.onmessage = (event) => {
            const rawData = event.data;
            let parsedData: any;

            try {
                parsedData = JSON.parse(rawData);
            } catch (e) {
                parsedData = rawData;
            }

            // Trigger general message event
            this.triggerEvent('message', parsedData);

            // If it's a simple string, treat it as an event name (common in this backend)
            if (typeof parsedData === 'string') {
                this.triggerEvent(parsedData);
            }
            // If it's an object with a type/event field
            else if (parsedData && typeof parsedData === 'object') {
                const eventName = parsedData.type || parsedData.event;
                if (eventName) {
                    this.triggerEvent(eventName, parsedData.data || parsedData);
                }
            }
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket disconnected', event.reason);
            this.triggerEvent('disconnect');

            if (!this.manualDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`Reconnecting in ${2 * this.reconnectAttempts}s... (Attempt ${this.reconnectAttempts})`);
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

    emit(event: string, data?: any) {
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

    private triggerEvent(event: string, data?: any) {
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
