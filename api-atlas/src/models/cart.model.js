import mongoose from "mongoose";
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    qty: { type: Number, default: 1 }
  }],
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });
export default mongoose.model("Cart", schema);
