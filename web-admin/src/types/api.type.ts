export interface ApiErrorResponse {
    success: boolean;
    message: string;
    errors?: any;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T;       
    status?: number;
}

export interface ApiListResponse<T> {
    success: boolean;
    message?: string;
    data: T;       
    total?: number;
    page?: number;
    status?: number;
}