import mongoose, { InferSchemaType, Model } from "mongoose";

const RescueTeamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    areaNames: { type: [String], default: [] },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    },
    coverageRadiusKm: { type: Number, default: 5 }
  },
  { timestamps: true }
);

RescueTeamSchema.index({ areaNames: 1 });

export type IRescueTeam = InferSchemaType<typeof RescueTeamSchema> & { _id: mongoose.Types.ObjectId };

const RescueTeamModel =
  (mongoose.models.RescueTeam as Model<IRescueTeam>) ||
  mongoose.model<IRescueTeam>("RescueTeam", RescueTeamSchema);

export default RescueTeamModel;
