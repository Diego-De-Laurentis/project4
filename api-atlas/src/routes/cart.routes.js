// api-atlas/src/routes/cart.routes.js
import { Router } from "express";
import mongoose from "mongoose";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import { requireAuth } from "../middleware/auth.js";

const r = Router();

r.post("/cart/items", requireAuth, async (req, res) => {
  try {
    const { productId } = req.body;
    const qty = parseInt(req.body.qty, 10);
    if (!productId || !Number.isInteger(qty) || qty <= 0)
      return res.status(400).json({ error: "productId/qty ungültig" });

    if (!mongoose.isValidObjectId(productId))
      return res.status(400).json({ error: "productId ungültig" });

    const _pid = new mongoose.Types.ObjectId(productId);
    const p = await Product.findById(_pid);
    if (!p || !p.active) return res.sendStatus(404);

    const incRes = await Cart.updateOne(
      { user: req.userId, "items.product": _pid },
      { $inc: { "items.$.qty": qty }, $set: { updatedAt: new Date() } }
    );

    if (incRes.matchedCount === 0) {
      await Cart.updateOne(
        { user: req.userId },
        { $push: { items: { product: _pid, qty } }, $set: { updatedAt: new Date() } },
        { upsert: true }
      );
    }

    const cart = await Cart.findOne({ user: req.userId })
      .populate({ path: "items.product", select: "name priceCents imageFileId" });
    res.json(cart ?? { user: req.userId, items: [] });
  } catch (e) {
    console.error("cart add error", e);
    res.sendStatus(500);
  }
});

export default r;
