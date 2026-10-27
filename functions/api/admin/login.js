
export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
    return json({ error: "Admin login is not configured." }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  if (
    typeof body.username !== "string" ||
    typeof body.password !== "string" ||
    body.username !== env.ADMIN_USERNAME ||
    body.password !== env.ADMIN_PASSWORD
  ) {
    return json({ error: "Incorrect username or password." }, 401);
  }

  const expires = Math.floor(Date.now() / 1000) + 8 * 60 * 60;
  const payload = `${env.ADMIN_USERNAME}:${expires}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.ADMIN_PASSWORD),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  const token = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return json(
    { ok: true },
    200,
    `admin_session=${expires}.${token}; HttpOnly; Secure; SameSite=Strict; Path=/api/admin/; Max-Age=28800`
  );
}

function json(data, status = 200, cookie = null) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };
  if (cookie) headers["Set-Cookie"] = cookie;
  return new Response(JSON.stringify(data), { status, headers });
}
