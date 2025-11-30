export enum PermissionLevel {
    READ = 'read',
    WRITE = 'write',
    ADMIN = 'admin'
}

export interface User {
    id: number;
    email: string;
    is_active: boolean;
    group_id?: number;
    group_name?: string;
}

export interface Group {
    id: number;
    name: string;
    description: string;
}

export interface SchemaPermission {
    group_id: number;
    schema_name: string;
    permission: PermissionLevel;
}

export interface TableInfo {
    schema_name: string;
    table_name: string;
    full_name: string;
    row_count: number;
    column_count: number;
}

export interface QueryResult {
    data: any[];
    row_count: number;
    total_rows: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export interface AuthResponse {
    success: boolean;
    user?: User;
    error?: string;
    token?: string; // Mock token
}

export const PAGE_SIZE = 50;