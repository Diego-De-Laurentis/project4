import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const itemSchema = new mongoose.Schema(
  {
    product: { type: ObjectId, ref: "Product", required: true },
    qty: { type: Number, min: 1, default: 1 }
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: ObjectId, ref: "User", unique: true, index: true, required: true },
    items: { type: [itemSchema], default: [] },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("Cart", cartSchema);
