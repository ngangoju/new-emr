export interface ApiError {
    code: string;
    message: string;
    details: string[];
    traceId: string;
    timestamp: string;
    status: number;
    path: string;
}
