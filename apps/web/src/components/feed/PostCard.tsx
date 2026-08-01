import { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import { getVisitorId } from "@/lib/visitor";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { FeedPost } from "@/types";
import { cn } from "@/lib/utils";

export function PostCard({ post }: { post: FeedPost }) {
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
        {post.mediaType === "video" ? (
          <video src={post.mediaUrl} className="aspect-square w-full object-cover" controls />
        ) : (
          <img
            src={post.mediaUrl}
            className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
            alt={post.caption || "salon work"}
          />
        )}
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

function CommentsSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<{ _id: string; authorName: string; text: string }[] | null>(null);
  const [name, setName] = useState("");
  const [text, setText] = useState("");

  async function load() {
    const res = await api.get(`/api/feed/${postId}/comments`);
    setComments(res.data.comments);
  }

  async function submit() {
    if (!name || !text) return;
    await api.post(`/api/feed/${postId}/comments`, { authorName: name, text });
    setText("");
    load();
  }

  if (comments === null) {
    load();
    return <p className="text-xs text-plum-300 dark:text-cream-100/40">Loading comments...</p>;
  }

  return (
    <div className="flex flex-col gap-2 border-t border-plum-100 pt-2 dark:border-white/10">
      {comments.map((c) => (
        <p key={c._id} className="text-xs text-plum-600 dark:text-cream-100/80">
          <span className="font-semibold text-plum-800 dark:text-cream-50">{c.authorName}:</span> {c.text}
        </p>
      ))}
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
