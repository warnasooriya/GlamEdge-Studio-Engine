import mongoose, { Schema, InferSchemaType } from "mongoose";

const attachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const appointmentMessageSchema = new Schema(
  {
    appointmentId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    senderType: { type: String, enum: ["OWNER", "CLIENT"], required: true },
    senderName: { type: String, required: true, maxlength: 191 },
    text: { type: String, maxlength: 1000 },
    attachment: { type: attachmentSchema },
  },
  { timestamps: true }
);

export type AppointmentMessageDocument = InferSchemaType<typeof appointmentMessageSchema>;
export const AppointmentMessage = mongoose.model("AppointmentMessage", appointmentMessageSchema);
