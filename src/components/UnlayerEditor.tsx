import { useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import EmailEditor, { EditorRef } from "react-email-editor";

export interface UnlayerEditorRef {
  exportHtml: () => Promise<{ html: string; design: Record<string, any> }>;
  loadDesign: (design: Record<string, any>) => void;
}

interface Props {
  initialDesign?: Record<string, any>;
  onReady?: () => void;
  minHeight?: number;
}

const UnlayerEditor = forwardRef<UnlayerEditorRef, Props>(
  ({ initialDesign, onReady, minHeight = 560 }, ref) => {
    const editorRef = useRef<EditorRef>(null);
    const readyRef = useRef(false);
    const pendingDesign = useRef<Record<string, any> | undefined>(initialDesign);

    useImperativeHandle(ref, () => ({
      exportHtml: () =>
        new Promise((resolve, reject) => {
          if (!editorRef.current?.editor) {
            reject(new Error("Editor not ready"));
            return;
          }
          editorRef.current.editor.exportHtml((data) => {
            resolve({ html: data.html, design: data.design });
          });
        }),
      loadDesign: (design: Record<string, any>) => {
        if (editorRef.current?.editor && readyRef.current) {
          editorRef.current.editor.loadDesign(design);
        } else {
          pendingDesign.current = design;
        }
      },
    }));

    const handleReady = () => {
      readyRef.current = true;
      if (pendingDesign.current && editorRef.current?.editor) {
        editorRef.current.editor.loadDesign(pendingDesign.current);
        pendingDesign.current = undefined;
      }
      onReady?.();
    };

    return (
      <div style={{ minHeight }}>
        <EmailEditor
          ref={editorRef}
          onReady={handleReady}
          minHeight={minHeight}
          options={{
            displayMode: "email",
            features: { textEditor: { spellChecker: true } },
            appearance: {
              theme: "light",
              panels: { tools: { dock: "left" } },
            },
            tools: {
              image: { enabled: true },
              button: { enabled: true },
              divider: { enabled: true },
              social: { enabled: true },
              timer: { enabled: false },
            },
          }}
        />
      </div>
    );
  }
);

UnlayerEditor.displayName = "UnlayerEditor";

export default UnlayerEditor;
