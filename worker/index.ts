// worker/index.ts – MINIMAL HASH DEBUG
import * as hashWasm from 'hash-wasm';

export default {
  async fetch(request: Request): Promise<Response> {

    const url = new URL(request.url);

    // HTML UI
    if (url.pathname === '/debug-password-ui') {
      return new Response(`
<!DOCTYPE html>
<html lang="cs">
<body>
<input id="p" placeholder="heslo">
<pre id="h"></pre>
<script>
document.getElementById('p').oninput = async e => {
  const password = e.target.value;
  if (!password) return h.textContent='';
  const r = await fetch('/api/debug/hash',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
  h.textContent = (await r.json()).hash;
};
</script>
</body>
</html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    // HASH API
    if (url.pathname === '/api/debug/hash' && request.method === 'POST') {
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

      return new Response(JSON.stringify({ hash }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404 });
  }
};
