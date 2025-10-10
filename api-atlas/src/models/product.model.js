import mongoose from "mongoose";
const schema = new mongoose.Schema({
  sku: String,
  name: String,
  priceCents: Number,
  imageFileId: String,
  active: { type: Boolean, default: true }
}, { timestamps: true });
export default mongoose.model("Product", schema);
