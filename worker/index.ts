// worker/index.ts – MINIMAL HASH DEBUG
import * as hashWasm from 'hash-wasm';

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Only POST', { status: 405 });
    }

    const { password } = await request.json();

    const salt = crypto.getRandomValues(new Uint8Array(16));

    const hash = await hashWasm.argon2id({
      password,
      salt,
      iterations: 3,
      memorySize: 65536,
      parallelism: 1,
      hashLength: 32,
      outputType: 'encoded',
    });

    return new Response(JSON.stringify({
      password,
      hash
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


      // HTML UI pro testování hesel - přidejte také tento endpoint
      if (url.pathname === '/debug-password-ui' && request.method === 'GET') {
        const html = `
<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<title>Hash Debug</title>
<style>
  body { font-family: monospace; max-width: 800px; margin: 40px auto; }
  input { width: 100%; padding: 10px; font-size: 16px; }
  pre { background: #111; color: #0f0; padding: 15px; margin-top: 10px; }
</style>
</head>
<body>

<h2>🔐 Password → Argon2 Hash</h2>

<input id="password" placeholder="Napiš heslo…">

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
    const res = await fetch('/api/debug/hash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await res.json();
    document.getElementById('hash').textContent = data.hash;
  }, 300);
});
</script>

</body>
</html>
        `;
        
        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      // GET /api/schemas - Seznam schémat
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

      // GET /api/users - Prvních 10 uživatelů
      if (url.pathname === '/api/users') {
        const users = await sql`
          SELECT id, email, is_active, created_at
          FROM auth.users
          ORDER BY id
          LIMIT 10
        `;
        return new Response(JSON.stringify({ users }), { headers });
      }

      // GET /api/groups - Seznam skupin
      if (url.pathname === '/api/groups') {
        const groups = await sql`
          SELECT id, name, description
          FROM auth.groups
          ORDER BY name
        `;
        return new Response(JSON.stringify({ groups }), { headers });
      }

      // GET /api/schemas/:schema/tables - Tabulky v schématu
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

      // GET /api/schemas/:schema/tables/:table/info - Info o tabulce
      const infoMatch = url.pathname.match(/^\/api\/schemas\/([^\/]+)\/tables\/([^\/]+)\/info$/);
      if (infoMatch) {
        const [, schemaName, tableName] = infoMatch;
        
        // Počet řádků
        const countResult = await sql`
          SELECT COUNT(*) as count 
          FROM ${sql(schemaName + '.' + tableName)}
        `;
        
        // Počet sloupců
        const columnsResult = await sql`
          SELECT COUNT(*) as count
          FROM information_schema.columns
          WHERE table_schema = ${schemaName} AND table_name = ${tableName}
        `;

        return new Response(JSON.stringify({
          schema_name: schemaName,
          table_name: tableName,
          full_name: `${schemaName}.${tableName}`,
          row_count: parseInt(countResult[0].count),
          column_count: parseInt(columnsResult[0].count)
        }), { headers });
      }

      // POST /api/schemas/:schema/tables/:table/data - Data z tabulky
      const dataMatch = url.pathname.match(/^\/api\/schemas\/([^\/]+)\/tables\/([^\/]+)\/data$/);
      if (dataMatch && request.method === 'POST') {
        const [, schemaName, tableName] = dataMatch;
        const body = await request.json() as any;
        const { page = 1, pageSize = 50, whereClause = '' } = body;

        const offset = (page - 1) * pageSize;

        // Základní SQL injection prevence
        if (whereClause) {
          const forbidden = ['DELETE', 'UPDATE', 'INSERT', 'DROP', 'ALTER', 'EXEC', 'CREATE'];
          const upperWhere = whereClause.toUpperCase();
          
          if (forbidden.some(keyword => upperWhere.includes(keyword))) {
            return new Response(
              JSON.stringify({ error: 'Forbidden SQL keyword detected' }),
              { status: 400, headers }
            );
          }
          
          if (whereClause.includes('--') || whereClause.includes('/*')) {
            return new Response(
              JSON.stringify({ error: 'SQL comment patterns not allowed' }),
              { status: 400, headers }
            );
          }
        }

        // Sestavení dotazu
        const tablePath = `${schemaName}.${tableName}`;
        
        // Celkový počet (s WHERE pokud je)
        let countQuery = `SELECT COUNT(*) as total FROM "${schemaName}"."${tableName}"`;
        if (whereClause) {
          countQuery += ` WHERE ${whereClause}`;
        }
        const countResult = await sql.unsafe(countQuery);
        const totalRows = parseInt(countResult[0].total);

        // Data s paginací
        let dataQuery = `SELECT * FROM "${schemaName}"."${tableName}"`;
        if (whereClause) {
          dataQuery += ` WHERE ${whereClause}`;
        }
        dataQuery += ` ORDER BY 1 LIMIT ${pageSize} OFFSET ${offset}`;
        
        const dataResult = await sql.unsafe(dataQuery);

        const totalPages = Math.ceil(totalRows / pageSize);

        return new Response(JSON.stringify({
          data: dataResult,
          row_count: dataResult.length,
          total_rows: totalRows,
          page: page,
          page_size: pageSize,
          total_pages: totalPages
        }), { headers });
      }

      // POST /api/auth/login - Přihlášení
      async function verifyPassword(password, hash) {
        try {
          return await argon2Verify({
            password: password,
            hash: hash,
          });
        } catch (e) {
          console.error("WASM Argon2 Error:", e);
          return false;
        }
      }

      if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        const { email, password } = await request.json() as any;

        const users = await sql`
          SELECT u.id, u.email, u.password_hash, g.name as group_name 
          FROM auth.users u
          LEFT JOIN auth.user_groups ug ON u.id = ug.user_id
          LEFT JOIN auth.groups g ON ug.group_id = g.id
          WHERE u.email = ${email} AND u.is_active = true
          LIMIT 1
        `;

        if (users.length === 0) {
          return new Response(JSON.stringify({ error: 'Uživatel nenalezen' }), { status: 401, headers });
        }

        const user = users[0];
        const storedHash = user.password_hash; 

        try {
          // argon2Verify automaticky rozpozná parametry (m, t, p) z vašeho řetězce
          const isValid = await argon2Verify({
            password: password,
            hash: storedHash,
          });

          if (!isValid) {
            return new Response(JSON.stringify({ error: 'Nesprávné heslo' }), { status: 401, headers });
          }

          // Úspěšné přihlášení
          return new Response(JSON.stringify({
            user: {
              id: user.id,
              email: user.email,
              group_name: user.group_name || 'Users'
            }
          }), { headers });

        } catch (e: any) {
          console.error('Argon2 Error:', e);
          return new Response(JSON.stringify({ 
            error: 'Chyba při ověřování hesla',
            details: e.message 
          }), { status: 500, headers });
        }
      }

      // POST /api/auth/register - Registrace
      if (url.pathname === '/api/auth/register' && request.method === 'POST') {
        const { email, groupId } = await request.json() as any;
        
        try {
          // Vložit uživatele
          const newUser = await sql`
            INSERT INTO auth.users (email, is_active)
            VALUES (${email}, true)
            RETURNING id
          `;
          
          // Pokud je zadána skupina, přiřadit
          if (groupId) {
            await sql`
              INSERT INTO auth.user_groups (user_id, group_id)
              VALUES (${newUser[0].id}, ${groupId})
            `;
          }
          
          return new Response(JSON.stringify({ success: true }), { headers });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), { status: 400, headers });
        }
      }

      // 404 - Neznámý endpoint
      return new Response(JSON.stringify({
        error: 'Not Found',
        path: url.pathname,
        hint: 'Navštivte / pro seznam dostupných endpointů'
      }), { 
        status: 404, 
        headers 
      });

    } catch (error: any) {
      console.error('Worker Error:', error);
      return new Response(JSON.stringify({
        error: error.message,
        stack: error.stack
      }), { 
        status: 500,
        headers 
      });
    }
  },
};