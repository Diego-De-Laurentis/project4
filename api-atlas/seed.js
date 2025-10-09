import "dotenv/config.js";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";
import Product from "./src/models/product.model.js";
import { connect } from "./src/db.js";
async function run() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI fehlt in .env");
    process.exit(1);
  }
  await connect();
  const db = mongoose.connection.db;
  const bucket = new GridFSBucket(db, { bucketName: "images" });
  const b64 = fs.readFileSync(path.join("seed", "sample.png.b64"), "utf8");
  const buf = Buffer.from(b64, "base64");
  const upload = bucket.openUploadStream("sample.png", { contentType: "image/png" });
  await new Promise((resolve, reject) => upload.end(buf, err => err ? reject(err) : resolve()));
  const fileId = upload.id;
  const sku = "DEMO-001";
  await Product.updateOne({ sku }, { $set: { name: "Demo Drink", priceCents: 199, imageFileId: fileId, active: true } }, { upsert: true });
  console.log("Seed done:", { productSku: sku, imageFileId: String(fileId) });
  await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
