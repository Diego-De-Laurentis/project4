import { Router } from "express";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

const r = Router();

// Produkte
r.get("/admin/products", async (_req, res) => {
  const list = await Product.find().lean();
  res.json(list);
});
r.post("/admin/products", async (req, res) => {
  const { name, sku, priceCents, imageFileId, active = true } = req.body || {};
  if (!name || !Number.isFinite(+priceCents)) return res.status(400).json({ error: "name/priceCents nötig" });
  const p = await Product.create({ name, sku, priceCents: +priceCents, imageFileId, active });
  res.status(201).json(p);
});

// Users
r.get("/admin/users", async (_req, res) => {
  const users = await User.find().select("_id email createdAt").lean();
  res.json(users);
});

// Orders (Stub)
r.get("/admin/orders", async (_req, res) => { res.json([]); });

// Stats (minimal)
r.get("/admin/stats", async (_req, res) => {
  const [products, users] = await Promise.all([
    Product.countDocuments(), User.countDocuments()
  ]);
  res.json({ products, users, orders: 0, revenueCents: 0 });
});

export default r;
