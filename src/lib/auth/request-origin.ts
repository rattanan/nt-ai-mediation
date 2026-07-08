import type { NextRequest } from "next/server";

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

export function getRequestOrigin(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const host = forwardedHost || firstHeaderValue(request.headers.get("host"));
  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const protocol = forwardedProto || requestUrl.protocol.replace(":", "");

  if (host) {
    return `${protocol}://${host}`;
  }

  if (requestUrl.hostname === "0.0.0.0") {
    requestUrl.hostname = "localhost";
  }

  return requestUrl.origin;
}
