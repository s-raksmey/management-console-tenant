import { NextResponse } from "next/server";
import type { MediaFile, MediaType, MediaUploadOptions } from "@/types/media";
import { getRateLimitRetryAfter } from "@/lib/rate-limit";
import { getForwardedTenantHeaders } from "@/lib/tenant-request-headers";
import {
  deleteServerMediaAsset,
  listServerMediaAssets,
  persistProcessedMedia,
  updateServerMediaAsset,
} from "@/lib/media-server";

type AuthenticatedMediaUser = {
  id: string;
  name: string;
};

type RolePermissionConfig = {
  role: string;
  permissions: string[];
};

async function requireMediaPermission(req: Request, allowedPermissions: string[]) {
  const authorization = req.headers.get("authorization");
  const cookie = req.headers.get("cookie");
  if (!authorization && !cookie) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 }
    );
  }

  const response = await fetch(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(authorization ? { authorization } : {}),
      ...(cookie ? { cookie } : {}),
      ...getForwardedTenantHeaders(req),
    },
    body: JSON.stringify({
      query: `
        query MediaPermissionCheck {
          me {
            success
            user {
              id
              email
              name
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
  });

  const result = await response.json();
  const userRole = result?.data?.me?.user?.role;
  const matrix = (result?.data?.rolePermissionMatrix || []) as RolePermissionConfig[];
  const rolePermissions =
    matrix.find((item) => item.role === userRole)?.permissions || [];
  const hasAccess = allowedPermissions.some((permission) =>
    rolePermissions.includes(permission)
  );

  if (
    !result?.data?.me?.success ||
    (userRole !== "SUPER_ADMIN" && !hasAccess)
  ) {
    return NextResponse.json(
      { success: false, message: "Permission denied" },
      { status: 403 }
    );
  }

  return {
    id: result.data.me.user.id as string,
    name: (result.data.me.user.name || result.data.me.user.email) as string,
  } satisfies AuthenticatedMediaUser;
}

const MIME_TYPE_MAP: Record<string, MediaType> = {
  "image/jpeg": "image",
  "image/jpg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "video/mp4": "video",
  "video/webm": "video",
  "video/ogg": "video",
  "video/avi": "video",
  "video/mov": "video",
  "audio/mp3": "audio",
  "audio/wav": "audio",
  "audio/ogg": "audio",
  "audio/m4a": "audio",
  "application/pdf": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "application/vnd.ms-excel": "document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "document",
  "text/plain": "document",
  "text/csv": "document",
};

const SIZE_LIMITS = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  document: 25 * 1024 * 1024,
  other: 10 * 1024 * 1024,
};
const MAX_UPLOAD_SIZE = Math.max(...Object.values(SIZE_LIMITS));
const ALLOWED_MIME_TYPES = new Set(Object.keys(MIME_TYPE_MAP));

function getMediaType(mimeType: string): MediaType {
  return MIME_TYPE_MAP[mimeType] || "other";
}

function normalizeFolder(folder?: string): string {
  if (!folder) return "";

  return folder
    .split(/[\\/]+/)
    .map((segment) => sanitizeFilename(segment))
    .filter(Boolean)
    .join("/");
}

function sanitizeFilename(filename: string): string {
  return (
    filename
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "upload"
  );
}

function mimeTypeFromFormat(format?: string) {
  if (format === "jpeg") return "image/jpeg";
  if (format === "png") return "image/png";
  if (format === "webp") return "image/webp";
  if (format === "gif") return "image/gif";
  return "";
}

async function loadSharp() {
  return (await import("sharp")).default;
}

async function processImage(
  buffer: Buffer,
  options: MediaUploadOptions = {}
): Promise<{ buffer: Buffer; width?: number; height?: number; mimeType: string }> {
  const sharp = await loadSharp();
  const { maxWidth = 1920, maxHeight = 1080, quality = 85 } = options;
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const needsResize =
    (metadata.width && metadata.width > maxWidth) ||
    (metadata.height && metadata.height > maxHeight);

  if (needsResize) {
    const resized = image.resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    });
    const keepAlpha = Boolean(metadata.hasAlpha) && metadata.format !== "jpeg";
    const processed = keepAlpha
      ? metadata.format === "webp"
        ? await resized.webp({ quality }).toBuffer()
        : await resized.png().toBuffer()
      : await resized.jpeg({ quality, mozjpeg: true }).toBuffer();
    const newMetadata = await sharp(processed).metadata();
    return {
      buffer: processed,
      width: newMetadata.width,
      height: newMetadata.height,
      mimeType: keepAlpha
        ? metadata.format === "webp"
          ? "image/webp"
          : "image/png"
        : "image/jpeg",
    };
  }

  return {
    buffer,
    width: metadata.width,
    height: metadata.height,
    mimeType: mimeTypeFromFormat(metadata.format),
  };
}

function mediaErrorStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "Authentication required") return 401;
  if (message.startsWith("Permission denied")) return 403;
  if (message === "File not found") return 404;
  return 500;
}

export async function POST(req: Request) {
  try {
    const retryAfter = getRateLimitRetryAfter(req, {
      key: "media-upload",
      windowMs: 10 * 60 * 1000,
      max: 30,
    });
    if (retryAfter) {
      return NextResponse.json(
        { success: false, message: `Too many uploads. Try again in ${retryAfter} seconds.` },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { success: false, message: "Upload is too large" },
        { status: 413 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const optionsStr = formData.get("options") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    const options: MediaUploadOptions = optionsStr ? JSON.parse(optionsStr) : {};
    const folder = normalizeFolder(options.folder);
    const uploadPermissions =
      folder === "ads"
        ? ["MANAGE_MEDIA", "CREATE_ADS", "UPDATE_ADS"]
        : folder === "carousel"
          ? ["MANAGE_MEDIA", "CREATE_CAROUSEL", "UPDATE_CAROUSEL"]
          : ["MANAGE_MEDIA"];
    const authenticatedUser = await requireMediaPermission(req, uploadPermissions);
    if (authenticatedUser instanceof NextResponse) return authenticatedUser;

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, message: "Unsupported file type" },
        { status: 415 }
      );
    }

    const mediaType = getMediaType(file.type);
    if (file.size > SIZE_LIMITS[mediaType]) {
      return NextResponse.json(
        {
          success: false,
          message: `File too large. Maximum size for ${mediaType} files is ${SIZE_LIMITS[mediaType] / (1024 * 1024)}MB`,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let processedBuffer = buffer;
    let width: number | undefined;
    let height: number | undefined;
    let mimeType = file.type;
    let originalName = file.name;

    if (mediaType === "image" && file.type !== "image/gif") {
      const processed = await processImage(buffer, options);
      processedBuffer = Buffer.from(processed.buffer);
      width = processed.width;
      height = processed.height;
      if (processed.mimeType) {
        mimeType = processed.mimeType;
        if (mimeType === "image/jpeg" && !originalName.toLowerCase().endsWith(".jpg") && !originalName.toLowerCase().endsWith(".jpeg")) {
          originalName = `${originalName.replace(/\.[^.]+$/, "")}.jpg`;
        }
        if (mimeType === "image/png" && !originalName.toLowerCase().endsWith(".png")) {
          originalName = `${originalName.replace(/\.[^.]+$/, "")}.png`;
        }
        if (mimeType === "image/webp" && !originalName.toLowerCase().endsWith(".webp")) {
          originalName = `${originalName.replace(/\.[^.]+$/, "")}.webp`;
        }
      }
    } else if (mediaType === "image") {
      try {
        const sharp = await loadSharp();
        const metadata = await sharp(buffer).metadata();
        width = metadata.width;
        height = metadata.height;
      } catch {
        // Ignore errors for unsupported image metadata.
      }
    }

    const mediaFile = await persistProcessedMedia(req, {
      buffer: processedBuffer,
      originalName,
      mimeType,
      folder,
      alt: options.alt,
      caption: options.caption,
      tags: options.tags,
      width,
      height,
    });

    return NextResponse.json({
      success: true,
      file: mediaFile,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Upload failed" },
      { status: mediaErrorStatus(error) }
    );
  }
}

export async function GET(req: Request) {
  try {
    const permissionError = await requireMediaPermission(req, ["VIEW_MEDIA", "MANAGE_MEDIA"]);
    if (permissionError instanceof NextResponse) return permissionError;

    const { searchParams } = new URL(req.url);
    const folder = normalizeFolder(searchParams.get("folder") || "");
    const library = await listServerMediaAssets(req, folder);

    return NextResponse.json({
      success: true,
      files: library.files,
      folders: library.folders,
    });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to list files" },
      { status: mediaErrorStatus(error) }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const permissionError = await requireMediaPermission(req, ["MANAGE_MEDIA"]);
    if (permissionError instanceof NextResponse) return permissionError;

    const input = (await req.json()) as {
      id?: string;
      alt?: string;
      caption?: string;
      tags?: string[];
    };

    if (!input.id) {
      return NextResponse.json(
        { success: false, message: "File ID is required" },
        { status: 400 }
      );
    }

    const updatedFile = await updateServerMediaAsset(req, {
      id: input.id,
      alt: input.alt,
      caption: input.caption,
      tags: input.tags,
    });

    return NextResponse.json({
      success: true,
      file: updatedFile,
      message: "File metadata updated successfully",
    });
  } catch (error) {
    console.error("Update media metadata error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to update file metadata" },
      { status: mediaErrorStatus(error) }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const permissionError = await requireMediaPermission(req, ["MANAGE_MEDIA"]);
    if (permissionError instanceof NextResponse) return permissionError;

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("id");

    if (!fileId) {
      return NextResponse.json(
        { success: false, message: "File ID is required" },
        { status: 400 }
      );
    }

    await deleteServerMediaAsset(req, fileId);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to delete file" },
      { status: mediaErrorStatus(error) }
    );
  }
}
