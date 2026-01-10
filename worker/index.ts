import { neon } from '@neondatabase/serverless';

export interface Env {
  DATABASE_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    const url = new URL(request.url);

    try {
      const sql = neon(env.DATABASE_URL);

      // GET /api/users - Test načtení uživatelů
      if (url.pathname === '/api/users') {
        const users = await sql`
          SELECT id, email, is_active, created_at
          FROM auth.users
          ORDER BY id
          LIMIT 10
        `;
        return new Response(JSON.stringify({ users }), { headers });
      }

      // GET /api/schemas - Načtení schémat
      if (url.pathname === '/api/schemas') {
        const result = await sql`
          SELECT schema_name 
          FROM information_schema.schemata 
          WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
          ORDER BY schema_name
        `;
        return new Response(
          JSON.stringify({ schemas: result.map(r => r.schema_name) }), 
          { headers }
        );
      }

      // Default
      return new Response(JSON.stringify({
        message: 'Data Browser API',
        endpoints: ['/api/schemas', '/api/users']
      }), { headers });

    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers 
      });
    }
  },
};