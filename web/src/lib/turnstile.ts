export async function verifyTurnstile(token: string, remoteIp: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!token || !secret) return false;
  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: remoteIp || "" });
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}
