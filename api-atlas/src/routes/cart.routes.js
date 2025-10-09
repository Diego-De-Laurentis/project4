import { Router } from "express";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import { requireAuth } from "../middleware/auth.js";
const r = Router();
r.get("/cart", requireAuth, async (req, res) => {
  const cart = await Cart.findOne({ user: req.userId })
    .populate({ path: "items.product", select: "name priceCents imageFileId" })
    .lean();
  res.json(cart ?? { user: req.userId, items: [] });
});
r.post("/cart/items", requireAuth, async (req, res) => {
  const { productId, qty } = req.body;
  if (!productId || !Number.isInteger(qty) || qty <= 0) return res.status(400).json({ error: "productId/qty ungültig" });
  const p = await Product.findById(productId);
  if (!p || !p.active) return res.sendStatus(404);
  const updated = await Cart.findOneAndUpdate(
    { user: req.userId, "items.product": { $ne: productId } },
    { $push: { items: { product: productId, qty } }, $set: { updatedAt: new Date() } },
    { upsert: true, new: true }
  );
  if (!updated.items.find(i => String(i.product) === String(productId))) {
    await Cart.updateOne({ user: req.userId, "items.product": productId },
      { $inc: { "items.$.qty": qty }, $set: { updatedAt: new Date() } });
  }
  const cart = await Cart.findOne({ user: req.userId })
    .populate({ path: "items.product", select: "name priceCents imageFileId" });
  res.json(cart);
});
r.put("/cart/items/:productId", requireAuth, async (req, res) => {
  const { qty } = req.body;
  const { productId } = req.params;
  if (!Number.isInteger(qty)) return res.status(400).json({ error: "qty ungültig" });
  if (qty <= 0) {
    await Cart.updateOne({ user: req.userId }, { $pull: { items: { product: productId } }, $set: { updatedAt: new Date() } });
  } else {
    await Cart.updateOne({ user: req.userId, "items.product": productId },
      { $set: { "items.$.qty": qty, updatedAt: new Date() } });
  }
  const cart = await Cart.findOne({ user: req.userId })
    .populate({ path: "items.product", select: "name priceCents imageFileId" });
  res.json(cart);
});
r.delete("/cart/items/:productId", requireAuth, async (req, res) => {
  await Cart.updateOne({ user: req.userId }, { $pull: { items: { product: req.params.productId } }, $set: { updatedAt: new Date() } });
  const cart = await Cart.findOne({ user: req.userId })
    .populate({ path: "items.product", select: "name priceCents imageFileId" });
  res.json(cart);
});
export default r;
