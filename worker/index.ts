// worker/index.ts - Kompletní funkční Worker
import { neon } from '@neondatabase/serverless';
import { argon2Verify, argon2id } from 'hash-wasm';

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

      // === ÚVODNÍ STRÁNKA ===
      if (url.pathname === '/' || url.pathname === '') {
        try {
          const timeResult = await sql`SELECT NOW() as current_time`;
          const usersResult = await sql`SELECT COUNT(*) as count FROM auth.users`;

          return new Response(JSON.stringify({
            status: '✅ ONLINE',
            message: 'Data Browser Worker běží!',
            database: {
              connected: true,
              server_time: timeResult[0].current_time,
              users_count: parseInt(usersResult[0].count)
            },
            endpoints: {
              '/': 'Status',
              '/simple-test': 'Jednoduchý password test',
              '/api/schemas': 'Seznam schémat',
              '/api/auth/login': 'Přihlášení'
            }
          }, null, 2), { headers: { ...headers, 'Content-Type': 'application/json' } });
        } catch (dbError: any) {
          return new Response(JSON.stringify({
            status: '❌ ERROR',
            error: dbError.message
          }), { status: 500, headers });
        }
      }

      // === JEDNODUCHÝ PASSWORD TEST - UI ===
      if (url.pathname === '/simple-test') {
        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Password Test</title>
  <style>
    body { font-family: Arial; max-width: 700px; margin: 50px auto; padding: 20px; background: #f0f0f0; }
    .box { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0; }
    h1 { color: #333; }
    input { width: 100%; padding: 12px; margin: 10px 0; border: 2px solid #ddd; border-radius: 5px; font-size: 16px; box-sizing: border-box; }
    button { width: 100%; padding: 15px; background: #4CAF50; color: white; border: none; border-radius: 5px; font-size: 18px; font-weight: bold; cursor: pointer; margin: 10px 0; }
    button:hover { background: #45a049; }
    .result { padding: 20px; border-radius: 5px; margin: 20px 0; }
    .success { background: #d4edda; border: 2px solid #28a745; }
    .error { background: #f8d7da; border: 2px solid #dc3545; }
    .info { background: #d1ecf1; border: 2px solid #0c5460; }
    pre { background: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px; }
    .big { font-size: 24px; font-weight: bold; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="box">
    <h1>🔐 Password Test</h1>
    <p><strong>Test vašeho hesla:</strong></p>
    <ol>
      <li>Zadejte heslo a email</li>
      <li>Klikněte TEST</li>
      <li>Uvidíte jestli heslo sedí</li>
    </ol>
    
    <input type="text" id="password" placeholder="Heslo (např. Testtest1.)" value="Testtest1.">
    <input type="email" id="email" placeholder="Email" value="csduff@seznam.cz">
    <button onclick="test()">▶️ TEST HESLO</button>
    
    <div id="result"></div>
  </div>

  <script>
    async function test() {
      const password = document.getElementById('password').value;
      const email = document.getElementById('email').value;
      const resultDiv = document.getElementById('result');
      
      resultDiv.innerHTML = '<div class="info"><p class="big">⏳ Testování...</p></div>';

      try {
        const res = await fetch('/api/simple-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password, email })
        });

        const data = await res.json();

        if (data.error) {
          resultDiv.innerHTML = \`<div class="error"><p class="big">❌ \${data.error}</p></div>\`;
          return;
        }

        let html = '';
        if (data.match) {
          html = \`<div class="success"><p class="big">✅ HESLO SEDÍ!</p><p>Heslo "<strong>\${password}</strong>" je správné.</p></div>\`;
        } else {
          html = \`<div class="error"><p class="big">❌ HESLO NESEDÍ!</p><p>Heslo "<strong>\${password}</strong>" je ŠPATNĚ.</p></div>\`;
        }

        html += \`
          <div class="info">
            <p><strong>Detaily:</strong></p>
            <p>Vaše heslo: "\${data.password}" (délka: \${data.password.length})</p>
            <p>Email: \${data.email}</p>
            <p>Uživatel nalezen: \${data.user_found ? 'Ano ✓' : 'Ne ✗'}</p>
            <p><strong>Hash z DB:</strong></p>
            <pre>\${data.db_hash || 'žádný'}</pre>
            <p><strong>Nový hash (ukázka):</strong></p>
            <pre>\${data.new_hash}</pre>
          </div>
        \`;
        resultDiv.innerHTML = html;
      } catch (e) {
        resultDiv.innerHTML = \`<div class="error"><p class="big">❌ \${e.message}</p></div>\`;
      }
    }
  </script>
</body>
</html>`;
        return new Response(html, { headers: { 'Content-Type': 'text/html' } });
      }

      // === API: JEDNODUCHÝ PASSWORD TEST ===
      if (url.pathname === '/api/simple-test' && request.method === 'POST') {
        const { password, email } = await request.json() as any;

        if (!password || !email) {
          return new Response(JSON.stringify({ error: 'Zadejte heslo i email' }), { status: 400, headers });
        }

        // Vygenerovat hash
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const newHash = await argon2id({
          password: password,
          salt: salt,
          parallelism: 4,
          iterations: 3,
          memorySize: 65536,
          hashLength: 32,
          outputType: 'encoded'
        });

        // Načíst z DB
        const users = await sql`
          SELECT id, email, password_hash 
          FROM auth.users 
          WHERE email = ${email}
          LIMIT 1
        `;

        if (users.length === 0) {
          return new Response(JSON.stringify({
            error: 'Uživatel nenalezen',
            email: email,
            user_found: false,
            password: password,
            new_hash: newHash,
            db_hash: null,
            match: false
          }), { headers });
        }

        const dbHash = users[0].password_hash;

        // Ověřit
        let match = false;
        try {
          match = await argon2Verify({ password: password, hash: dbHash });
        } catch (e: any) {
          return new Response(JSON.stringify({
            error: 'Chyba: ' + e.message,
            password: password,
            email: email,
            user_found: true,
            new_hash: newHash,
            db_hash: dbHash,
            match: false
          }), { headers });
        }

        return new Response(JSON.stringify({
          match: match,
          email: email,
          user_found: true,
          password: password,
          new_hash: newHash,
          db_hash: dbHash
        }), { headers });
      }

      // === API: SCHEMAS ===
      if (url.pathname === '/api/schemas') {
        const result = await sql`
          SELECT schema_name 
          FROM information_schema.schemata 
          WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
          ORDER BY schema_name
        `;
        return new Response(JSON.stringify({ schemas: result.map(r => r.schema_name) }), { headers });
      }

      // === API: LOGIN ===
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

        try {
          const isValid = await argon2Verify({ password: password, hash: user.password_hash });

          if (!isValid) {
            return new Response(JSON.stringify({ error: 'Nesprávné heslo' }), { status: 401, headers });
          }

          return new Response(JSON.stringify({
            user: {
              id: user.id,
              email: user.email,
              group_name: user.group_name || 'Users'
            }
          }), { headers });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: 'Chyba: ' + e.message }), { status: 500, headers });
        }
      }

      // === 404 ===
      return new Response(JSON.stringify({
        error: 'Not Found',
        path: url.pathname
      }), { status: 404, headers });

    } catch (error: any) {
      return new Response(JSON.stringify({
        error: error.message,
        stack: error.stack
      }), { status: 500, headers });
    }
  },
};