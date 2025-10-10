import { Router } from "express";
import Product from "../models/product.model.js";

const r = Router();

// Produkte lesen
r.get("/products", async (_req, res) => {
  const list = await Product
    .find({ $or: [{ active: true }, { active: { $exists: false } }] })
    .select("name price image_url description category featured");
  res.json(list);
});

// Einzelnes Produkt
r.get("/products/:id", async (req, res) => {
  const p = await Product
    .findById(req.params.id)
    .select("name price image_url description category featured active");
  if (!p || p.active === false) return res.sendStatus(404);
  res.json(p);
});

export default r;
