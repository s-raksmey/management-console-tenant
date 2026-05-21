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

function getMediaType(mimeType: string): MediaType {
  return MIME_TYPE_MAP[mimeType] || 'other';
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
    const permissionError = await requireMediaPermission(req, ["MANAGE_MEDIA"]);
    if (permissionError) return permissionError;

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
    const baseUploadDir = path.join(process.cwd(), "public/uploads");
    const folderPath = options.folder ? path.join(baseUploadDir, options.folder) : baseUploadDir;
    
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
    const relativePath = options.folder ? `${options.folder}/${filename}` : filename;
    const mediaFile: Partial<MediaFile> = {
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
      folder: options.folder,
      tags: options.tags || [],
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'current-user', // TODO: Get from auth context
      lastModified: new Date().toISOString(),
    };
    
    // TODO: Save to database
    // await saveMediaFile(mediaFile);
    
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
    const folder = searchParams.get('folder') || '';
    
    // Get files from upload directory
    const uploadDir = path.join(process.cwd(), "public/uploads", folder);
    
    if (!fs.existsSync(uploadDir)) {
      return NextResponse.json({
        success: true,
        files: [],
        folders: [],
      });
    }
    
    const items = fs.readdirSync(uploadDir, { withFileTypes: true });
    const files: Partial<MediaFile>[] = [];
    const folders: string[] = [];
    
    for (const item of items) {
      if (item.isDirectory()) {
        folders.push(item.name);
      } else if (item.isFile()) {
        const filePath = path.join(uploadDir, item.name);
        const stats = fs.statSync(filePath);
        const relativePath = folder ? `${folder}/${item.name}` : item.name;
        
        // Try to determine file type from extension
        const ext = path.extname(item.name).toLowerCase();
        const mimeType = getMimeTypeFromExtension(ext);
        const mediaType = getMediaType(mimeType);
        
        files.push({
          id: item.name, // Use filename as ID for now
          filename: item.name,
          originalName: item.name,
          url: `/uploads/${relativePath}`,
          type: mediaType,
          mimeType,
          size: stats.size,
          uploadedAt: stats.birthtime.toISOString(),
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
    
    // Find and delete the file
    const uploadDir = path.join(process.cwd(), "public/uploads");
    
    // Search for the file in the upload directory and subdirectories
    const findAndDeleteFile = (dir: string): boolean => {
      if (!fs.existsSync(dir)) return false;
      
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          // Recursively search in subdirectories
          if (findAndDeleteFile(itemPath)) return true;
        } else if (item.isFile() && item.name === filename) {
          // Found the file, delete it
          fs.unlinkSync(itemPath);
          return true;
        }
      }
      
      return false;
    };
    
    const fileDeleted = findAndDeleteFile(uploadDir);
    
    if (!fileDeleted) {
      return NextResponse.json(
        { success: false, message: "File not found" },
        { status: 404 }
      );
    }
    
    // TODO: Remove from database
    // await deleteMediaFile(fileId);
    
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
