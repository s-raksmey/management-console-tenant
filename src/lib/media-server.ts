import { getApiOrigin } from "@/lib/cms-media";
import { getForwardedTenantHeaders } from "@/lib/tenant-request-headers";
import type { MediaFile } from "@/types/media";

const MEDIA_ASSET_FIELDS = `
  id
  filename
  originalName
  url
  type
  mimeType
  size
  width
  height
  alt
  caption
  folder
  tags
  uploadedAt
  uploadedBy
  lastModified
`;

function authHeaders(req: Request) {
  const authorization = req.headers.get("authorization");
  const cookie = req.headers.get("cookie");
  return {
    ...(authorization ? { authorization } : {}),
    ...(cookie ? { cookie } : {}),
    ...getForwardedTenantHeaders(req),
  };
}

async function graphqlRequest<T>(req: Request, query: string, variables?: Record<string, unknown>) {
  const response = await fetch(`${getApiOrigin()}/graphql`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...authHeaders(req),
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = (await response.json()) as {
    data?: T;
    errors?: Array<{ message?: string }>;
  };

  if (!response.ok || result.errors?.length) {
    throw new Error(result.errors?.[0]?.message || "Media request failed");
  }

  return result.data as T;
}

export async function persistProcessedMedia(
  req: Request,
  input: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    folder?: string;
    alt?: string;
    caption?: string;
    tags?: string[];
    width?: number;
    height?: number;
  }
): Promise<MediaFile> {
  const response = await fetch(`${getApiOrigin()}/media/upload`, {
    method: "POST",
    headers: {
      "content-type": "application/octet-stream",
      "x-media-meta": JSON.stringify({
        originalName: input.originalName,
        mimeType: input.mimeType,
        folder: input.folder || "",
        alt: input.alt,
        caption: input.caption,
        tags: input.tags || [],
        width: input.width,
        height: input.height,
      }),
      ...authHeaders(req),
    },
    body: new Uint8Array(input.buffer),
  });

  const result = (await response.json()) as {
    success?: boolean;
    file?: MediaFile;
    message?: string;
  };

  if (!response.ok || !result.success || !result.file) {
    throw new Error(result.message || "Upload failed");
  }

  return result.file;
}

export async function listServerMediaAssets(req: Request, folder?: string) {
  const data = await graphqlRequest<{
    mediaAssets: { files: MediaFile[]; folders: string[] };
  }>(
    req,
    `
      query MediaAssets($folder: String) {
        mediaAssets(folder: $folder) {
          files { ${MEDIA_ASSET_FIELDS} }
          folders
        }
      }
    `,
    { folder: folder || null }
  );

  return data.mediaAssets;
}

export async function updateServerMediaAsset(
  req: Request,
  input: { id: string; alt?: string; caption?: string; tags?: string[] }
) {
  const data = await graphqlRequest<{ updateMediaAsset: MediaFile }>(
    req,
    `
      mutation UpdateMediaAsset($id: ID!, $input: UpdateMediaAssetInput!) {
        updateMediaAsset(id: $id, input: $input) {
          ${MEDIA_ASSET_FIELDS}
        }
      }
    `,
    {
      id: input.id,
      input: {
        alt: input.alt,
        caption: input.caption,
        tags: input.tags,
      },
    }
  );

  return data.updateMediaAsset;
}

export async function deleteServerMediaAsset(req: Request, id: string) {
  const data = await graphqlRequest<{ deleteMediaAsset: boolean }>(
    req,
    `
      mutation DeleteMediaAsset($id: ID!) {
        deleteMediaAsset(id: $id)
      }
    `,
    { id }
  );

  return data.deleteMediaAsset;
}
