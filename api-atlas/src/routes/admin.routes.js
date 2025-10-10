import { Router } from "express";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Busboy from "busboy";

const r = Router();

// Alle Produkte
r.get("/admin/products", async (_req, res) => {
  const list = await Product.find().lean();
  res.json(list);
});

// Produkt anlegen – akzeptiert JSON **oder** multipart/form-data
r.post("/admin/products", async (req, res) => {
  const ct = (req.headers["content-type"] || "").toLowerCase();

  async function createFrom(data) {
    const doc = {
      name: String(data.name || "").trim(),
      price: Number(data.price),
      image_url: String(data.image_url || ""),
      description: String(data.description || ""),
      category: String(data.category || ""),
      featured: !!data.featured,
      active: data.active === false ? false : true,
    };
    if (!doc.name || !Number.isFinite(doc.price)) {
      return res.status(400).json({ error: "name/price nötig" });
    }
    const saved = await Product.create(doc);
    return res.status(201).json(saved);
  }

  if (ct.includes("multipart/form-data")) {
    const bb = Busboy({ headers: req.headers });
    const fields = {};
    bb.on("field", (n, v) => { fields[n] = v; });
    bb.on("finish", () => createFrom(fields).catch(e =>
      res.status(500).json({ error: String(e?.message || e) })
    ));
    req.pipe(bb);
  } else {
    createFrom(req.body || {}).catch(e =>
      res.status(500).json({ error: String(e?.message || e) })
    );
  }
});

// Users
r.get("/admin/users", async (_req, res) =>
  res.json(await User.find().select("_id email createdAt").lean())
);

// Orders (Stub)
r.get("/admin/orders", async (_req, res) => res.json([]));

// Statistik
r.get("/admin/statistics", async (_req, res) => {
  const [products, users] = await Promise.all([
    Product.countDocuments(), User.countDocuments()
  ]);
  res.json({ products, users, orders: 0, revenue: 0 });
});

export default r;
