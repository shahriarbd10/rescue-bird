import mongoose, { InferSchemaType, Model } from "mongoose";

const OtpCodeSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    code: { type: String, required: true },
    purpose: { type: String, enum: ["verify-email"], required: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

OtpCodeSchema.index({ email: 1, purpose: 1 });
OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type IOtpCode = InferSchemaType<typeof OtpCodeSchema> & { _id: mongoose.Types.ObjectId };

const OtpCodeModel =
  (mongoose.models.OtpCode as Model<IOtpCode>) || mongoose.model<IOtpCode>("OtpCode", OtpCodeSchema);

export default OtpCodeModel;
