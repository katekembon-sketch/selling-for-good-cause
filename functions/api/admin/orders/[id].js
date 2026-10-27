
const ALLOWED = new Set(["pending", "approved", "rejected", "delivered"]);

export async function onRequestPatch({ env, request, params }) {
  if (!(await isAdmin(request, env))) {
    return json({ error: "Please sign in to the admin dashboard." }, 401);
  }

  if (!env.DB) {
    return json({ error: "D1 binding DB is missing." }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const map = {
    approve: "approved",
    reject: "rejected",
    delivered: "delivered",
    pending: "pending",
    approved: "approved",
    rejected: "rejected"
  };

  const next = map[body?.status];
  if (!ALLOWED.has(next)) {
    return json({ error: "Invalid order status." }, 400);
  }

  try {
    const result = await env.DB.prepare(
      "UPDATE candy_orders SET status = ? WHERE id = ?"
    ).bind(next, params.id).run();

    if (!result.meta?.changes) {
      return json({ error: "Order not found." }, 404);
    }

    return json({ ok: true, id: params.id, status: next });
  } catch {
    return json({ error: "Could not update the order." }, 500);
  }
}

export async function onRequestDelete({ env, request, params }) {
  if (!(await isAdmin(request, env))) {
    return json({ error: "Please sign in to the admin dashboard." }, 401);
  }

  if (!env.DB) {
    return json({ error: "D1 binding DB is missing." }, 500);
  }

  const id = String(params.id || "");
  if (!/^\d+$/.test(id)) {
    return json({ error: "Invalid order ID." }, 400);
  }

  try {
    const result = await env.DB.prepare(
      "DELETE FROM candy_orders WHERE id = ?"
    ).bind(Number(id)).run();

    if (!result.meta?.changes) {
      return json({ error: "Order not found." }, 404);
    }

    return json({ ok: true, id });
  } catch {
    return json({ error: "Could not delete the order." }, 500);
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
