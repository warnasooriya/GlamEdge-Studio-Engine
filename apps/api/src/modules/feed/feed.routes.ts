import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { uploadMedia } from "./feed.upload";
import {
  createPost,
  listPublicFeed,
  likePost,
  unlikePost,
  addComment,
  listComments,
  deletePost,
} from "./feed.controller";

export const feedRouter = Router();

feedRouter.get("/public", listPublicFeed);
feedRouter.post("/:postId/like", likePost);
feedRouter.post("/:postId/unlike", unlikePost);
feedRouter.get("/:postId/comments", listComments);
feedRouter.post("/:postId/comments", addComment);

feedRouter.post("/", requireAuth, uploadMedia.array("media", 10), createPost);
feedRouter.delete("/:postId", requireAuth, deletePost);
