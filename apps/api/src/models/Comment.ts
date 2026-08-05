import mongoose, { Schema, InferSchemaType } from "mongoose";

const commentSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    clientId: { type: String, required: true, index: true },
    authorName: { type: String, required: true, maxlength: 191 },
    text: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

export type CommentDocument = InferSchemaType<typeof commentSchema>;
export const Comment = mongoose.model("Comment", commentSchema);
