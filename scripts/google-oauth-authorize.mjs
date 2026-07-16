import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { OAuth2Client } from "google-auth-library";

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const port = Number(process.env.GOOGLE_OAUTH_LOCAL_PORT || 53682);
const redirectUri = `http://127.0.0.1:${port}/oauth2/callback`;

if (!clientId || !clientSecret) {
  console.error("Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in .env first.");
  process.exit(1);
}

const oauth = new OAuth2Client(clientId, clientSecret, redirectUri);
const state = randomBytes(32).toString("hex");
const authorizationUrl = oauth.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  include_granted_scopes: true,
  scope: ["https://www.googleapis.com/auth/calendar.events"],
  state,
});

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", redirectUri);
  if (url.pathname !== "/oauth2/callback") {
    response.writeHead(404).end("Not found");
    return;
  }
  if (url.searchParams.get("state") !== state) {
    response.writeHead(400).end("Invalid OAuth state");
    return;
  }
  const code = url.searchParams.get("code");
  if (!code) {
    response.writeHead(400).end(`Google authorization failed: ${url.searchParams.get("error") || "missing code"}`);
    return;
  }

  try {
    const { tokens } = await oauth.getToken(code);
    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Authorization completed. Return to the terminal.");
    console.log("\nAdd this value to .env and Secret Manager:");
    console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token || "(Google did not return a refresh token; revoke the app grant and try again)"}`);
    server.close();
  } catch (error) {
    response.writeHead(500).end("Token exchange failed");
    console.error("Google token exchange failed:", error instanceof Error ? error.message : error);
    server.close();
    process.exitCode = 1;
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Add this authorized redirect URI to the Google OAuth client: ${redirectUri}`);
  console.log("Then open this URL in a browser and authorize the organizer Google account:\n");
  console.log(authorizationUrl);
});
