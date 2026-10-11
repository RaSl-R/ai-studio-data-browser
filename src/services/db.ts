// src/services/db.ts
import { QueryResult, TableInfo, User, PAGE_SIZE, Group } from "../types";

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

class DatabaseService {
  private token: string | null = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof localStorage !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async fetchAPI(endpoint: string, options?: RequestInit) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string>),
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const url = endpoint.startsWith('/') ? `${API_BASE_URL}${endpoint}` : `${API_BASE_URL}/${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
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

      if (result && result.token) {
        this.setToken(result.token);
      }

      return result || null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  async register(email: string, password: string, groupId?: number): Promise<boolean> {
    try {
      const result = await this.fetchAPI('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, groupId })
      });

      if (result && result.token) {
        this.setToken(result.token);
      }
      
      return Boolean(result.success);
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  }

  logout() {
    this.setToken(null);
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
      return result.schemas || [];
    } catch (error) {
      console.error('Error fetching schemas:', error);
      return [];
    }
  }

  async getTables(schemaName: string): Promise<string[]> {
    try {
      const result = await this.fetchAPI(`/api/schemas/${encodeURIComponent(schemaName)}/tables`);
      return result.tables || [];
    } catch (error) {
      console.error('Error fetching tables:', error);
      return [];
    }
  }

  async getTableInfo(schemaName: string, tableName: string): Promise<TableInfo> {
    try {
      const result = await this.fetchAPI(
        `/api/schemas/${encodeURIComponent(schemaName)}/tables/${encodeURIComponent(tableName)}/info`
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
        `/api/schemas/${encodeURIComponent(schemaName)}/tables/${encodeURIComponent(tableName)}/data`,
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
    return user.group_name === "Admins" || user.group_name === "Admin";
  }

  async updateData(
    schemaName: string, 
    tableName: string, 
    newData: any[]
  ): Promise<boolean> {
    try {
      const result = await this.fetchAPI(
        `/api/schemas/${encodeURIComponent(schemaName)}/tables/${encodeURIComponent(tableName)}/data`,
        {
          method: 'PUT',
          body: JSON.stringify({ data: newData })
        }
      );
      return Boolean(result.success);
    } catch (error) {
      console.error('Update error:', error);
      return false;
    }
  }
}

export const db = new DatabaseService();
