import { NextResponse } from "next/server";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { MediaFile, MediaType, MediaUploadOptions } from "@/types/media";

type RolePermissionConfig = {
  role: string;
  permissions: string[];
};

async function requireMediaPermission(req: Request, allowedPermissions: string[]) {
  const authorization = req.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 }
    );
  }

  const response = await fetch(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization,
      ...(req.headers.get("x-tenant-id")
        ? { "x-tenant-id": req.headers.get("x-tenant-id") as string }
        : {}),
    },
    body: JSON.stringify({
      query: `
        query MediaPermissionCheck {
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

  return null;
}

// File type mappings
const MIME_TYPE_MAP: Record<string, MediaType> = {
  // Images
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/svg+xml': 'image',
  
  // Videos
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/ogg': 'video',
  'video/avi': 'video',
  'video/mov': 'video',
  
  // Audio
  'audio/mp3': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/m4a': 'audio',
  
  // Documents
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.ms-excel': 'document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
  'text/plain': 'document',
  'text/csv': 'document',
};

// File size limits (in bytes)
const SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  audio: 50 * 1024 * 1024, // 50MB
  document: 25 * 1024 * 1024, // 25MB
  other: 10 * 1024 * 1024, // 10MB
};

const UPLOAD_DIR = path.join(process.cwd(), "public/uploads");
const MEDIA_MANIFEST_PATH = path.join(UPLOAD_DIR, ".media-library.json");

type MediaManifest = {
  files: Record<string, MediaFile>;
};

function getMediaType(mimeType: string): MediaType {
  return MIME_TYPE_MAP[mimeType] || 'other';
}

function normalizeFolder(folder?: string): string {
  if (!folder) return "";

  return folder
    .split(/[\\/]+/)
    .map((segment) => sanitizeFilename(segment))
    .filter(Boolean)
    .join("/");
}

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function readManifest(): MediaManifest {
  ensureUploadDir();

  if (!fs.existsSync(MEDIA_MANIFEST_PATH)) {
    return { files: {} };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(MEDIA_MANIFEST_PATH, "utf8")) as MediaManifest;
    return {
      files: parsed.files && typeof parsed.files === "object" ? parsed.files : {},
    };
  } catch {
    return { files: {} };
  }
}

function writeManifest(manifest: MediaManifest) {
  ensureUploadDir();
  fs.writeFileSync(MEDIA_MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

function getRelativePath(file: Pick<MediaFile, "filename" | "folder">): string {
  return file.folder ? `${file.folder}/${file.filename}` : file.filename;
}

function getDiskPath(file: Pick<MediaFile, "filename" | "folder">): string {
  const diskPath = path.resolve(UPLOAD_DIR, getRelativePath(file));
  const uploadRoot = path.resolve(UPLOAD_DIR);

  if (diskPath !== uploadRoot && !diskPath.startsWith(`${uploadRoot}${path.sep}`)) {
    throw new Error("Invalid media path");
  }

  return diskPath;
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function processImage(
  buffer: Buffer,
  options: MediaUploadOptions = {}
): Promise<{ buffer: Buffer; width?: number; height?: number }> {
  const { maxWidth = 1920, maxHeight = 1080, quality = 85 } = options;
  
  const image = sharp(buffer);
  const metadata = await image.metadata();
  
  // Only resize if image is larger than max dimensions
  const needsResize = 
    (metadata.width && metadata.width > maxWidth) ||
    (metadata.height && metadata.height > maxHeight);
  
  if (needsResize) {
    const processed = await image
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    
    const newMetadata = await sharp(processed).metadata();
    return {
      buffer: processed,
      width: newMetadata.width,
      height: newMetadata.height,
    };
  }
  
  return {
    buffer,
    width: metadata.width,
    height: metadata.height,
  };
}

export async function POST(req: Request) {
  try {
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
    const permissionError = await requireMediaPermission(
      req,
      folder === "ads"
        ? ["MANAGE_MEDIA", "CREATE_ADS", "UPDATE_ADS"]
        : ["MANAGE_MEDIA"],
    );
    if (permissionError) return permissionError;

    const mediaType = getMediaType(file.type);
    
    // Check file size
    if (file.size > SIZE_LIMITS[mediaType]) {
      return NextResponse.json(
        { 
          success: false, 
          message: `File too large. Maximum size for ${mediaType} files is ${SIZE_LIMITS[mediaType] / (1024 * 1024)}MB` 
        },
        { status: 400 }
      );
    }
    
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileId = uuidv4();
    const sanitizedName = sanitizeFilename(file.name);
    const timestamp = Date.now();
    const filename = `${timestamp}-${fileId}-${sanitizedName}`;
    
    // Create folder structure
    const folderPath = folder ? path.join(UPLOAD_DIR, folder) : UPLOAD_DIR;
    
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    const outputPath = path.join(folderPath, filename);
    let processedBuffer = buffer;
    let width: number | undefined;
    let height: number | undefined;
    
    // Process images
    if (mediaType === 'image' && file.type !== 'image/gif' && file.type !== 'image/svg+xml') {
      const processed = await processImage(buffer, options);
      processedBuffer = Buffer.from(processed.buffer);
      width = processed.width;
      height = processed.height;
    } else if (mediaType === 'image') {
      // For GIF and SVG, just get dimensions without processing
      try {
        const metadata = await sharp(buffer).metadata();
        width = metadata.width;
        height = metadata.height;
      } catch {
        // Ignore errors for SVG or unsupported formats
      }
    }
    
    // Save file
    fs.writeFileSync(outputPath, processedBuffer);
    
    // Create media file object
    const relativePath = folder ? `${folder}/${filename}` : filename;
    const mediaFile: MediaFile = {
      id: fileId,
      filename,
      originalName: file.name,
      url: `/uploads/${relativePath}`,
      type: mediaType,
      mimeType: file.type,
      size: processedBuffer.length,
      width,
      height,
      alt: options.alt,
      caption: options.caption,
      folder: folder || undefined,
      tags: options.tags || [],
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'current-user', // TODO: Get from auth context
      lastModified: new Date().toISOString(),
    };

    const manifest = readManifest();
    manifest.files[mediaFile.id] = mediaFile;
    writeManifest(manifest);
    
    return NextResponse.json({
      success: true,
      file: mediaFile,
      message: "File uploaded successfully",
    });
    
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: "Upload failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const permissionError = await requireMediaPermission(req, ["VIEW_MEDIA", "MANAGE_MEDIA"]);
    if (permissionError) return permissionError;

    const { searchParams } = new URL(req.url);
    const folder = normalizeFolder(searchParams.get('folder') || '');
    
    // Get files from upload directory
    const uploadDir = path.join(UPLOAD_DIR, folder);
    
    if (!fs.existsSync(uploadDir)) {
      return NextResponse.json({
        success: true,
        files: [],
        folders: [],
      });
    }
    
    const items = fs.readdirSync(uploadDir, { withFileTypes: true });
    const files: MediaFile[] = [];
    const folders: string[] = [];
    const manifest = readManifest();
    
    for (const item of items) {
      if (item.isDirectory()) {
        folders.push(item.name);
      } else if (item.isFile() && !item.name.startsWith(".")) {
        const filePath = path.join(uploadDir, item.name);
        const stats = fs.statSync(filePath);
        const relativePath = folder ? `${folder}/${item.name}` : item.name;
        
        // Try to determine file type from extension
        const ext = path.extname(item.name).toLowerCase();
        const mimeType = getMimeTypeFromExtension(ext);
        const mediaType = getMediaType(mimeType);
        
        const manifestFile = Object.values(manifest.files).find(
          (file) => getRelativePath(file) === relativePath
        );

        files.push({
          id: manifestFile?.id || item.name,
          filename: item.name,
          originalName: manifestFile?.originalName || item.name,
          url: `/uploads/${relativePath}`,
          type: manifestFile?.type || mediaType,
          mimeType: manifestFile?.mimeType || mimeType,
          size: stats.size,
          width: manifestFile?.width,
          height: manifestFile?.height,
          duration: manifestFile?.duration,
          alt: manifestFile?.alt,
          caption: manifestFile?.caption,
          folder: folder || undefined,
          tags: manifestFile?.tags || [],
          uploadedAt: manifestFile?.uploadedAt || stats.birthtime.toISOString(),
          uploadedBy: manifestFile?.uploadedBy || 'unknown',
          lastModified: stats.mtime.toISOString(),
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      files,
      folders,
    });
    
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { success: false, message: "Failed to list files" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const permissionError = await requireMediaPermission(req, ["MANAGE_MEDIA"]);
    if (permissionError) return permissionError;

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('id');
    const filename = searchParams.get('filename');
    
    if (!fileId || !filename) {
      return NextResponse.json(
        { success: false, message: "File ID and filename are required" },
        { status: 400 }
      );
    }
    
    const manifest = readManifest();
    const manifestFile = manifest.files[fileId];
    const fileToDelete = manifestFile || { filename, folder: undefined };
    const targetPath = getDiskPath(fileToDelete);
    const fileDeleted = fs.existsSync(targetPath);

    if (fileDeleted) {
      fs.unlinkSync(targetPath);
    }
    
    if (!fileDeleted) {
      return NextResponse.json(
        { success: false, message: "File not found" },
        { status: 404 }
      );
    }
    
    if (manifest.files[fileId]) {
      delete manifest.files[fileId];
    } else {
      for (const [id, file] of Object.entries(manifest.files)) {
        if (file.filename === filename) {
          delete manifest.files[id];
        }
      }
    }
    writeManifest(manifest);
    
    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
    
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete file" },
      { status: 500 }
    );
  }
}

function getMimeTypeFromExtension(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mp3': 'audio/mp3',
    '.wav': 'audio/wav',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}
