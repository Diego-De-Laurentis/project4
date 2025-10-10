import mongoose from "mongoose";
export async function connect() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI fehlt");
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.DB_NAME || "test",
    serverSelectionTimeoutMS: 10000,
    appName: "project4"
  });
}
