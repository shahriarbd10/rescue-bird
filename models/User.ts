import mongoose, { InferSchemaType, Model } from "mongoose";

export const userRoles = ["admin", "rescue_team", "user", "team_staff"] as const;
export type UserRole = (typeof userRoles)[number];

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: userRoles, required: true },
    verifiedAt: { type: Date, default: null },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "RescueTeam", default: null },
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    },
    lastLocationAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export type IUser = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

const UserModel = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);

export default UserModel;
