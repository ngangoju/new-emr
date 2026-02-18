'use client'

import { useEffect, useRef } from 'react';
import { socket } from '@/lib/socket';

export const useSocket = () => {
    useEffect(() => {
        socket.connect();
        // No disconnect here to keep connection shared across components
    }, []);

    return socket;
};

export const useSocketEvent = (event: string, callback: (data: any) => void) => {
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const internalCallback = (data: any) => callbackRef.current(data);
        socket.on(event, internalCallback);

        const subscribe = () => {
            if (event.includes(':')) {
                // If event name implies specific topic (e.g. queue:update)
                socket.send({ action: 'subscribe', topic: event });
            }
        }

        if (socket.connected) {
            subscribe();
        }

        socket.on('connect', subscribe);
        socket.connect();

        return () => {
            socket.off(event, internalCallback);
            socket.off('connect', subscribe);
        };
    }, [event]);
};
