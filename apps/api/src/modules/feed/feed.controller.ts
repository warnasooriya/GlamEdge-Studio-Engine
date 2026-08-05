import { Response, Request } from "express";
import { v4 as uuid } from "uuid";
import { imageSize } from "image-size";
import { Post } from "@/models/Post";
import { Comment } from "@/models/Comment";
import { Like } from "@/models/Like";
import { AuthRequest } from "@/middlewares/requireAuth";
import { ClientAuthRequest } from "@/middlewares/requireClientAuth";
import { HttpError } from "@/middlewares/errorHandler";
import { storageProvider } from "@/services/storage";
import { prisma } from "@/config/prisma";
import { parsePagination, paginationMeta } from "@/utils/pagination";
import { createPostSchema, likeSchema, commentSchema } from "./feed.schema";

async function resolveMediaUrls<T extends { url: string }>(media: T[]): Promise<T[]> {
  return Promise.all(media.map(async (m) => ({ ...m, url: await storageProvider.resolveUrl(m.url) })));
}

export async function createPost(req: AuthRequest, res: Response) {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) throw new HttpError(400, "At least one media file is required");
  if (files.length > 10) throw new HttpError(400, "Maximum 10 media files per post");

  const data = createPostSchema.parse(req.body);

  const media = await Promise.all(
    files.map(async (file) => {
      const ext = file.mimetype.split("/")[1];
      const key = `feed/${req.tenantId}/${uuid()}.${ext}`;
      const url = await storageProvider.upload(key, file.buffer, file.mimetype);

      if (file.mimetype.startsWith("video")) {
        return { url, type: "video" as const };
      }
      try {
        const { width, height } = imageSize(file.buffer);
        return { url, type: "image" as const, width, height };
      } catch {
        return { url, type: "image" as const };
      }
    })
  );

  const post = await Post.create({
    tenantId: req.tenantId,
    staffId: data.staffId,
    staffName: data.staffName,
    category: data.category,
    media,
    caption: data.caption,
    tags: data.tags,
  });

  const resolvedPost = { ...post.toObject(), media: await resolveMediaUrls(post.media) };
  return res.status(201).json({ success: true, post: resolvedPost });
}

export async function listPublicFeed(req: Request, res: Response) {
  const { tenantId, category, cursor, limit = "12" } = req.query as Record<string, string>;

  const baseQuery: Record<string, unknown> = {};
  if (tenantId) baseQuery.tenantId = tenantId;
  if (category) baseQuery.category = category;

  const query = cursor ? { ...baseQuery, _id: { $lt: cursor } } : baseQuery;

  const [posts, total] = await Promise.all([
    Post.find(query)
      .sort({ _id: -1 })
      .limit(Math.min(Number(limit) || 12, 50)),
    Post.countDocuments(baseQuery),
  ]);

  const nextCursor = posts.length ? posts[posts.length - 1]._id.toString() : null;

  const resolvedPosts = await Promise.all(
    posts.map(async (p) => ({ ...p.toObject(), media: await resolveMediaUrls(p.media) }))
  );

  return res.json({ success: true, posts: resolvedPosts, nextCursor, total });
}

export async function likePost(req: Request, res: Response) {
  const { visitorId } = likeSchema.parse(req.body);
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) throw new HttpError(404, "Post not found");

  try {
    await Like.create({ postId, visitorId });
    post.likeCount += 1;
    await post.save();
  } catch (err: any) {
    if (err.code !== 11000) throw err; // ignore duplicate-like race
  }

  return res.json({ success: true, likeCount: post.likeCount });
}

export async function unlikePost(req: Request, res: Response) {
  const { visitorId } = likeSchema.parse(req.body);
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) throw new HttpError(404, "Post not found");

  const deleted = await Like.findOneAndDelete({ postId, visitorId });
  if (deleted && post.likeCount > 0) {
    post.likeCount -= 1;
    await post.save();
  }

  return res.json({ success: true, likeCount: post.likeCount });
}

export async function addComment(req: ClientAuthRequest, res: Response) {
  const data = commentSchema.parse(req.body);
  const { postId } = req.params;
  const clientId = req.clientAuth!.clientId;

  const post = await Post.findById(postId);
  if (!post) throw new HttpError(404, "Post not found");

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { name: true } });
  if (!client) throw new HttpError(404, "Client not found");

  const comment = await Comment.create({
    postId,
    tenantId: post.tenantId,
    clientId,
    authorName: client.name,
    text: data.text,
  });

  post.commentCount += 1;
  await post.save();

  return res.status(201).json({ success: true, comment });
}

export async function listComments(req: Request, res: Response) {
  const { postId } = req.params;
  const { page, pageSize, skip, take } = parsePagination(req.query, 20, 100);

  const [comments, total] = await Promise.all([
    Comment.find({ postId }).sort({ createdAt: -1 }).skip(skip).limit(take),
    Comment.countDocuments({ postId }),
  ]);

  return res.json({ success: true, comments, ...paginationMeta(total, page, pageSize) });
}

export async function deletePost(req: AuthRequest, res: Response) {
  const post = await Post.findOne({ _id: req.params.postId, tenantId: req.tenantId });
  if (!post) throw new HttpError(404, "Post not found");

  await Promise.all([
    post.deleteOne(),
    Comment.deleteMany({ postId: post._id }),
    Like.deleteMany({ postId: post._id }),
  ]);

  return res.json({ success: true });
}
