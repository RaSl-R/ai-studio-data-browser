// worker/index.ts - Cloudflare Worker s testovací úvodní stránkou
import { neon } from '@neondatabase/serverless';
import { argon2Verify, createArgon2 } from 'hash-wasm';

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
      // GET / - Zobrazí status a test připojení
      if (url.pathname === '/' || url.pathname === '') {
        try {
          // Test připojení - SELECT NOW()
          const timeResult = await sql`SELECT NOW() as current_time`;
          const currentTime = timeResult[0].current_time;

          // Počet schémat
          const schemasResult = await sql`
            SELECT COUNT(*) as count
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
          `;
          const schemaCount = schemasResult[0].count;

          // Počet uživatelů
          const usersResult = await sql`SELECT COUNT(*) as count FROM auth.users`;
          const userCount = usersResult[0].count;

          return new Response(JSON.stringify({
            status: '✅ ONLINE',
            message: 'Data Browser Worker je připojen k databázi!',
            database: {
              connected: true,
              server_time: currentTime,
              schemas_count: parseInt(schemaCount),
              users_count: parseInt(userCount)
            },
            available_endpoints: {
              '/': 'Tato úvodní stránka (status)',
              '/api/schemas': 'Seznam všech schémat',
              '/api/users': 'Prvních 10 uživatelů',
              '/api/groups': 'Seznam skupin',
              '/api/schemas/:schema/tables': 'Tabulky v schématu',
              '/api/schemas/:schema/tables/:table/info': 'Info o tabulce',
              '/api/schemas/:schema/tables/:table/data': 'Data z tabulky (POST)'
            },
            example_usage: 'curl https://your-worker.workers.dev/api/users'
          }, null, 2), { 
            headers: {
              ...headers,
              'Content-Type': 'application/json; charset=utf-8'
            } 
          });

        } catch (dbError: any) {
          return new Response(JSON.stringify({
            status: '❌ ERROR',
            message: 'Nelze se připojit k databázi',
            error: dbError.message,
            hint: 'Zkontrolujte DATABASE_URL secret ve Wrangler'
          }, null, 2), { 
            status: 500,
            headers 
          });
        }
      }

      // === API ENDPOINTS ===
      // Přidejte tento endpoint do worker/index.ts (před ostatní endpointy)

      // POST /api/debug/password - Debug endpoint pro testování hesel
      if (url.pathname === '/api/debug/password' && request.method === 'POST') {
        const { password, email } = await request.json() as any;

        try {
          // 1. Vygenerovat nový hash z hesla pomocí argon2id
          const argon2 = await createArgon2();
          const salt = crypto.getRandomValues(new Uint8Array(16));
          
          const newHash = argon2.hash({
            password: password,
            salt: salt,
            parallelism: 4,
            iterations: 3,
            memorySize: 65536, // 64 MB
            hashLength: 32,
            outputType: 'encoded'
          });

          // 2. Načíst uživatele z databáze (pokud je zadán email)
          let dbHash = null;
          let dbUser = null;
          if (email) {
            const users = await sql`
              SELECT id, email, password_hash 
              FROM auth.users 
              WHERE email = ${email}
              LIMIT 1
            `;
            
            if (users.length > 0) {
              dbUser = users[0];
              dbHash = users[0].password_hash;
            }
          }

          // 3. Ověřit heslo proti DB hashi (pokud existuje)
          let verificationResult = null;
          let verificationError = null;
          
          if (dbHash) {
            try {
              verificationResult = await argon2Verify({
                password: password,
                hash: dbHash,
              });
            } catch (e: any) {
              verificationResult = false;
              verificationError = e.message;
            }
          }

          // 4. Rozebrat DB hash na parametry
          let hashParams = null;
          if (dbHash) {
            const parts = dbHash.split('$');
            // Format: $argon2id$v=19$m=65536,t=3,p=4$salt$hash
            if (parts.length >= 5) {
              const params = parts[3].split(',');
              hashParams = {
                algorithm: parts[1], // argon2id
                version: parts[2],   // v=19
                memory: params[0],   // m=65536
                iterations: params[1], // t=3
                parallelism: params[2], // p=4
                salt_base64: parts[4],
                hash_base64: parts[5]
              };
            }
          }

          // 5. Vrátit debug info
          return new Response(JSON.stringify({
            input: {
              password: password,
              password_length: password.length,
              email: email || 'Not provided'
            },
            database: {
              user_found: !!dbUser,
              user_email: dbUser?.email,
              stored_hash: dbHash,
              hash_params: hashParams
            },
            verification: {
              password_matches: verificationResult === true,
              verification_result: verificationResult,
              error: verificationError
            },
            new_hash_example: {
              hash: newHash,
              note: 'Toto je jak by vypadal hash vašeho hesla, kdybyste ho právě zaregistrovali (salt je náhodný, takže hash bude vždy jiný)'
            },
            troubleshooting: {
              checks: [
                `✓ Hash v DB začíná $argon2id? ${dbHash?.startsWith('$argon2id') ? 'ANO' : 'NE'}`,
                `✓ Heslo má ${password.length} znaků`,
                `✓ Heslo je: "${password}" (zkontrolujte přesně)`,
              ],
              common_issues: [
                'Hash v DB musí začínat $argon2id',
                'Heslo je case-sensitive (A ≠ a)',
                'Zkontrolujte extra mezery na začátku/konci',
                'Zkontrolujte speciální znaky (. ! @ # atd.)'
              ],
              next_steps: verificationResult === true 
                ? '✅ Heslo je SPRÁVNÉ! Login by měl fungovat.'
                : verificationResult === false && dbHash
                  ? '❌ Heslo NESEDÍ! Zkontrolujte přesný text hesla.'
                  : '⚠️ Uživatel nenalezen nebo email nebyl zadán.'
            }
          }, null, 2), { headers });

        } catch (error: any) {
          return new Response(JSON.stringify({
            error: 'Debug endpoint error',
            message: error.message,
            stack: error.stack
          }), { status: 500, headers });
        }
      }

      // HTML UI pro testování hesel - přidejte také tento endpoint
      if (url.pathname === '/debug-password-ui' && request.method === 'GET') {
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Password Hash Debugger</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 {
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
          }
          .form-group {
            margin: 20px 0;
          }
          label {
            display: block;
            font-weight: bold;
            margin-bottom: 5px;
            color: #555;
          }
          input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
          }
          button {
            background: #4CAF50;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
          }
          button:hover {
            background: #45a049;
          }
          #result {
            margin-top: 30px;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 4px;
            border-left: 4px solid #2196F3;
            display: none;
          }
          #result.success {
            border-left-color: #4CAF50;
            background: #e8f5e9;
          }
          #result.error {
            border-left-color: #f44336;
            background: #ffebee;
          }
          pre {
            background: #263238;
            color: #aed581;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 13px;
          }
          .status {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 15px;
          }
          .success-icon { color: #4CAF50; }
          .error-icon { color: #f44336; }
          .info-box {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 4px;
            margin: 15px 0;
            border-left: 4px solid #2196F3;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔐 Password Hash Debugger</h1>
          
          <div class="info-box">
            <strong>Použití:</strong> Zadejte heslo a email pro kontrolu, zda heslo odpovídá hashi v databázi.
          </div>

          <form id="testForm">
            <div class="form-group">
              <label>Heslo k testování:</label>
              <input type="text" id="password" placeholder="Zadejte heslo (např. Testest1.)" required>
              <small style="color: #666;">Tip: Zkuste váš test heslo "Testest1."</small>
            </div>

            <div class="form-group">
              <label>Email uživatele (volitelné):</label>
              <input type="email" id="email" placeholder="user@example.com">
              <small style="color: #666;">Pokud zadáte email, ověří se heslo proti DB</small>
            </div>

            <button type="submit">🔍 Test Password Hash</button>
          </form>

          <div id="result"></div>
        </div>

        <script>
          document.getElementById('testForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const email = document.getElementById('email').value;
            const resultDiv = document.getElementById('result');
            
            resultDiv.style.display = 'block';
            resultDiv.className = '';
            resultDiv.innerHTML = '<p>⏳ Testování...</p>';

            try {
              const response = await fetch('/api/debug/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, email })
              });

              const data = await response.json();

              if (data.verification.password_matches === true) {
                resultDiv.className = 'success';
                resultDiv.innerHTML = \`
                  <div class="status success-icon">✅ HESLO JE SPRÁVNÉ!</div>
                  <p><strong>Zadané heslo:</strong> \${password}</p>
                  <p><strong>Email:</strong> \${data.database.user_email}</p>
                  <p><strong>Verifikace:</strong> Hash v databázi odpovídá vašemu heslu</p>
                  <h3>Detaily:</h3>
                  <pre>\${JSON.stringify(data, null, 2)}</pre>
                \`;
              } else if (data.verification.password_matches === false) {
                resultDiv.className = 'error';
                resultDiv.innerHTML = \`
                  <div class="status error-icon">❌ HESLO NESEDÍ!</div>
                  <p><strong>Zadané heslo:</strong> \${password}</p>
                  <p><strong>Email:</strong> \${data.database.user_email || 'nenalezen'}</p>
                  <p><strong>Problém:</strong> Hash v databázi NEODPOVÍDÁ vašemu heslu</p>
                  <div class="info-box">
                    <strong>Možné příčiny:</strong>
                    <ul>
                      <li>Překlep v hesle (case-sensitive!)</li>
                      <li>Extra mezery na začátku/konci</li>
                      <li>Hash v DB je od jiného hesla</li>
                    </ul>
                  </div>
                  <h3>Detaily:</h3>
                  <pre>\${JSON.stringify(data, null, 2)}</pre>
                \`;
              } else {
                resultDiv.innerHTML = \`
                  <div class="status">ℹ️ INFO</div>
                  <p>Email nebyl zadán nebo uživatel nenalezen. Zde je jak by vypadal hash:</p>
                  <h3>Detaily:</h3>
                  <pre>\${JSON.stringify(data, null, 2)}</pre>
                \`;
              }
            } catch (error) {
              resultDiv.className = 'error';
              resultDiv.innerHTML = \`
                <div class="status error-icon">❌ CHYBA</div>
                <p><strong>Error:</strong> \${error.message}</p>
              \`;
            }
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