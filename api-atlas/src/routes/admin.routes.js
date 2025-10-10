import { Router } from "express";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

const r = Router();

r.get("/admin/products", async (_req, res) => {
  const list = await Product.find().lean();
  res.json({ success: true, products: list });
});

r.post("/admin/products", async (req, res) => {
  const { name, price, image_url, description, category, featured, active } = req.body || {};
  const nPrice = Number(price);
  if (!name || !Number.isFinite(nPrice)) return res.status(400).json({ error: "name/price nötig" });
  const doc = await Product.create({
    name: String(name).trim(),
    price: nPrice,
    image_url: image_url || "",
    description: description || "",
    category: category || "",
    featured: !!featured,
    active: active === false ? false : true
  });
  res.status(201).json({ success: true, product: doc });
});

r.get("/admin/users", async (_req, res) => {
  const users = await User.find().select("_id email createdAt").lean();
  res.json({ success: true, users });
});

r.get("/admin/orders", async (_req, res) => res.json({ success: true, orders: [] }));

r.get("/admin/statistics", async (_req, res) => {
  const [products, users] = await Promise.all([
    Product.countDocuments(), User.countDocuments()
  ]);
  res.json({ success: true, statistics: { totalProducts: products, totalUsers: users, totalOrders: 0, totalRevenue: 0 } });
});

export default r;
