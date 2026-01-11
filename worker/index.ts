// worker/index.ts – Cloudflare Worker (bcrypt auth + Data Browser)

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export interface Env {
  DATABASE_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json; charset=utf-8',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    const url = new URL(request.url);

    try {
      const sql = neon(env.DATABASE_URL);

      // =====================================================
      // DEBUG – BCRYPT HASH
      // POST /api/debug/hash
      // =====================================================
      if (url.pathname === '/api/debug/hash' && request.method === 'POST') {
        const { password } = (await request.json()) as any;

        if (!password) {
          return new Response(
            JSON.stringify({ error: 'Missing password' }),
            { status: 400, headers }
          );
        }

        const saltRounds = 10;
        const hash = bcrypt.hashSync(password, saltRounds);

        return new Response(
          JSON.stringify({ password, hash }, null, 2),
          { headers }
        );
      }

      // =====================================================
      // ROOT – STATUS
      // GET /
      // =====================================================
      if (url.pathname === '/' || url.pathname === '') {
        const time = await sql`SELECT NOW() as now`;
        return new Response(
          JSON.stringify({
            status: '✅ ONLINE',
            server_time: time[0].now,
          }, null, 2),
          { headers }
        );
      }

      // =====================================================
      // SCHEMAS
      // GET /api/schemas
      // =====================================================
      if (url.pathname === '/api/schemas') {
        const schemas = await sql`
          SELECT schema_name
          FROM information_schema.schemata
          WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
          ORDER BY schema_name
        `;
        return new Response(
          JSON.stringify({ schemas: schemas.map(s => s.schema_name) }),
          { headers }
        );
      }

      // =====================================================
      // USERS
      // GET /api/users
      // =====================================================
      if (url.pathname === '/api/users') {
        const users = await sql`
          SELECT id, email, is_active, created_at
          FROM auth.users
          ORDER BY id
          LIMIT 10
        `;
        return new Response(JSON.stringify({ users }), { headers });
      }

      // =====================================================
      // TABLE INFO
      // GET /api/schemas/:schema/tables/:table/info
      // =====================================================
      const infoMatch = url.pathname.match(
        /^\/api\/schemas\/([^/]+)\/tables\/([^/]+)\/info$/
      );

      if (infoMatch) {
        const [, schema, table] = infoMatch;

        const count = await sql`
          SELECT COUNT(*)::int AS count
          FROM ${sql.raw(`"${schema}"."${table}"`)}
        `;

        const columns = await sql`
          SELECT COUNT(*)::int AS count
          FROM information_schema.columns
          WHERE table_schema = ${schema}
            AND table_name = ${table}
        `;

        return new Response(
          JSON.stringify({
            schema,
            table,
            rows: count[0].count,
            columns: columns[0].count,
          }),
          { headers }
        );
      }

      // =====================================================
      // TABLE DATA (PAGINATED)
      // POST /api/schemas/:schema/tables/:table/data
      // =====================================================
      const dataMatch = url.pathname.match(
        /^\/api\/schemas\/([^/]+)\/tables\/([^/]+)\/data$/
      );

      if (dataMatch && request.method === 'POST') {
        const [, schema, table] = dataMatch;
        const { page = 1, pageSize = 50 } = await request.json();

        const offset = (page - 1) * pageSize;

        const data = await sql.unsafe<any[]>(`
          SELECT *
          FROM "${schema}"."${table}"
          ORDER BY 1
          LIMIT ${pageSize}
          OFFSET ${offset}
        `);

        return new Response(
          JSON.stringify({
            page,
            pageSize,
            rows: data.length,
            data,
          }),
          { headers }
        );
      }

      // =====================================================
      // AUTH – LOGIN
      // POST /api/auth/login
      // =====================================================
      if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        const { email, password } = await request.json() as any;

        const users = await sql`
          SELECT id, email, password_hash
          FROM auth.users
          WHERE email = ${email}
            AND is_active = true
          LIMIT 1
        `;

        if (!users.length) {
          return new Response(
            JSON.stringify({ error: 'Uživatel nenalezen' }),
            { status: 401, headers }
          );
        }

        const user = users[0];

        const ok = bcrypt.compareSync(password, user.password_hash);
        if (!ok) {
          return new Response(
            JSON.stringify({ error: 'Nesprávné heslo' }),
            { status: 401, headers }
          );
        }

        return new Response(
          JSON.stringify({
            id: user.id,
            email: user.email,
          }),
          { headers }
        );
      }

      // =====================================================
      // AUTH – REGISTER
      // POST /api/auth/register
      // =====================================================
      if (url.pathname === '/api/auth/register' && request.method === 'POST') {
        const { email, password, groupId } = await request.json() as any;

        if (!email || !password) {
          return new Response(
            JSON.stringify({ error: 'Email a heslo jsou povinné' }),
            { status: 400, headers }
          );
        }

        const hash = bcrypt.hashSync(password, 10);

        const user = await sql`
          INSERT INTO auth.users (email, password_hash, is_active)
          VALUES (${email}, ${hash}, true)
          RETURNING id
        `;

        return new Response(
          JSON.stringify({ success: true, user_id: user[0].id }),
          { headers }
        );
      }

      // =====================================================
      // GROUPS - MISSING ENDPOINT
      // GET /api/groups
      // =====================================================
      if (url.pathname === '/api/groups') {
        // Předpokládám, že existuje tabulka auth.groups
        // Pokud se tabulka jmenuje jinak, upravte SQL dotaz
        const groups = await sql`
          SELECT id, name
          FROM auth.groups
          ORDER BY id
        `;
        return new Response(JSON.stringify(groups), { headers });
      }

      // =====================================================
      // 404
      // =====================================================
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          path: url.pathname,
        }),
        { status: 404, headers }
      );

    } catch (e: any) {
      console.error('Worker error:', e);
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          details: e.message,
        }),
        { status: 500, headers }
      );
    }
  },
};
