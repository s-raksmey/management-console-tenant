import { NextResponse } from "next/server";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { getRateLimitRetryAfter } from "@/lib/rate-limit";

type RolePermissionConfig = {
  role: string;
  permissions: string[];
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

async function requireUploadPermission(req: Request) {
  const authorization = req.headers.get("authorization");
  const cookie = req.headers.get("cookie");
  if (!authorization && !cookie) {
    return NextResponse.json(
      { success: 0, message: "Authentication required" },
      { status: 401 }
    );
  }

  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(authorization ? { authorization } : {}),
        ...(cookie ? { cookie } : {}),
        ...(req.headers.get("x-tenant-id")
          ? { "x-tenant-id": req.headers.get("x-tenant-id") as string }
          : {}),
      },
      body: JSON.stringify({
        query: `
          query UploadPermissionCheck {
            me {
              success
              user {
                role
              }
            }
            rolePermissionMatrix {
              role
              permissions
            }
          }
        `,
      }),
    }
  );

  if (!response.ok) {
    return NextResponse.json(
      { success: 0, message: "Authentication check failed" },
      { status: 502 }
    );
  }

  const result = await response.json();
  const userRole = result?.data?.me?.user?.role;
  const matrix = (result?.data?.rolePermissionMatrix ||
    []) as RolePermissionConfig[];
  const rolePermissions =
    matrix.find((item) => item.role === userRole)?.permissions || [];
  const allowedPermissions = [
    "MANAGE_MEDIA",
    "CREATE_ARTICLE",
    "UPDATE_OWN_ARTICLE",
    "UPDATE_ANY_ARTICLE",
  ];
  const hasAccess = allowedPermissions.some((permission) =>
    rolePermissions.includes(permission)
  );

  if (!result?.data?.me?.success || (userRole !== "SUPER_ADMIN" && !hasAccess)) {
    return NextResponse.json(
      { success: 0, message: "Permission denied" },
      { status: 403 }
    );
  }

  return null;
}

function sanitizeBaseName(filename: string) {
  const parsed = path.parse(filename);
  return (
    parsed.name
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "upload"
  );
}

export async function POST(req: Request) {
  try {
    const retryAfter = getRateLimitRetryAfter(req, {
      key: "image-upload",
      windowMs: 10 * 60 * 1000,
      max: 30,
    });
    if (retryAfter) {
      return NextResponse.json(
        { success: 0, message: `Too many uploads. Try again in ${retryAfter} seconds.` },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { success: 0, message: "Image must be 10MB or smaller" },
        { status: 413 }
      );
    }

    const permissionError = await requireUploadPermission(req);
    if (permissionError) return permissionError;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: 0, message: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: 0, message: "Only JPEG, PNG, and WebP images are allowed" },
        { status: 415 }
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { success: 0, message: "Image must be 10MB or smaller" },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Read metadata
    const meta = await sharp(buffer).metadata();

    // Decide resize width dynamically (NEVER upscale)
    const targetWidth =
      meta.width && meta.width > 1600 ? 1600 : meta.width;

    // Ensure upload directory
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeName = sanitizeBaseName(file.name);
    const filename = `${Date.now()}-${safeName}.jpg`;
    const outputPath = path.join(uploadDir, filename);

    // ✅ Save image (preserve quality, downscale only)
    await sharp(buffer)
      .resize({
        width: targetWidth,
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 90,
        mozjpeg: true,
      })
      .toFile(outputPath);

    return NextResponse.json({
      success: 1,
      file: {
        url: `/uploads/${filename}`,
        width: meta.width,
        height: meta.height,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: 0, message: "Upload failed" },
      { status: 500 }
    );
  }
}
