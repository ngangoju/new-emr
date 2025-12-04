import { useEffect } from 'react';
import { socket } from '@/lib/socket';

export const useSocket = () => {
    useEffect(() => {
        if (!socket.connected) {
            socket.connect();
        }

        return () => {
            // Optional: disconnect on unmount if no other components are using it
            // socket.disconnect(); 
        };
    }, []);

    return socket;
};

export const useSocketEvent = (event: string, callback: (data: any) => void) => {
    const socketInstance = useSocket();

    useEffect(() => {
        socketInstance.on(event, callback);

        return () => {
            socketInstance.off(event, callback);
        };
    }, [socketInstance, event, callback]);
};
