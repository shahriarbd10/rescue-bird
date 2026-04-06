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
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "high"
    },
    status: {
      type: String,
      enum: ["open", "accepted", "resolved"],
      default: "open"
    },
    acceptedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    acceptedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    escalationCandidates: [{ type: mongoose.Schema.Types.ObjectId, ref: "RescueTeam" }],
    escalationIndex: { type: Number, default: 0 },
    nextEscalationAt: { type: Date, default: null },
    escalatedAt: { type: Date, default: null },
    needsManualDispatch: { type: Boolean, default: false }
  },
  { timestamps: true }
);

AlertSchema.index({ area: 1, createdAt: -1 });

export type IAlert = InferSchemaType<typeof AlertSchema> & { _id: mongoose.Types.ObjectId };

const AlertModel = (mongoose.models.Alert as Model<IAlert>) || mongoose.model<IAlert>("Alert", AlertSchema);

export default AlertModel;
