import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";

const r = Router();

// Cart lesen
r.get("/cart", requireAuth, async (req, res) => {
  const cart = await Cart.findOne({ user: req.userId })
    .populate({ path: "items.product", select: "name price image_url" })
    .lean();
  res.json(cart ?? { user: req.userId, items: [] });
});

// Item hinzufügen / Menge erhöhen
r.post("/cart/items", requireAuth, async (req, res) => {
  const { productId, qty } = req.body || {};
  if (!productId || !Number.isInteger(qty) || qty <= 0)
    return res.status(400).json({ error: "productId/qty ungültig" });

  const _pid = new mongoose.Types.ObjectId(productId);
  const p = await Product.findById(_pid);
  if (!p) return res.sendStatus(404);

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
    .populate({ path: "items.product", select: "name price image_url" });
  res.json(cart);
});

// Menge setzen oder löschen
r.put("/cart/items/:productId", requireAuth, async (req, res) => {
  const { qty } = req.body || {};
  const _pid = new mongoose.Types.ObjectId(req.params.productId);
  if (!Number.isInteger(qty)) return res.status(400).json({ error: "qty ungültig" });

  if (qty <= 0) {
    await Cart.updateOne(
      { user: req.userId },
      { $pull: { items: { product: _pid } }, $set: { updatedAt: new Date() } }
    );
  } else {
    await Cart.updateOne(
      { user: req.userId, "items.product": _pid },
      { $set: { "items.$.qty": qty, updatedAt: new Date() } }
    );
  }

  const cart = await Cart.findOne({ user: req.userId })
    .populate({ path: "items.product", select: "name price image_url" });
  res.json(cart);
});

// Item entfernen
r.delete("/cart/items/:productId", requireAuth, async (req, res) => {
  const _pid = new mongoose.Types.ObjectId(req.params.productId);
  await Cart.updateOne(
    { user: req.userId },
    { $pull: { items: { product: _pid } }, $set: { updatedAt: new Date() } }
  );
  const cart = await Cart.findOne({ user: req.userId })
    .populate({ path: "items.product", select: "name price image_url" });
  res.json(cart);
});

export default r;
