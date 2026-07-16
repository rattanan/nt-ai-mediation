import "server-only";

import { GoogleAuth, JWT, OAuth2Client } from "google-auth-library";

export async function getGoogleAccessToken(scopes: string[], delegatedSubject?: string) {
  const oauthClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const oauthClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const oauthRefreshToken =
    process.env.GOOGLE_CALENDAR_OAUTH_REFRESH_TOKEN ||
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (delegatedSubject && oauthClientId && oauthClientSecret && oauthRefreshToken) {
    const client = new OAuth2Client(oauthClientId, oauthClientSecret);
    client.setCredentials({ refresh_token: oauthRefreshToken });
    const token = await client.getAccessToken();
    const value = typeof token === "string" ? token : token?.token;
    if (!value) throw new Error("Google OAuth access token is unavailable");
    return value;
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const client = delegatedSubject
    ? new JWT({ email, key, subject: delegatedSubject, scopes })
    : email && key
      ? new JWT({ email, key, scopes })
      : await new GoogleAuth({ scopes }).getClient();

  if (delegatedSubject && (!email || !key)) {
    throw new Error(
      "Google user authorization requires GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REFRESH_TOKEN, or Workspace domain-wide delegation",
    );
  }
  const token = await client.getAccessToken();
  const value = typeof token === "string" ? token : token?.token;
  if (!value) throw new Error("Google access token is unavailable");
  return value;
}
