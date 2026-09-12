import type { NextRequest } from "next/server";
import { getForwardedTenantHeaders } from "@/lib/tenant-request-headers";

const ALLOWED_PREVIEW_HOSTS = [
  "youtube.com",
  "youtu.be",
  "facebook.com",
  "instagram.com",
];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isPrivateHostname(hostname: string) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host === "::1") {
    return true;
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return host === "0.0.0.0";

  const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isAllowedPreviewUrl(rawUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") return false;
  if (parsed.username || parsed.password) return false;

  const hostname = parsed.hostname.toLowerCase();
  if (isPrivateHostname(hostname)) return false;

  return ALLOWED_PREVIEW_HOSTS.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`)
  );
}

async function requireAdminSession(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  const cookie = req.headers.get("cookie");
  if (!authorization && !cookie) {
    return json({ success: 0, message: "Authentication required" }, 401);
  }

  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(authorization ? { authorization } : {}),
        ...(cookie ? { cookie } : {}),
        ...getForwardedTenantHeaders(req),
      },
      body: JSON.stringify({
        query: `
          query LinkPreviewAuthCheck {
            me {
              success
              user {
                id
              }
            }
          }
        `,
      }),
    }
  );

  if (!response.ok) {
    return json({ success: 0, message: "Authentication check failed" }, 502);
  }

  const result = await response.json();
  if (!result?.data?.me?.success || !result?.data?.me?.user?.id) {
    return json({ success: 0, message: "Authentication required" }, 401);
  }

  return null;
}

export async function GET(req: NextRequest) {
  const authError = await requireAdminSession(req);
  if (authError) return authError;

  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return json({ success: 0 });
  }

  return handleLinkPreview(url);
}

export async function POST(req: NextRequest) {
  const authError = await requireAdminSession(req);
  if (authError) return authError;

  const body = await req.json();
  const url = body?.url;
  if (!url) {
    return json({ success: 0 });
  }

  return handleLinkPreview(url);
}

async function handleLinkPreview(url: string) {
  try {
    if (!isAllowedPreviewUrl(url)) {
      return json({ success: 0 });
    }

    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!res.ok || !isAllowedPreviewUrl(res.url)) {
      return json({ success: 0 });
    }

    const html = await res.text();
    const title = html.match(/<title>(.*?)<\/title>/i)?.[1] ?? url;
    const description =
      html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i)?.[1] ??
      "";
    const image =
      html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i)?.[1] ??
      "";

    return json({
      success: 1,
      meta: {
        title,
        description,
        image: image ? { url: image } : undefined,
      },
    });
  } catch {
    return json({ success: 0 });
  }
}
