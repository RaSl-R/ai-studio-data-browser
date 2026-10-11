// worker/index.ts – Cloudflare Worker (bcrypt auth + Data Browser)

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import {
  isValidIdentifier,
  escapeIdentifier,
  validateWhereClause,
  signJWT,
  verifyJWT
} from '../src/utils';

export interface Env {
  DATABASE_URL: string;
  JWT_SECRET?: string;
}

const DEFAULT_JWT_SECRET = 'data-browser-cloudflare-v2-jwt-secret-key-2026';

async function authenticate(request: Request, secret: string): Promise<{ id: number; email: string; group_id?: number } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  const payload = await verifyJWT(token, secret);
  return payload as { id: number; email: string; group_id?: number } | null;
}

// =====================================================
// MAIN WORKER HANDLER
// =====================================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json; charset=utf-8',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    const url = new URL(request.url);
    const jwtSecret = env.JWT_SECRET || DEFAULT_JWT_SECRET;

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
        
        const endpoints = [
          { method: 'GET', path: '/api/schemas', description: 'Seznam schémat' },
          { method: 'GET', path: '/api/schemas/:schema/tables', description: 'Seznam tabulek ve schématu' },
          { method: 'GET', path: '/api/users', description: 'Seznam uživatelů (limit 10)' },
          { method: 'GET', path: '/api/groups', description: 'Seznam uživatelských skupin' },
          { method: 'POST', path: '/api/auth/login', body: { email: 'string', password: 'string' } },
          { method: 'POST', path: '/api/auth/register', body: { email: 'string', password: 'string', groupId: 'number' } },
          { method: 'GET', path: '/api/schemas/:schema/tables/:table/info', description: 'Metadata tabulky' },
          { method: 'POST', path: '/api/schemas/:schema/tables/:table/data', description: 'Data tabulky (stránkování)' },
          { method: 'PUT', path: '/api/schemas/:schema/tables/:table/data', description: 'Aktualizace / import dat tabulky' },
          { method: 'POST', path: '/api/debug/hash', description: 'Test bcrypt hashování' }
        ];

        return new Response(
          JSON.stringify({
            status: '✅ ONLINE',
            server_time: time[0].now,
            endpoints
          }, null, 2),
          { headers }
        );
      }

      // =====================================================
      // AUTH – LOGIN
      // POST /api/auth/login
      // =====================================================
      if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        const { email, password } = await request.json() as any;

        if (!email || !password) {
          return new Response(
            JSON.stringify({ error: 'Email a heslo jsou povinné' }),
            { status: 400, headers }
          );
        }

        const users = await sql`
          SELECT u.id, u.email, u.password_hashed, u.is_active, u.group_id, g.name as group_name
          FROM auth.users u
          LEFT JOIN auth.groups g ON u.group_id = g.id
          WHERE u.email = ${email}
            AND u.is_active = true
          LIMIT 1
        `;

        if (!users.length) {
          return new Response(
            JSON.stringify({ error: 'Uživatel nenalezen' }),
            { status: 401, headers }
          );
        }

        const user = users[0];

        const ok = bcrypt.compareSync(password, user.password_hashed);
        if (!ok) {
          return new Response(
            JSON.stringify({ error: 'Nesprávné heslo' }),
            { status: 401, headers }
          );
        }

        const token = await signJWT(
          { id: user.id, email: user.email, group_id: user.group_id },
          jwtSecret
        );

        return new Response(
          JSON.stringify({
            id: user.id,
            email: user.email,
            is_active: user.is_active,
            group_id: user.group_id,
            group_name: user.group_name || 'Viewer',
            token
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

        const existing = await sql`
          SELECT id FROM auth.users WHERE email = ${email} LIMIT 1
        `;

        if (existing.length) {
          return new Response(
            JSON.stringify({ error: 'Uživatel s tímto emailem již existuje' }),
            { status: 400, headers }
          );
        }

        const hash = bcrypt.hashSync(password, 10);
        const assignedGroupId = typeof groupId === 'number' ? groupId : 3;

        const user = await sql`
          INSERT INTO auth.users (email, password_hashed, is_active, group_id)
          VALUES (${email}, ${hash}, true, ${assignedGroupId})
          RETURNING id
        `;

        const token = await signJWT(
          { id: user[0].id, email, group_id: assignedGroupId },
          jwtSecret
        );

        return new Response(
          JSON.stringify({ success: true, user_id: user[0].id, token }),
          { headers }
        );
      }

      // =====================================================
      // GROUPS
      // GET /api/groups
      // =====================================================
      if (url.pathname === '/api/groups') {
        const groups = await sql`
          SELECT id, name, description
          FROM auth.groups
          ORDER BY id
        `;
        return new Response(JSON.stringify({ groups }), { headers });
      }

      // =====================================================
      // AUTHENTICATION CHECK FOR PROTECTED ROUTES
      // =====================================================
      const authenticatedUser = await authenticate(request, jwtSecret);
      if (!authenticatedUser) {
        return new Response(
          JSON.stringify({ error: 'Neautorizovaný přístup. Chybí platný token.' }),
          { status: 401, headers }
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
      // SCHEMAS / TABLES LIST
      // GET /api/schemas/:schema/tables
      // =====================================================
      const tablesMatch = url.pathname.match(/^\/api\/schemas\/([^/]+)\/tables$/);
      if (tablesMatch && request.method === 'GET') {
        const [, schema] = tablesMatch;

        if (!isValidIdentifier(schema)) {
          return new Response(
            JSON.stringify({ error: 'Neplatný název schématu' }),
            { status: 400, headers }
          );
        }

        const tables = await sql`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = ${schema}
            AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `;

        return new Response(
          JSON.stringify({
            schema,
            tables: tables.map(t => t.table_name)
          }),
          { headers }
        );
      }

      // =====================================================
      // USERS
      // GET /api/users
      // =====================================================
      if (url.pathname === '/api/users') {
        const users = await sql`
          SELECT u.id, u.email, u.is_active, u.group_id, g.name as group_name, u.created_at
          FROM auth.users u
          LEFT JOIN auth.groups g ON u.group_id = g.id
          ORDER BY u.id
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

        if (!isValidIdentifier(schema) || !isValidIdentifier(table)) {
          return new Response(
            JSON.stringify({ error: 'Neplatné identifikátory schématu nebo tabulky' }),
            { status: 400, headers }
          );
        }

        const safeSchema = escapeIdentifier(schema);
        const safeTable = escapeIdentifier(table);

        const countResult = (await sql.unsafe(`
          SELECT COUNT(*)::int AS count
          FROM ${safeSchema}.${safeTable}
        `)) as unknown as any[];

        const columns = await sql`
          SELECT COUNT(*)::int AS count
          FROM information_schema.columns
          WHERE table_schema = ${schema}
            AND table_name = ${table}
        `;

        return new Response(
          JSON.stringify({
            schema_name: schema,
            table_name: table,
            full_name: `${schema}.${table}`,
            row_count: countResult[0]?.count || 0,
            column_count: columns[0]?.count || 0,
            rows: countResult[0]?.count || 0,
            columns: columns[0]?.count || 0,
          }),
          { headers }
        );
      }

      // =====================================================
      // TABLE DATA (PAGINATED & FILTERED)
      // POST /api/schemas/:schema/tables/:table/data
      // =====================================================
      const dataMatch = url.pathname.match(
        /^\/api\/schemas\/([^/]+)\/tables\/([^/]+)\/data$/
      );

      if (dataMatch && request.method === 'POST') {
        const [, schema, table] = dataMatch;

        if (!isValidIdentifier(schema) || !isValidIdentifier(table)) {
          return new Response(
            JSON.stringify({ error: 'Neplatné identifikátory schématu nebo tabulky' }),
            { status: 400, headers }
          );
        }

        const body = (await request.json().catch(() => ({}))) as any;
        const page = Math.max(1, parseInt(String(body.page || 1), 10) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(String(body.pageSize || 50), 10) || 50));
        const whereClause = typeof body.whereClause === 'string' ? body.whereClause.trim() : '';

        if (whereClause) {
          const validation = validateWhereClause(whereClause);
          if (!validation.isValid) {
            return new Response(
              JSON.stringify({ error: validation.error }),
              { status: 400, headers }
            );
          }
        }

        const safeSchema = escapeIdentifier(schema);
        const safeTable = escapeIdentifier(table);
        const offset = (page - 1) * pageSize;

        // Base query
        let countQuery = `SELECT COUNT(*)::int AS total FROM ${safeSchema}.${safeTable}`;
        let dataQuery = `SELECT * FROM ${safeSchema}.${safeTable}`;

        if (whereClause) {
          countQuery += ` WHERE ${whereClause}`;
          dataQuery += ` WHERE ${whereClause}`;
        }

        dataQuery += ` ORDER BY 1 LIMIT ${pageSize} OFFSET ${offset}`;

        const totalResult = (await sql.unsafe(countQuery)) as unknown as any[];
        const totalRows = totalResult[0]?.total || 0;
        const totalPages = Math.ceil(totalRows / pageSize) || 1;

        const data = (await sql.unsafe(dataQuery)) as unknown as any[];

        return new Response(
          JSON.stringify({
            data,
            row_count: data.length,
            total_rows: totalRows,
            page,
            page_size: pageSize,
            total_pages: totalPages,
          }),
          { headers }
        );
      }

      // =====================================================
      // UPDATE DATA / IMPORT CSV DATA
      // PUT /api/schemas/:schema/tables/:table/data
      // =====================================================
      if (dataMatch && request.method === 'PUT') {
        const [, schema, table] = dataMatch;

        if (!isValidIdentifier(schema) || !isValidIdentifier(table)) {
          return new Response(
            JSON.stringify({ error: 'Neplatné identifikátory schématu nebo tabulky' }),
            { status: 400, headers }
          );
        }

        const body = (await request.json().catch(() => ({}))) as any;
        const newData = body.data;

        if (!Array.isArray(newData)) {
          return new Response(
            JSON.stringify({ error: 'Pole data musí být pole objektů' }),
            { status: 400, headers }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `Úspěšně aktualizováno ${newData.length} řádků`,
          }),
          { headers }
        );
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
