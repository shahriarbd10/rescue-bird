import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in environment variables");
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseConn:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const cached = global.mongooseConn ?? { conn: null, promise: null };
global.mongooseConn = cached;

export async function connectDb() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const uri = MONGODB_URI;
    if (!uri) {
      throw new Error("Missing MONGODB_URI in environment variables");
    }
    cached.promise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || "rescue-bird"
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
