import mongoose, { Schema, InferSchemaType } from "mongoose";

const mediaItemSchema = new Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], required: true },
    width: { type: Number },
    height: { type: Number },
  },
  { _id: false }
);

const postSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true },
    staffId: { type: String },
    staffName: { type: String },
    category: { type: String, enum: ["LADIES", "GENTS", "KIDS"], required: true, index: true },
    media: {
      type: [mediaItemSchema],
      required: true,
      validate: {
        validator: (arr: unknown[]) => arr.length >= 1 && arr.length <= 10,
        message: "A post must have between 1 and 10 media items",
      },
    },
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
