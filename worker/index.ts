import { neon } from '@neondatabase/serverless';

export default {
  async fetch(request, env, ctx) {
    // 1. KLIČOVÝ KROK: Musíte použít env.DATABASE_URL uvnitř fetch
    if (!env.DATABASE_URL) {
      return new Response(JSON.stringify({ 
        error: "DATABASE_URL is missing in env object!" 
      }), { status: 500 });
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