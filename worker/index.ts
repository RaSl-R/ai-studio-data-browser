import { neon } from '@neondatabase/serverless';

export default {
  async fetch(request, env, ctx) {
    // Tento výpis nám v prohlížeči ukáže, jaké klíče v env vlastně jsou
    const keys = Object.keys(env);
    
    if (!env.DATABASE_URL) {
      return new Response(JSON.stringify({ 
        error: "DATABASE_URL chybí!",
        nalezene_klice: keys, // Tady uvidíme, co tam Cloudflare skutečně posílá
        vzkaz: "Pokud je pole nalezene_klice prázdné, wrangler.toml přebíjí dashboard."
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(env.DATABASE_URL);
    const url = new URL(request.url);

    try {
      if (url.pathname === '/api/health' || url.pathname === '/') {
        const result = await sql`SELECT NOW() as time`;
        return new Response(JSON.stringify({ 
          status: 'online', 
          db_time: result[0].time 
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*' 
          }
        });
      }
      
      // ... zbytek vašich rout
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
};