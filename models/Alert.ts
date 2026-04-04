import mongoose, { InferSchemaType, Model } from "mongoose";

const AlertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTeamId: { type: mongoose.Schema.Types.ObjectId, ref: "RescueTeam", default: null },
    area: { type: String, required: true, trim: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    note: { type: String, trim: true, default: "" },
    voiceNoteUrl: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["open", "accepted", "resolved"],
      default: "open"
    },
    acceptedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

AlertSchema.index({ area: 1, createdAt: -1 });

export type IAlert = InferSchemaType<typeof AlertSchema> & { _id: mongoose.Types.ObjectId };

const AlertModel = (mongoose.models.Alert as Model<IAlert>) || mongoose.model<IAlert>("Alert", AlertSchema);

export default AlertModel;
