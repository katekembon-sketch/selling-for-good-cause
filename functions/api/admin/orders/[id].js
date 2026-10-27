// Cloudflare Pages Function: PATCH /api/admin/orders/:id
// Cloudflare Access must protect this route; the header check is defense in depth only.
const ALLOWED = new Set(['pending', 'approved', 'rejected', 'delivered']);
export async function onRequestPatch({ env, request, params }) {
  if (!request.headers.get('Cf-Access-Jwt-Assertion')) return json({ error: 'Access denied. Sign in through Cloudflare Access.' }, 401);
  if (!env.DB) return json({ error: 'D1 binding DB is missing.' }, 500);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  const map = { approve: 'approved', reject: 'rejected', delivered: 'delivered', pending: 'pending', approved: 'approved', rejected: 'rejected' };
  const next = map[body?.status];
  if (!ALLOWED.has(next)) return json({ error: 'Status must be approve, reject, delivered, or pending.' }, 400);
  try {
    const result = await env.DB.prepare('UPDATE candy_orders SET status = ? WHERE id = ?').bind(next, params.id).run();
    if (!result.meta?.changes) return json({ error: 'Order not found.' }, 404);
    return json({ ok: true, id: params.id, status: next });
  } catch { return json({ error: 'Could not update order. Check D1 table and column names.' }, 500); }
}
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } }); }
