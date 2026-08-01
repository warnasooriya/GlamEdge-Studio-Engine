import { Response, Request } from "express";
import { v4 as uuid } from "uuid";
import { Post } from "@/models/Post";
import { Comment } from "@/models/Comment";
import { Like } from "@/models/Like";
import { AuthRequest } from "@/middlewares/requireAuth";
import { HttpError } from "@/middlewares/errorHandler";
import { storageProvider } from "@/services/storage";
import { createPostSchema, likeSchema, commentSchema } from "./feed.schema";

interface UploadRequest extends AuthRequest {
  file?: Express.Multer.File;
}

export async function createPost(req: UploadRequest, res: Response) {
  if (!req.file) throw new HttpError(400, "Media file is required");
  const data = createPostSchema.parse(req.body);

  const ext = req.file.mimetype.split("/")[1];
  const key = `feed/${req.tenantId}/${uuid()}.${ext}`;
  const mediaUrl = await storageProvider.upload(key, req.file.buffer, req.file.mimetype);

  const post = await Post.create({
    tenantId: req.tenantId,
    staffId: data.staffId,
    staffName: data.staffName,
    category: data.category,
    mediaUrl,
    mediaType: req.file.mimetype.startsWith("video") ? "video" : "image",
    caption: data.caption,
    tags: data.tags,
  });

  return res.status(201).json({ success: true, post });
}

export async function listPublicFeed(req: Request, res: Response) {
  const { tenantId, category, cursor, limit = "12" } = req.query as Record<string, string>;

  const query: Record<string, unknown> = {};
  if (tenantId) query.tenantId = tenantId;
  if (category) query.category = category;
  if (cursor) query._id = { $lt: cursor };

  const posts = await Post.find(query)
    .sort({ _id: -1 })
    .limit(Math.min(Number(limit) || 12, 50));

  const nextCursor = posts.length ? posts[posts.length - 1]._id.toString() : null;

  return res.json({ success: true, posts, nextCursor });
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

export async function addComment(req: Request, res: Response) {
  const data = commentSchema.parse(req.body);
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) throw new HttpError(404, "Post not found");

  const comment = await Comment.create({
    postId,
    tenantId: post.tenantId,
    authorName: data.authorName,
    text: data.text,
  });

  post.commentCount += 1;
  await post.save();

  return res.status(201).json({ success: true, comment });
}

export async function listComments(req: Request, res: Response) {
  const { postId } = req.params;
  const comments = await Comment.find({ postId }).sort({ createdAt: 1 });
  return res.json({ success: true, comments });
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
