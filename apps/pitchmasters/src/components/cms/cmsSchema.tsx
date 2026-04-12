// Shared BlockNote schema for the CMS — used by both the editor and the public viewer.
// Keeping it in one place ensures saved content always renders correctly on both sides.
/* eslint-disable react-refresh/only-export-components */

import { useCallback, useRef } from 'react';
import {
  createReactBlockSpec,
  ResizableFileBlockWrapper,
  type ReactCustomBlockRenderProps,
} from '@blocknote/react';
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  createVideoBlockConfig,
  videoParse,
} from '@blocknote/core';
import { Video } from 'lucide-react';

// ── Embed URL helpers ─────────────────────────────────────────────────────────

export function getEmbedInfo(url: string): { kind: 'iframe'; src: string } | { kind: 'video'; src: string } | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?#]+)/);
  if (ytMatch) return { kind: 'iframe', src: `https://www.youtube.com/embed/${ytMatch[1]}` };
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  return { kind: 'video', src: url };
}

// ── Drag handle (edit mode only) ──────────────────────────────────────────────

function DragHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        width: 16,
        alignSelf: 'stretch',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'ew-resize',
        flexShrink: 0,
      }}
    >
      <div style={{ width: 4, height: 40, borderRadius: 2, background: '#9ca3af' }} />
    </div>
  );
}

// ── Resizable iframe block ────────────────────────────────────────────────────
// Handles sit beside the iframe (not on top) so the iframe's pointer-event capture
// doesn't swallow drag interactions. In read-only mode the handles are omitted.

function ResizableIframeBlock(
  props: ReactCustomBlockRenderProps<typeof createVideoBlockConfig> & { src: string; editable: boolean }
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widthPct: number = (props.block.props as any).previewWidth ?? 100;

  const startResize = useCallback((side: 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startPx = containerRef.current?.offsetWidth ?? 600;

    const onMove = (ev: MouseEvent) => {
      const outerWidth = containerRef.current?.parentElement?.offsetWidth ?? 800;
      const delta = side === 'right' ? ev.clientX - startX : startX - ev.clientX;
      const newPx = Math.max(120, startPx + delta);
      const newPct = Math.min(100, Math.round((newPx / outerWidth) * 100));
      props.editor.updateBlock(props.block, { props: { previewWidth: newPct } as any });
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [props.editor, props.block]);

  return (
    <div ref={containerRef} style={{ width: `${widthPct}%`, display: 'flex', alignItems: 'stretch' }}>
      {props.editable && <DragHandle onMouseDown={startResize('left')} />}
      <iframe
        src={props.src}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        style={{ flex: 1, aspectRatio: '16/9', border: 'none', display: 'block', minWidth: 0 }}
      />
      {props.editable && <DragHandle onMouseDown={startResize('right')} />}
    </div>
  );
}

// ── Custom video block render ─────────────────────────────────────────────────

function CustomVideoBlock(props: ReactCustomBlockRenderProps<typeof createVideoBlockConfig>) {
  const url = props.block.props.url;
  const embed = url ? getEmbedInfo(url) : null;
  const editable = props.editor.isEditable;

  if (embed?.kind === 'iframe') {
    return <ResizableIframeBlock {...props} src={embed.src} editable={editable} />;
  }

  return (
    <ResizableFileBlockWrapper {...(props as any)} buttonIcon={<Video size={24} />}>
      {embed?.kind === 'video' ? (
        <video className="bn-visual-media" src={embed.src} controls draggable={false} />
      ) : null}
    </ResizableFileBlockWrapper>
  );
}

// ── Exported schema ───────────────────────────────────────────────────────────

const customVideoBlockSpec = createReactBlockSpec(
  createVideoBlockConfig,
  (config) => ({
    render: CustomVideoBlock,
    parse: videoParse(config),
  }),
);

export const cmsSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    video: customVideoBlockSpec(),
  },
});
