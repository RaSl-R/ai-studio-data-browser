import { Group, PermissionLevel, QueryResult, SchemaPermission, TableInfo, User, PAGE_SIZE } from "../types";

// Mock Data
const MOCK_GROUPS: Group[] = [
    { id: 1, name: "Admins", description: "Full access" },
    { id: 2, name: "Analysts", description: "Read-only access to business data" },
    { id: 3, name: "Viewers", description: "Limited read access" },
];

const MOCK_USERS: User[] = [
    { id: 1, email: "admin@example.com", is_active: true, group_id: 1, group_name: "Admins" },
    { id: 2, email: "analyst@example.com", is_active: true, group_id: 2, group_name: "Analysts" },
    { id: 3, email: "user@example.com", is_active: true, group_id: 3, group_name: "Viewers" },
];

const MOCK_PERMISSIONS: SchemaPermission[] = [
    { group_id: 1, schema_name: "public", permission: PermissionLevel.WRITE },
    { group_id: 1, schema_name: "sales", permission: PermissionLevel.WRITE },
    { group_id: 1, schema_name: "hr", permission: PermissionLevel.WRITE },
    { group_id: 2, schema_name: "public", permission: PermissionLevel.READ },
    { group_id: 2, schema_name: "sales", permission: PermissionLevel.READ },
    { group_id: 3, schema_name: "public", permission: PermissionLevel.READ },
];

// Mock Database Content
const TABLES_DATA: Record<string, any[]> = {
    "public.users_audit": Array.from({ length: 120 }).map((_, i) => ({
        id: i + 1,
        action: i % 2 === 0 ? "LOGIN" : "LOGOUT",
        user_email: `user${i % 10}@example.com`,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        ip_address: `192.168.1.${i % 255}`
    })),
    "sales.orders": Array.from({ length: 85 }).map((_, i) => ({
        order_id: 1000 + i,
        customer: `Customer ${i}`,
        amount: (Math.random() * 1000).toFixed(2),
        status: i % 5 === 0 ? "CANCELLED" : "COMPLETED",
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
    })),
    "hr.employees": [
        { id: 1, name: "John Doe", role: "Manager", salary: 80000 },
        { id: 2, name: "Jane Smith", role: "Developer", salary: 75000 },
        { id: 3, name: "Bob Johnson", role: "Designer", salary: 70000 },
    ]
};

class MockDB {
    private latency = 300; // Simulate network delay

    private async delay() {
        return new Promise(resolve => setTimeout(resolve, this.latency));
    }

    async login(email: string, password: string): Promise<User | null> {
        await this.delay();
        // In a real app, hash check. Here, accept 'password' for demo, or match specific mock users.
        const user = MOCK_USERS.find(u => u.email === email);
        if (user && password === "password") { // Hardcoded password for demo
            return user;
        }
        return null;
    }

    async register(email: string, groupId?: number): Promise<boolean> {
        await this.delay();
        if (MOCK_USERS.find(u => u.email === email)) return false;
        const group = MOCK_GROUPS.find(g => g.id === groupId);
        MOCK_USERS.push({
            id: MOCK_USERS.length + 1,
            email,
            is_active: true,
            group_id: groupId,
            group_name: group?.name
        });
        return true;
    }

    async getGroups(): Promise<Group[]> {
        await this.delay();
        return MOCK_GROUPS;
    }

    async getAccessibleSchemas(user: User): Promise<string[]> {
        await this.delay();
        if (!user.group_id) return [];
        
        const perms = MOCK_PERMISSIONS.filter(p => p.group_id === user.group_id);
        const schemas = Array.from(new Set(perms.map(p => p.schema_name)));
        return schemas.sort();
    }

    async getTables(schemaName: string): Promise<string[]> {
        await this.delay();
        return Object.keys(TABLES_DATA)
            .filter(key => key.startsWith(`${schemaName}.`))
            .map(key => key.split('.')[1]);
    }

    async getTableInfo(schemaName: string, tableName: string): Promise<TableInfo> {
        await this.delay();
        const fullKey = `${schemaName}.${tableName}`;
        const data = TABLES_DATA[fullKey] || [];
        return {
            schema_name: schemaName,
            table_name: tableName,
            full_name: fullKey,
            row_count: data.length,
            column_count: data.length > 0 ? Object.keys(data[0]).length : 0
        };
    }

    async getData(
        schemaName: string, 
        tableName: string, 
        page: number, 
        whereClause?: string
    ): Promise<QueryResult> {
        await this.delay();
        const fullKey = `${schemaName}.${tableName}`;
        let data = [...(TABLES_DATA[fullKey] || [])];

        // Basic Filter Simulation
        if (whereClause) {
            try {
                // VERY BASIC filter logic: checks if row values contain the where clause string
                // In a real app, this would parse SQL.
                // For demo: if whereClause is "amount > 500", we crudely check property logic or string match
                const lowerClause = whereClause.toLowerCase();
                data = data.filter(row => {
                    return Object.values(row).some(val => 
                        String(val).toLowerCase().includes(lowerClause)
                    );
                });
            } catch (e) {
                console.error("Filter error", e);
            }
        }

        const total_rows = data.length;
        const total_pages = Math.ceil(total_rows / PAGE_SIZE);
        const start = (page - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const slicedData = data.slice(start, end);

        return {
            data: slicedData,
            row_count: slicedData.length,
            total_rows,
            page,
            page_size: PAGE_SIZE,
            total_pages
        };
    }

    async updateData(schemaName: string, tableName: string, newData: any[]): Promise<boolean> {
        await this.delay();
        const fullKey = `${schemaName}.${tableName}`;
        // Simple replace for demo
        TABLES_DATA[fullKey] = newData;
        return true;
    }

    hasWritePermission(user: User, schemaName: string): boolean {
        if (!user.group_id) return false;
        const perm = MOCK_PERMISSIONS.find(p => 
            p.group_id === user.group_id && 
            p.schema_name === schemaName
        );
        return perm?.permission === PermissionLevel.WRITE || perm?.permission === PermissionLevel.ADMIN;
    }
}

export const db = new MockDB();