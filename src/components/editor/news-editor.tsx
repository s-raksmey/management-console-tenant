"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Heading2,
  Heading3,
  ImageIcon,
  Link2,
  List as ListIcon,
  ListOrdered,
  Pilcrow,
  Quote as QuoteIcon,
  Video,
} from "lucide-react";

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
    const [isReady, setIsReady] = useState(false);

    const insertBlock = useCallback((type: string, data: Record<string, unknown> = {}) => {
      const editor = editorRef.current;
      if (!editor?.blocks) return;

      editor.blocks.insert(type, data, undefined, undefined, true);
      editor.caret?.setToLastBlock?.("end");
    }, []);

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
          onReady: () => {
            if (!destroyed) setIsReady(true);
          },
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
        setIsReady(false);
        editorRef.current?.destroy?.();
        editorRef.current = null;
      };
    }, [initialData, readOnly]);

    return (
      <div className="overflow-visible rounded-md border bg-white">
        {!readOnly && (
          <div
            className="flex flex-wrap items-center gap-1 border-b bg-slate-50 p-2"
            role="toolbar"
            aria-label="Article content tools"
          >
            <EditorToolButton label="Text" disabled={!isReady} onClick={() => insertBlock("paragraph", { text: "" })}>
              <Pilcrow className="h-4 w-4" />
            </EditorToolButton>
            <EditorToolButton label="Heading 2" disabled={!isReady} onClick={() => insertBlock("header", { text: "", level: 2 })}>
              <Heading2 className="h-4 w-4" />
            </EditorToolButton>
            <EditorToolButton label="Heading 3" disabled={!isReady} onClick={() => insertBlock("header", { text: "", level: 3 })}>
              <Heading3 className="h-4 w-4" />
            </EditorToolButton>
            <span className="mx-1 h-6 w-px bg-slate-300" aria-hidden="true" />
            <EditorToolButton label="Bulleted list" disabled={!isReady} onClick={() => insertBlock("list", {
              style: "unordered",
              meta: {},
              items: [{ content: "", meta: {}, items: [] }],
            })}>
              <ListIcon className="h-4 w-4" />
            </EditorToolButton>
            <EditorToolButton label="Numbered list" disabled={!isReady} onClick={() => insertBlock("list", {
              style: "ordered",
              meta: { start: 1, counterType: "numeric" },
              items: [{ content: "", meta: {}, items: [] }],
            })}>
              <ListOrdered className="h-4 w-4" />
            </EditorToolButton>
            <EditorToolButton label="Quote" disabled={!isReady} onClick={() => insertBlock("quote", {
              text: "",
              caption: "",
              alignment: "left",
            })}>
              <QuoteIcon className="h-4 w-4" />
            </EditorToolButton>
            <span className="mx-1 h-6 w-px bg-slate-300" aria-hidden="true" />
            <EditorToolButton label="Image" disabled={!isReady} onClick={() => insertBlock("image")}>
              <ImageIcon className="h-4 w-4" />
            </EditorToolButton>
            <EditorToolButton label="Video" disabled={!isReady} onClick={() => insertBlock("video")}>
              <Video className="h-4 w-4" />
            </EditorToolButton>
            <EditorToolButton label="Link preview" disabled={!isReady} onClick={() => insertBlock("linkTool")}>
              <Link2 className="h-4 w-4" />
            </EditorToolButton>
            <p className="ml-auto px-2 text-xs text-slate-500">Select text for bold, italic, and links</p>
          </div>
        )}
        <div className="news-editor min-h-[360px] p-3 sm:p-5" ref={holderRef} />
      </div>
    );
  }
);

function EditorToolButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-transparent px-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}

NewsEditor.displayName = "NewsEditor";
export default NewsEditor;
