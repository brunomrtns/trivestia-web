import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Link as LinkIcon,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onUploadImage?: (file: File) => Promise<string | null>;
  placeholder?: string;
}

const MenuButton = ({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'p-1.5 rounded transition hover:bg-accent',
      isActive && 'bg-accent text-primary',
      disabled && 'opacity-40 cursor-not-allowed'
    )}
  >
    {children}
  </button>
);

export function RichTextEditor({ content, onChange, onUploadImage }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline'
        }
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full mx-auto'
        }
      }),
      Youtube.configure({
        HTMLAttributes: {
          class: 'rounded-xl aspect-video w-full'
        }
      })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[200px] p-4 text-sm'
      },
      handleDrop: function(view, event, slice, moved) {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/') && onUploadImage) {
            setIsUploading(true);
            onUploadImage(file).then(url => {
              if (url) {
                const { schema } = view.state;
                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                const node = schema.nodes.image.create({ src: url });
                const transaction = view.state.tr.insert(coordinates?.pos || 0, node);
                view.dispatch(transaction);
              }
              setIsUploading(false);
            });
            return true;
          }
        }
        return false;
      },
      handlePaste: function(view, event, slice) {
        if (event.clipboardData && event.clipboardData.files && event.clipboardData.files[0]) {
          const file = event.clipboardData.files[0];
          if (file.type.startsWith('image/') && onUploadImage) {
            setIsUploading(true);
            onUploadImage(file).then(url => {
              if (url) {
                const { schema } = view.state;
                const node = schema.nodes.image.create({ src: url });
                const transaction = view.state.tr.replaceSelectionWith(node);
                view.dispatch(transaction);
              }
              setIsUploading(false);
            });
            return true;
          }
        }
        return false;
      }
    }
  });

  if (!editor) return null;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUploadImage) {
      setIsUploading(true);
      const url = await onUploadImage(file);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
      setIsUploading(false);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addImage = () => {
    if (onUploadImage) {
      fileInputRef.current?.click();
    } else {
      const url = window.prompt('URL da imagem:');
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
  };

  const addYoutubeVideo = () => {
    const url = window.prompt('URL do YouTube:');
    if (url) {
      editor.commands.setYoutubeVideo({
        src: url,
        width: 640,
        height: 480
      });
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL do link:', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="rounded-lg border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring relative">
      {isUploading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="mt-2 text-xs font-medium text-foreground">Enviando imagem...</span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-1">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Negrito"
        >
          <Bold className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Itálico"
        >
          <Italic className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Sublinhado"
        >
          <UnderlineIcon className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="Código"
        >
          <Code className="h-4 w-4" />
        </MenuButton>
        
        <div className="w-px h-4 bg-border mx-1" />
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Título 1"
        >
          <Heading1 className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Título 2"
        >
          <Heading2 className="h-4 w-4" />
        </MenuButton>
        
        <div className="w-px h-4 bg-border mx-1" />
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Lista"
        >
          <List className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Lista Numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </MenuButton>
        
        <div className="w-px h-4 bg-border mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Alinhar Esquerda"
        >
          <AlignLeft className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Centralizar"
        >
          <AlignCenter className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Alinhar Direita"
        >
          <AlignRight className="h-4 w-4" />
        </MenuButton>
        
        <div className="w-px h-4 bg-border mx-1" />

        <MenuButton onClick={setLink} isActive={editor.isActive('link')} title="Link">
          <LinkIcon className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={addImage} title="Inserir Imagem">
          <ImageIcon className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={addYoutubeVideo} title="Inserir Vídeo do YouTube">
          <YoutubeIcon className="h-4 w-4" />
        </MenuButton>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      <EditorContent editor={editor} />
    </div>
  );
}
