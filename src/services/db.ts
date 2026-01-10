// src/services/db.ts
import { QueryResult, TableInfo, User, PAGE_SIZE, Group } from "../types";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

class DatabaseService {
  private async fetchAPI(endpoint: string, options?: RequestInit) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
      }

      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ============================================
  // AUTHENTICATION
  // ============================================
  
  async login(email: string, password: string): Promise<User | null> {
    try {
      const result = await this.fetchAPI('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      return result.user || null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  async register(email: string, groupId?: number): Promise<boolean> {
    try {
      const result = await this.fetchAPI('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, groupId })
      });
      
      return result.success;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  }

  async getGroups(): Promise<Group[]> {
    try {
      const result = await this.fetchAPI('/api/groups');
      return result.groups || [];
    } catch (error) {
      console.error('Get groups error:', error);
      return [];
    }
  }

  // ============================================
  // DATA BROWSING
  // ============================================
  
  async getAccessibleSchemas(user: User): Promise<string[]> {
    try {
      const result = await this.fetchAPI('/api/schemas');
      
      // TODO: Filter based on user permissions
      return result.schemas || [];
    } catch (error) {
      console.error('Error fetching schemas:', error);
      return [];
    }
  }

  async getTables(schemaName: string): Promise<string[]> {
    try {
      const result = await this.fetchAPI(`/api/schemas/${schemaName}/tables`);
      return result.tables || [];
    } catch (error) {
      console.error('Error fetching tables:', error);
      return [];
    }
  }

  async getTableInfo(schemaName: string, tableName: string): Promise<TableInfo> {
    try {
      const result = await this.fetchAPI(
        `/api/schemas/${schemaName}/tables/${tableName}/info`
      );
      return result;
    } catch (error) {
      console.error('Error fetching table info:', error);
      throw error;
    }
  }

  async getData(
    schemaName: string,
    tableName: string,
    page: number,
    whereClause?: string
  ): Promise<QueryResult> {
    try {
      const result = await this.fetchAPI(
        `/api/schemas/${schemaName}/tables/${tableName}/data`,
        {
          method: 'POST',
          body: JSON.stringify({
            page,
            pageSize: PAGE_SIZE,
            whereClause: whereClause || ''
          })
        }
      );
      return result;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }

  // ============================================
  // PERMISSIONS
  // ============================================
  
  hasWritePermission(user: User, schemaName: string): boolean {
    // TODO: Check actual permissions from database
    // For now, only admins have write access
    return user.group_name === "Admins";
  }

  async updateData(
    schemaName: string, 
    tableName: string, 
    newData: any[]
  ): Promise<boolean> {
    try {
      const result = await this.fetchAPI(
        `/api/schemas/${schemaName}/tables/${tableName}/data`,
        {
          method: 'PUT',
          body: JSON.stringify({ data: newData })
        }
      );
      return result.success;
    } catch (error) {
      console.error('Update error:', error);
      return false;
    }
  }
}

export const db = new DatabaseService();