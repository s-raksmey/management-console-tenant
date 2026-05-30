"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import type {
  OutputData,
  ToolConstructable,
} from "@editorjs/editorjs";

import Header from "@editorjs/header";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import LinkTool from "@editorjs/link";

import HighlightTune from "@/components/editor/highlight-tune";
import ImageTool from "@/components/editor/image-tool";
import VideoTool from "@/components/editor/video-tool";

/* =========================
   Safe cast helper (CRITICAL)
========================= */
const asTool = (tool: unknown) => tool as ToolConstructable;

/* =========================
   Ref API
========================= */
export interface NewsEditorRef {
  save: () => Promise<OutputData>;
  clear: () => Promise<void>;
}

interface NewsEditorProps {
  initialData?: OutputData;
  readOnly?: boolean;
  onChange?: (data: OutputData) => void;
}

const NewsEditor = forwardRef<NewsEditorRef, NewsEditorProps>(
  ({ initialData, readOnly = false, onChange }, ref) => {
    const holderRef = useRef<HTMLDivElement | null>(null);
    const editorRef = useRef<any>(null);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    /* ---------- Expose API ---------- */
    useImperativeHandle(ref, () => ({
      save: async () => {
        if (!editorRef.current) {
          throw new Error("Editor not initialized");
        }
        return editorRef.current.save();
      },

      clear: async () => {
        if (editorRef.current?.clear) {
          await editorRef.current.clear();
        }
      },
    }));

    /* ---------- Init Editor ---------- */
    useEffect(() => {
      let destroyed = false;

      (async () => {
        if (!holderRef.current || editorRef.current) return;

        const { default: EditorJS } = await import("@editorjs/editorjs");
        if (!EditorJS || destroyed) return;

        editorRef.current = new EditorJS({
          holder: holderRef.current,
          readOnly,
          autofocus: true,
          minHeight: 120,
          placeholder: "Write news content here…",
          data: initialData ?? { blocks: [] },
          onChange: async (api) => {
            if (!onChangeRef.current) return;

            try {
              const data = await api.saver.save();
              onChangeRef.current(data);
            } catch (error) {
              console.warn("Unable to read editor content", error);
            }
          },

          tools: {
            /* ---------- Tune ---------- */
            highlight: HighlightTune as any,

            /* ---------- Text ---------- */
            paragraph: {
              inlineToolbar: true,
              tunes: ["highlight"],
            },

            header: {
              class: asTool(Header), // ✅ FIXES TS2322
              inlineToolbar: true,
              tunes: ["highlight"],
              config: {
                levels: [2, 3, 4],
                defaultLevel: 2,
              },
            },

            list: {
              class: asTool(List),
              inlineToolbar: true,
              tunes: ["highlight"],
            },

            quote: {
              class: asTool(Quote),
              inlineToolbar: true,
              tunes: ["highlight"],
            },

            /* ---------- Image ---------- */
            image: {
              class: ImageTool as any,
              tunes: ["highlight"],
            },

            /* ---------- Video ---------- */
            video: {
              class: VideoTool as any,
              tunes: ["highlight"],
            },

            /* ---------- Link ---------- */
            linkTool: {
              class: asTool(LinkTool),
              config: {
                endpoint: "/api/link-preview",
              },
            },
          },
        });
      })();

      return () => {
        destroyed = true;
        editorRef.current?.destroy?.();
        editorRef.current = null;
      };
    }, [initialData, readOnly]);

    return (
      <div className="rounded-md border bg-white p-3">
        <div ref={holderRef} />
      </div>
    );
  }
);

NewsEditor.displayName = "NewsEditor";
export default NewsEditor;
