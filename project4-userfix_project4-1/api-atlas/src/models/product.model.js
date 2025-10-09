import mongoose from "mongoose";
const productSchema = new mongoose.Schema({
  sku: { type: String, unique: true, index: true, required: true },
  name: { type: String, required: true },
  priceCents: { type: Number, required: true, min: 0 },
  imageFileId: mongoose.Schema.Types.ObjectId,
  active: { type: Boolean, default: true }
});
export default mongoose.model("Product", productSchema);
