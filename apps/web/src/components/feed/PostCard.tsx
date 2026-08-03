import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Play, Maximize2 } from "lucide-react";
import { api } from "@/lib/api";
import { getVisitorId } from "@/lib/visitor";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { FeedMediaItem, FeedPost } from "@/types";
import { cn } from "@/lib/utils";

function MediaCarousel({ media, alt, onOpenViewer }: { media: FeedMediaItem[]; alt: string; onOpenViewer: () => void }) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  function onScroll() {
    const el = trackRef.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  const cover = media[0];
  const coverAspect =
    cover.type === "video" ? "16 / 9" : cover.width && cover.height ? `${cover.width} / ${cover.height}` : "4 / 5";

  return (
    <button
      type="button"
      onClick={onOpenViewer}
      className="group/media relative w-full text-left"
      style={{ aspectRatio: coverAspect }}
      aria-label="View full portfolio"
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {media.map((m, i) => (
          <div key={i} className="relative h-full w-full flex-shrink-0 snap-center">
            {m.type === "video" ? (
              <video src={m.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
            ) : (
              <img src={m.url} className="h-full w-full object-cover transition-transform duration-300" alt={alt} />
            )}
            {m.type === "video" && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                <Play className="h-8 w-8 fill-white text-white drop-shadow" />
              </span>
            )}
          </div>
        ))}
      </div>
      <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover/media:opacity-100">
        <Maximize2 className="h-3.5 w-3.5" />
      </span>
      {media.length > 1 && (
        <>
          <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
            {index + 1}/{media.length}
          </span>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {media.map((_, i) => (
              <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i === index ? "bg-white" : "bg-white/40")} />
            ))}
          </div>
        </>
      )}
    </button>
  );
}

export function PostCard({ post, onOpenViewer }: { post: FeedPost; onOpenViewer: () => void }) {
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);

  async function toggleLike() {
    const visitorId = getVisitorId();
    if (liked) {
      const res = await api.post(`/api/feed/${post._id}/unlike`, { visitorId });
      setLikeCount(res.data.likeCount);
      setLiked(false);
    } else {
      const res = await api.post(`/api/feed/${post._id}/like`, { visitorId });
      setLikeCount(res.data.likeCount);
      setLiked(true);
    }
  }

  return (
    <div className="glass-panel group overflow-hidden">
      <div className="overflow-hidden">
        <MediaCarousel media={post.media} alt={post.caption || "salon work"} onOpenViewer={onOpenViewer} />
      </div>
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-center justify-between">
          <CategoryBadge category={post.category} />
          {post.staffName && <span className="text-xs text-plum-400 dark:text-cream-100/50">{post.staffName}</span>}
        </div>
        {post.caption && <p className="text-sm text-plum-700 dark:text-cream-50">{post.caption}</p>}
        <div className="flex items-center gap-4 pt-1 text-sm text-plum-400 dark:text-cream-100/50">
          <button onClick={toggleLike} className={cn("flex items-center gap-1 transition-colors", liked && "text-brand-500")}>
            <Heart className={cn("h-4 w-4", liked && "fill-brand-500")} /> {likeCount}
          </button>
          <button onClick={() => setShowComments((v) => !v)} className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" /> {post.commentCount}
          </button>
        </div>
        {showComments && <CommentsSection postId={post._id} />}
      </div>
    </div>
  );
}

type CommentItem = { _id: string; authorName: string; text: string };

function CommentsSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");

  async function load(targetPage: number, append: boolean) {
    const res = await api.get(`/api/feed/${postId}/comments`, { params: { page: targetPage } });
    setComments((prev) => (append && prev ? [...prev, ...res.data.comments] : res.data.comments));
    setPage(res.data.page);
    setTotalPages(res.data.totalPages);
  }

  useEffect(() => {
    load(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function loadMore() {
    setLoadingMore(true);
    await load(page + 1, true);
    setLoadingMore(false);
  }

  async function submit() {
    if (!name || !text) return;
    await api.post(`/api/feed/${postId}/comments`, { authorName: name, text });
    setText("");
    load(1, false);
  }

  if (comments === null) {
    return <p className="text-xs text-plum-300 dark:text-cream-100/40">Loading comments...</p>;
  }

  return (
    <div className="flex flex-col gap-2 border-t border-plum-100 pt-2 dark:border-white/10">
      {comments.map((c) => (
        <p key={c._id} className="text-xs text-plum-600 dark:text-cream-100/80">
          <span className="font-semibold text-plum-800 dark:text-cream-50">{c.authorName}:</span> {c.text}
        </p>
      ))}
      {page < totalPages && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="self-start text-xs font-medium text-brand-500 hover:underline"
        >
          {loadingMore ? "Loading..." : "Load more comments"}
        </button>
      )}
      <div className="flex gap-1">
        <input
          className="h-8 flex-1 rounded-lg border border-plum-100 bg-white/90 px-2 text-xs dark:border-white/10 dark:bg-plum-700/60 dark:text-cream-50"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="h-8 flex-[2] rounded-lg border border-plum-100 bg-white/90 px-2 text-xs dark:border-white/10 dark:bg-plum-700/60 dark:text-cream-50"
          placeholder="Add a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button onClick={submit} className="rounded-lg bg-gradient-brand px-2.5 text-xs font-semibold text-white">
          Post
        </button>
      </div>
    </div>
  );
}
