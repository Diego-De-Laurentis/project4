import mongoose from "mongoose";

export async function connect() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || "test";
  if (!uri) throw new Error("MONGODB_URI missing");
  await mongoose.connect(uri, { dbName });
  return mongoose.connection;
}
