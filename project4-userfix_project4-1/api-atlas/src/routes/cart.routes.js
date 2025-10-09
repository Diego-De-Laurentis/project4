import mongoose from "mongoose";

r.post("/cart/items", requireAuth, async (req, res) => {
  const { productId, qty } = req.body;
  if (!productId || !Number.isInteger(qty) || qty <= 0)
    return res.status(400).json({ error: "productId/qty ungültig" });

  const _pid = new mongoose.Types.ObjectId(productId);

  const p = await Product.findById(_pid);
  if (!p || !p.active) return res.sendStatus(404);

  // 1) Menge erhöhen, falls Artikel schon im Warenkorb
  const incRes = await Cart.updateOne(
    { user: req.userId, "items.product": _pid },
    { $inc: { "items.$.qty": qty }, $set: { updatedAt: new Date() } }
  );

  // 2) Falls nichts verändert wurde, Item neu anlegen (oder Cart erzeugen)
  if (incRes.matchedCount === 0) {
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
