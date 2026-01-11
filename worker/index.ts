// worker/index.ts
import bcrypt from 'bcryptjs';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const headers = { 'Content-Type': 'application/json' };

    try {
      // === DEBUG: GENEROVÁNÍ BCRYPT HASHE ===
      if (url.pathname === '/api/debug/hash' && request.method === 'POST') {
        const { password } = (await request.json()) as any;
        if (!password) {
          return new Response(JSON.stringify({ error: 'Missing password' }), {
            status: 400,
            headers,
          });
        }

        const saltRounds = 10;
        const hash = bcrypt.hashSync(password, saltRounds);

        return new Response(
          JSON.stringify({ password, hash }, null, 2),
          { headers }
        );
      }

      // HTML UI pro testování hesel (bcrypt verze)
      if (url.pathname === '/debug-password-ui' && request.method === 'GET') {
        const html = `
<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<title>Hash Debug (bcrypt)</title>
<style>
  body { font-family: monospace; max-width: 800px; margin: 40px auto; }
  input { width: 100%; padding: 10px; font-size: 16px; }
  pre { background: #111; color: #0f0; padding: 15px; margin-top: 10px; word-break: break-all; }
</style>
</head>
<body>
<h2>🔐 Password → bcrypt Hash</h2>
<input id="password" type="password" placeholder="Napiš heslo…">
<pre id="hash">čekám…</pre>

<script>
let timeout;
document.getElementById('password').addEventListener('input', e => {
  clearTimeout(timeout);
  const password = e.target.value;
  if (!password) {
    document.getElementById('hash').textContent = 'čekám…';
    return;
  }
  timeout = setTimeout(async () => {
    try {
      const res = await fetch('/api/debug/hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      document.getElementById('hash').textContent = data.hash || 'chyba';
    } catch (err) {
      document.getElementById('hash').textContent = 'Chyba při hashování';
    }
  }, 400);
});
</script>
</body>
</html>
        `;

        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      // ──────────────────────────────────────────────────────────────
      // Ostatní endpointy beze změny (jen login + registrace upraveny)
      // ──────────────────────────────────────────────────────────────

      // GET /api/schemas
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

      // GET /api/users - prvních 10
      if (url.pathname === '/api/users') {
        const users = await sql`
          SELECT id, email, is_active, created_at
          FROM auth.users
          ORDER BY id
          LIMIT 10
        `;
        return new Response(JSON.stringify({ users }), { headers });
      }

      // GET /api/groups
      if (url.pathname === '/api/groups') {
        const groups = await sql`
          SELECT id, name, description
          FROM auth.groups
          ORDER BY name
        `;
        return new Response(JSON.stringify({ groups }), { headers });
      }

      // GET /api/schemas/:schema/tables
      const tablesMatch = url.pathname.match(/^\/api\/schemas\/([^\/]+)\/tables$/);
      if (tablesMatch) {
        const schemaName = tablesMatch[1];
        const tables = await sql`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = ${schemaName}
          ORDER BY table_name
        `;
        return new Response(
          JSON.stringify({ tables: tables.map(t => t.table_name) }),
          { headers }
        );
      }

      // ──────────────────────────────────────────────────────────────
      // LOGIN – bcrypt verze
      // ──────────────────────────────────────────────────────────────
      if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        const { email, password } = (await request.json()) as any;

        const users = await sql`
          SELECT u.id, u.email, u.password_hash, g.name as group_name
          FROM auth.users u
          LEFT JOIN auth.user_groups ug ON u.id = ug.user_id
          LEFT JOIN auth.groups g ON ug.group_id = g.id
          WHERE u.email = ${email} AND u.is_active = true
          LIMIT 1
        `;

        if (users.length === 0) {
          return new Response(JSON.stringify({ error: 'Uživatel nenalezen' }), {
            status: 401,
            headers,
          });
        }

        const user = users[0];
        const isValid = bcrypt.compareSync(password, user.password_hash);

        if (!isValid) {
          return new Response(JSON.stringify({ error: 'Nesprávné heslo' }), {
            status: 401,
            headers,
          });
        }

        return new Response(
          JSON.stringify({
            user: {
              id: user.id,
              email: user.email,
              group_name: user.group_name || 'Users',
            },
          }),
          { headers }
        );
      }

      // ──────────────────────────────────────────────────────────────
      // REGISTRACE – bcrypt hash hesla
      // ──────────────────────────────────────────────────────────────
      if (url.pathname === '/api/auth/register' && request.method === 'POST') {
        const { email, password, groupId } = (await request.json()) as any;

        if (!email || !password) {
          return new Response(
            JSON.stringify({ error: 'Email a heslo jsou povinné' }),
            { status: 400, headers }
          );
        }

        const passwordHash = bcrypt.hashSync(password, 10);

        try {
          const newUser = await sql`
            INSERT INTO auth.users (email, password_hash, is_active)
            VALUES (${email}, ${passwordHash}, true)
            RETURNING id
          `;

          if (groupId) {
            await sql`
              INSERT INTO auth.user_groups (user_id, group_id)
              VALUES (${newUser[0].id}, ${groupId})
            `;
          }

          return new Response(JSON.stringify({ success: true, userId: newUser[0].id }), {
            headers,
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), {
            status: 400,
            headers,
          });
        }
      }

      // 404
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          path: url.pathname,
          hint: 'Navštivte / pro seznam dostupných endpointů',
        }),
        {
          status: 404,
          headers,
        }
      );
    } catch (error: any) {
      console.error('Worker Error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error.message,
        }),
        {
          status: 500,
          headers,
        }
      );
    }
  },
};