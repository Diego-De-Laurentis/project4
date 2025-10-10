import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },          // USD / EUR als Zahl
  image_url: { type: String, default: "" },
  description: { type: String, default: "" },
  category: { type: String, default: "" },
  featured: { type: Boolean, default: false },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Product", ProductSchema);
