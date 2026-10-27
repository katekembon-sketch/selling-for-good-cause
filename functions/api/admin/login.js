
export async function onRequestGet({ env, request }) {
  if (!(await isAdmin(request, env))) {
    return json({ error: "Please sign in to the admin dashboard." }, 401);
  }

  if (!env.DB) {
    return json({ error: "D1 binding DB is missing." }, 500);
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT id, recipient_name, block, message, status, created_at, is_anonymous
       FROM candy_orders ORDER BY created_at DESC LIMIT 1000`
    ).all();

    return json({ orders: results || [] });
  } catch {
    return json({ error: "Could not read candy orders. Check table and column names." }, 500);
  }
}

async function isAdmin(request, env) {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) return false;

  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)admin_session=(\d+)\.([A-Za-z0-9_-]+)/);
  if (!match) return false;

  const expires = Number(match[1]);
  if (!Number.isSafeInteger(expires) || expires <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  try {
    const payload = `${env.ADMIN_USERNAME}:${expires}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(env.ADMIN_PASSWORD),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    let encoded = match[2].replace(/-/g, "+").replace(/_/g, "/");
    encoded += "=".repeat((4 - encoded.length % 4) % 4);
    const signature = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));

    return await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      new TextEncoder().encode(payload)
    );
  } catch {
    return false;
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
