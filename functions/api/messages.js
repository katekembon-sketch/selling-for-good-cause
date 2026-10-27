export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "The order form is not connected yet. Please contact the club in person." }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Please check your form and try again." }, 400); }
  const recipient = clean(body.recipient, 80), block = clean(body.block, 40), message = clean(body.message, 220);
  const anonymous = body.anonymous === true, sender = anonymous ? "" : clean(body.sender, 80);
  if (!recipient || !block || !message) return json({ error: "Please fill in the recipient, 4th block, and message." }, 400);
  if (!anonymous && !sender) return json({ error: "Add your name or choose anonymous sending." }, 400);
  if (message.length < 2) return json({ error: "Please write a slightly longer message." }, 400);
  try {
    await env.DB.prepare(`INSERT INTO candy_orders (recipient, block, message, anonymous, sender, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))`).bind(recipient, block, message, anonymous ? 1 : 0, sender).run();
    return json({ ok: true }, 201);
  } catch { return json({ error: "We couldn't save your order right now. Please try again later or contact the club in person." }, 500); }
}
function clean(v, max) { return typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : ""; }
function json(data, status=200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }); }
