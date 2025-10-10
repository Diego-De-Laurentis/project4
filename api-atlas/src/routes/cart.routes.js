import { Router } from "express";
import mongoose from "mongoose";
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
  const { productId } = req.body; const qty = parseInt(req.body.qty, 10);
  if (!productId || !Number.isInteger(qty) || qty <= 0) return res.status(400).json({ error: "productId/qty ungültig" });
  if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ error: "productId ungültig" });
  const _pid = new mongoose.Types.ObjectId(productId);
  const p = await Product.findById(_pid); if (!p || !p.active) return res.sendStatus(404);

  const inc = await Cart.updateOne(
    { user: req.userId, "items.product": _pid },
    { $inc: { "items.$.qty": qty }, $set: { updatedAt: new Date() } }
  );
  if (inc.matchedCount === 0) {
    await Cart.updateOne(
      { user: req.userId },
      { $push: { items: { product: _pid, qty } }, $set: { updatedAt: new Date() } },
      { upsert: true }
    );
  }
  const cart = await Cart.findOne({ user: req.userId })
    .populate({ path: "items.product", select: "name priceCents imageFileId" });
  res.json(cart);
});

r.put("/cart/items/:productId", requireAuth, async (req, res) => {
  const qty = parseInt(req.body.qty,10);
  const _pid = new mongoose.Types.ObjectId(req.params.productId);
  if (!Number.isInteger(qty)) return res.status(400).json({ error: "qty ungültig" });
  if (qty <= 0) {
    await Cart.updateOne({ user: req.userId }, { $pull: { items: { product: _pid } }, $set: { updatedAt: new Date() } });
  } else {
    await Cart.updateOne({ user: req.userId, "items.product": _pid }, { $set: { "items.$.qty": qty, updatedAt: new Date() } });
  }
  const cart = await Cart.findOne({ user: req.userId })
    .populate({ path: "items.product", select: "name priceCents imageFileId" });
  res.json(cart);
});

r.delete("/cart/items/:productId", requireAuth, async (req, res) => {
  const _pid = new mongoose.Types.ObjectId(req.params.productId);
  await Cart.updateOne({ user: req.userId }, { $pull: { items: { product: _pid } }, $set: { updatedAt: new Date() } });
  const cart = await Cart.findOne({ user: req.userId })
    .populate({ path: "items.product", select: "name priceCents imageFileId" });
  res.json(cart);
});

export default r;
