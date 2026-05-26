import type { JsonObject, JsonValue } from './json';

export interface EditorBlockBase {
  id?: string;
  tunes?: {
    highlight?: {
      highlighted?: boolean;
    };
    [key: string]: JsonValue | undefined;
  };
}

export type EditorBlock =
  | (EditorBlockBase & {
      type: "paragraph";
      data: { text: string };
    })
  | (EditorBlockBase & {
      type: "header";
      data: { text: string; level: number };
    })
  | (EditorBlockBase & {
      type: "list";
      data: { style: "ordered" | "unordered"; items: string[] };
    })
  | (EditorBlockBase & {
      type: "quote";
      data: { text: string; caption?: string };
    })
  | (EditorBlockBase & {
      type: "image";
      data: {
        url: string;
        size?: "sm" | "md" | "lg" | "full";
        caption?: string;
      };
    })
  | (EditorBlockBase & {
      type: "video";
      data: { url: string };
    })
  | (EditorBlockBase & {
      type: string;
      data: JsonObject;
    });

export interface EditorOutputData {
  time?: number;
  blocks: EditorBlock[];
  version?: string;
}
