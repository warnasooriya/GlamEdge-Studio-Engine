import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useInfiniteQuery } from "@tanstack/react-query";
import { X, ChevronLeft, ChevronRight, Play, ZoomIn, ZoomOut, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { FeedPost } from "@/types";

interface FlatMedia {
  url: string;
  type: "image" | "video";
  caption?: string;
  category: FeedPost["category"];
  staffName?: string;
  postId: string;
}

interface Props {
  tenantId: string;
  salonName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the lightbox skips the grid and opens straight into the viewer at this post's first media item. */
  initialPostId?: string;
}

export function PortfolioLightbox({ tenantId, salonName, open, onOpenChange, initialPostId }: Props) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const jumpedToInitialPost = useRef(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["portfolio-lightbox", tenantId],
    queryFn: async ({ pageParam }: { pageParam: string | null }) =>
      (
        await api.get<{ posts: FeedPost[]; nextCursor: string | null }>("/api/feed/public", {
          params: { tenantId, cursor: pageParam ?? undefined, limit: 24 },
        })
      ).data,
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: open,
  });

  const posts = data?.pages.flatMap((p) => p.posts) || [];
  const media: FlatMedia[] = posts.flatMap((post) =>
    post.media.map((m) => ({
      url: m.url,
      type: m.type,
      caption: post.caption,
      category: post.category,
      staffName: post.staffName,
      postId: post._id,
    }))
  );

  useEffect(() => {
    if (!open) {
      jumpedToInitialPost.current = false;
      return;
    }
    if (!initialPostId || jumpedToInitialPost.current || !media.length) return;
    const index = media.findIndex((m) => m.postId === initialPostId);
    if (index !== -1) {
      setViewerIndex(index);
      jumpedToInitialPost.current = true;
    }
  }, [open, initialPostId, media]);

  function handleOpenChange(next: boolean) {
    if (!next) setViewerIndex(null);
    onOpenChange(next);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-cream-50 outline-none dark:bg-plum-900 sm:inset-4 sm:rounded-2xl md:inset-8"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">{salonName} portfolio</DialogPrimitive.Title>
          {viewerIndex === null ? (
            <GridView
              salonName={salonName}
              media={media}
              isLoading={isLoading}
              hasNextPage={!!hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onLoadMore={() => fetchNextPage()}
              onSelect={setViewerIndex}
            />
          ) : (
            <ViewerView
              media={media}
              index={viewerIndex}
              onIndexChange={setViewerIndex}
              onBack={() => setViewerIndex(null)}
            />
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function GridView({
  salonName,
  media,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onSelect,
}: {
  salonName: string;
  media: FlatMedia[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onSelect: (index: number) => void;
}) {
  return (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-plum-100 px-4 py-3 dark:border-white/10">
        <h2 className="font-display text-base font-semibold text-plum-800 dark:text-cream-50">
          {salonName} · Portfolio
        </h2>
        <DialogPrimitive.Close className="rounded-full p-1.5 text-plum-400 hover:bg-plum-50 hover:text-plum-700 dark:text-cream-100/60 dark:hover:bg-white/10 dark:hover:text-cream-50">
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-plum-400 dark:text-cream-100/50">Loading portfolio...</p>
        ) : media.length === 0 ? (
          <p className="py-10 text-center text-sm text-plum-400 dark:text-cream-100/50">No portfolio media yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-5">
            {media.map((m, i) => (
              <button
                key={`${m.url}-${i}`}
                onClick={() => onSelect(i)}
                className="group relative aspect-square overflow-hidden rounded-md bg-plum-100 dark:bg-plum-800"
              >
                {m.type === "video" ? (
                  <video src={m.url} className="h-full w-full object-cover" muted preload="metadata" />
                ) : (
                  <img src={m.url} alt="" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />
                )}
                {m.type === "video" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="h-6 w-6 fill-white text-white drop-shadow" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {hasNextPage && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={onLoadMore}
              disabled={isFetchingNextPage}
              className="rounded-full border-2 border-brand-300 px-4 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 dark:border-brand-400/60 dark:text-brand-200 dark:hover:bg-white/5"
            >
              {isFetchingNextPage ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function ViewerView({
  media,
  index,
  onIndexChange,
  onBack,
}: {
  media: FlatMedia[];
  index: number;
  onIndexChange: (i: number) => void;
  onBack: () => void;
}) {
  const current = media[index];

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
      if (e.key === "ArrowRight" && index < media.length - 1) onIndexChange(index + 1);
      if (e.key === "Backspace") onBack();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, media.length, onIndexChange, onBack]);

  if (!current) return null;

  return (
    <div className="flex h-full flex-col bg-black">
      <div className="flex shrink-0 items-center justify-between px-4 py-3 text-cream-50">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium hover:text-brand-300">
          <ArrowLeft className="h-4 w-4" /> Back to grid
        </button>
        <span className="text-xs text-cream-100/70">
          {index + 1} / {media.length}
        </span>
        <DialogPrimitive.Close className="rounded-full p-1.5 hover:bg-white/10">
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {current.type === "video" ? (
          <div className="flex h-full w-full items-center justify-center">
            <video key={current.url} src={current.url} className="max-h-full max-w-full" controls autoPlay />
          </div>
        ) : (
          <ZoomableImage key={current.url} src={current.url} alt={current.caption || "Portfolio image"} />
        )}

        {index > 0 && (
          <button
            onClick={() => onIndexChange(index - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {index < media.length - 1 && (
          <button
            onClick={() => onIndexChange(index + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {(current.caption || current.staffName) && (
        <div className="flex shrink-0 items-center gap-2 border-t border-white/10 px-4 py-3">
          <CategoryBadge category={current.category} />
          {current.caption && <p className="truncate text-sm text-cream-50">{current.caption}</p>}
          {current.staffName && <span className="ml-auto shrink-0 text-xs text-cream-100/60">{current.staffName}</span>}
        </div>
      )}
    </div>
  );
}

function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  function clampScale(next: number) {
    return Math.min(4, Math.max(1, next));
  }

  function toggleZoom() {
    if (scale > 1) {
      setScale(1);
      setPos({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setScale((s) => clampScale(s - e.deltaY * 0.0025));
  }

  function onMouseDown(e: React.MouseEvent) {
    if (scale === 1) return;
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
  }
  function endDrag() {
    dragging.current = false;
  }

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden touch-none"
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        onDoubleClick={toggleZoom}
        className="max-h-full max-w-full select-none object-contain transition-transform duration-150 ease-out"
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          cursor: scale > 1 ? "grab" : "zoom-in",
        }}
      />
      <div className="absolute bottom-4 right-4 flex gap-1.5">
        <button
          onClick={() => setScale((s) => clampScale(s - 0.5))}
          className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={() => setScale((s) => clampScale(s + 0.5))}
          className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
