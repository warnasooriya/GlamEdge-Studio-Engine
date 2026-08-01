import mongoose, { Schema, InferSchemaType } from "mongoose";

const postSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true },
    staffId: { type: String },
    staffName: { type: String },
    category: { type: String, enum: ["LADIES", "GENTS", "KIDS"], required: true, index: true },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    caption: { type: String, maxlength: 500 },
    tags: [{ type: String }],
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });

export type PostDocument = InferSchemaType<typeof postSchema>;
export const Post = mongoose.model("Post", postSchema);
