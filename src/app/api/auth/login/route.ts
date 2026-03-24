import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
   const clientId = process.env.CLIENT_ID!;
   const redirectUri = process.env.GOOGLE_REDIRECT_URI!;
   const url = new URL(req.url);
   const callback = url.searchParams.get("callbackUrl");

  if (!clientId || !redirectUri)
    return NextResponse.json({ error: "Missing OAuth config" }, { status: 500 });

  const codeVerifier = randomBytes(32).toString("base64url");
  const base64url = (buf: Buffer) =>
    buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const codeChallenge = base64url(createHash("sha256").update(codeVerifier).digest());

  const state = randomBytes(16).toString("hex");

  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, { httpOnly: true, sameSite: "lax", secure:true, path: "/", maxAge: 600 });
  cookieStore.set("code_verifier", codeVerifier, { httpOnly: true, sameSite: "lax", secure:true, path: "/", maxAge: 600 });
   if (callback) {
      cookieStore.set("callbackUrl", callback, { httpOnly: true, sameSite: "lax", secure:true, path: "/", maxAge: 600 });
   }

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("code_challenge", codeChallenge);

  return NextResponse.redirect(authUrl.toString());
}
