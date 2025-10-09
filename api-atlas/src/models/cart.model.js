import mongoose from "mongoose";
const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", index: true, required: true },
  qty: { type: Number, min: 1, required: true }
}, {_id:false});
const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, index: true, required: true },
  items: { type: [cartItemSchema], default: [] },
  updatedAt: { type: Date, default: Date.now }
});
export default mongoose.model("Cart", cartSchema);
