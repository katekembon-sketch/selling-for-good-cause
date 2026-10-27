// Cloudflare Pages Function: GET /api/admin/orders
// Protect /api/admin/* with a Cloudflare Access application/policy before deploying.
export async function onRequestGet({ env, request }) {
  if (!request.headers.get('Cf-Access-Jwt-Assertion')) return json({ error: 'Access denied. Sign in through Cloudflare Access.' }, 401);
  if (!env.DB) return json({ error: 'D1 binding DB is missing.' }, 500);
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, recipient_name, block, message, status, created_at, is_anonymous
       FROM candy_orders ORDER BY created_at DESC LIMIT 1000`
    ).all();
    return json({ orders: results || [] });
  } catch (e) {
    return json({ error: 'Could not read candy_orders. Check the table/column names against schema.sql.' }, 500);
  }
}
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } }); }
