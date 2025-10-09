import { Router } from "express";
import Product from "../models/product.model.js";
const r = Router();
r.get("/products", async (_req, res) => {
  const list = await Product.find({ active: true }).select("sku name priceCents imageFileId");
  res.json(list);
});
r.get("/products/:id", async (req, res) => {
  const p = await Product.findById(req.params.id).select("sku name priceCents imageFileId active");
  if (!p || !p.active) return res.sendStatus(404);
  res.json(p);
});
export default r;
