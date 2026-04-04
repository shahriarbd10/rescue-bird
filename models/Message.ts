import mongoose, { InferSchemaType, Model } from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "RescueTeam", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    body: { type: String, required: true, trim: true },
    senderNameSnapshot: { type: String, required: true, trim: true },
    senderRoleSnapshot: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

MessageSchema.index({ teamId: 1, createdAt: -1 });

export type IMessage = InferSchemaType<typeof MessageSchema> & { _id: mongoose.Types.ObjectId };

const MessageModel =
  (mongoose.models.Message as Model<IMessage>) || mongoose.model<IMessage>("Message", MessageSchema);

export default MessageModel;
