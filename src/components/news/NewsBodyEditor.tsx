import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

type NewsBodyEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

const getMarkdown = (editor: NonNullable<ReturnType<typeof useEditor>>) => {
  const storage = editor.storage as { markdown?: { getMarkdown: () => string } };
  return storage.markdown?.getMarkdown() ?? "";
};

export function NewsBodyEditor({
  value,
  onChange,
  placeholder,
  className,
}: NewsBodyEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: value,
    editorProps: {
      attributes: {
        class:
          "editorial-prose editorial-prose-sm news-admin-prose min-h-[12rem] max-w-none focus:outline-none",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(getMarkdown(currentEditor));
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const current = getMarkdown(editor);
    if (value !== current) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div
        className={cn(
          "min-h-[12rem] rounded-[var(--radius-sm)] border border-border/55 bg-background/35",
          className,
        )}
      />
    );
  }

  return (
    <div className={className}>
      {placeholder && !value ? (
        <p className="mb-2 text-xs text-muted-foreground">{placeholder}</p>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}
