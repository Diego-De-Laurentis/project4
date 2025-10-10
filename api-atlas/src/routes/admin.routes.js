import { Router } from "express";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Busboy from "busboy";

const r = Router();

// ---- Produkte ----
r.get("/admin/products", async (_req, res) => {
  const list = await Product.find().lean();
  res.json(list);
});

// akzeptiert JSON **und** multipart/form-data
r.post("/admin/products", async (req, res) => {
  const ct = req.headers["content-type"] || "";
  const handleCreate = async (data) => {
    const name = String(data.name||"").trim();
    const sku  = String(data.sku||"").trim();
    const priceCents = Number.parseInt(data.priceCents,10);
    const imageFileId = data.imageFileId || undefined;
    const active = String(data.active ?? "true").toLowerCase() !== "false";
    if (!name || !Number.isFinite(priceCents)) return res.status(400).json({ error:"name/priceCents nötig" });
    const p = await Product.create({ name, sku, priceCents, imageFileId, active });
    return res.status(201).json(p);
  };

  if (ct.includes("multipart/form-data")) {
    const bb = Busboy({ headers: req.headers });
    const fields = {};
    bb.on("field", (name, val) => { fields[name] = val; });
    bb.on("finish", () => { handleCreate(fields).catch(err => res.status(500).json({ error: String(err.message||err) })); });
    req.pipe(bb);
  } else {
    handleCreate(req.body||{}).catch(err => res.status(500).json({ error: String(err.message||err) }));
  }
});

// ---- Users ----
r.get("/admin/users", async (_req, res) => {
  const users = await User.find().select("_id email createdAt").lean();
  res.json(users);
});

// ---- Orders (Stub) ----
r.get("/admin/orders", async (_req, res) => res.json([]));

// ---- Stats/Statistics ----
r.get("/admin/stats", async (_req, res) => {
  const [products, users] = await Promise.all([
    Product.countDocuments(), User.countDocuments()
  ]);
  res.json({ products, users, orders: 0, revenueCents: 0 });
});
r.get("/admin/statistics", async (req, res) => { // alias für dein Frontend
  const [products, users] = await Promise.all([
    Product.countDocuments(), User.countDocuments()
  ]);
  res.json({ products, users, orders: 0, revenueCents: 0 });
});

export default r;
