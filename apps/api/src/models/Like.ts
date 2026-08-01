import mongoose, { Schema, InferSchemaType } from "mongoose";

const likeSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    // Identifies an anonymous public visitor (client-generated id stored in localStorage)
    // so the same visitor can't like a post twice without requiring a client account.
    visitorId: { type: String, required: true },
  },
  { timestamps: true }
);

likeSchema.index({ postId: 1, visitorId: 1 }, { unique: true });

export type LikeDocument = InferSchemaType<typeof likeSchema>;
export const Like = mongoose.model("Like", likeSchema);
