import { Router } from "express";
import mongoose from "mongoose";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import { requireAuth } from "../middleware/auth.js";

const r = Router();

// Warenkorb lesen
r.get("/cart", requireAuth, async (req, res) => {
  const cart = await Cart.findOne({ user: req.userId })
    .populate({ path: "items.product", select: "name price image_url" })
    .lean();
  res.json(cart ?? { user: req.userId, items: [] });
});

// Item hinzufügen
r.post("/cart/items", requireAuth, async (req, res) => {
  const { productId, qty } = req.body || {};
  if (!productId || !Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({ error: "productId/qty ungültig" });
  }

  const _pid = new mongoose.Types.ObjectId(productId);
  const p = await Product.findById(_pid);
  if (!p || p.active === false) return res.sendStatus(404);

  // Inkrementieren, falls vorhanden
  const inc = await Cart.updateOne(
    { user: req.userId, "items.product": _pid },
    { $inc: { "items.$.qty": qty }, $set: { updatedAt: new Date() } }
  );

  // Sonst pushen (und ggf. Cart erzeugen)
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

// Menge setzen
r.put("/cart/items/:productId", requireAuth, async (req, res) => {
  const { qty } = req.body || {};
  const { productId } = req.params;
  if (!Number.isInteger(qty)) return res.status(400).json({ error: "qty ungültig" });

  if (qty <= 0) {
    await Cart.updateOne(
      { user: req.userId },
      { $pull: { items: { product: productId } }, $set: { updatedAt: new Date() } }
    );
  } else {
    await Cart.updateOne(
      { user: req.userId, "items.product": productId },
      { $set: { "items.$.qty": qty, updatedAt: new Date() } }
    );
  }

  const cart = await Cart.findOne({ user: req.userId })
    .populate({ path: "items.product", select: "name price image_url" });
  res.json(cart);
});

// Item entfernen
r.delete("/cart/items/:productId", requireAuth, async (req, res) => {
  await Cart.updateOne(
    { user: req.userId },
    { $pull: { items: { product: req.params.productId } }, $set: { updatedAt: new Date() } }
  );
  const cart = await Cart.findOne({ user: req.userId })
    .populate({ path: "items.product", select: "name price image_url" });
  res.json(cart);
});

export default r;
