import "dotenv/config.js";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { connect } from "./db.js";

// Robuste Importe: default ODER module.exports
import * as authM from "./routes/auth.routes.js";
import * as cartM from "./routes/cart.routes.js";
import * as productM from "./routes/product.routes.js";
import * as imageM from "./routes/images.routes.js";

const authRoutes = authM.default || authM;
const cartRoutes = cartM.default || cartM;
const productRoutes = productM.default || productM;
const imageRoutes = imageM.default || imageM;

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

// API unter /api
app.use("/api", authRoutes);
app.use("/api", cartRoutes);
app.use("/api", productRoutes);
app.use("/api", imageRoutes);

// Health
app.get("/healthz", (_req, res) => res.json({ ok: true }));

// Static aus Repo-Root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
app.use("/img", express.static(path.join(ROOT, "img")));
app.use("/content", express.static(path.join(ROOT, "content")));
app.use("/admin", express.static(path.join(ROOT, "admin")));
app.use("/auth", express.static(path.join(ROOT, "auth")));
app.get("/", (_req, res) => res.sendFile(path.join(ROOT, "index.html")));
app.get("/styles.css", (_req, res) => res.sendFile(path.join(ROOT, "styles.css")));
app.get("/script.js", (_req, res) => res.sendFile(path.join(ROOT, "script.js")));
app.get("*", (_req, res) => res.sendFile(path.join(ROOT, "404.html")));

const port = Number(process.env.PORT || 8080);
await connect();
import mongoose from "mongoose";
console.log("DB name:", mongoose.connection.name);
app.listen(port, () => console.log(`API on :${port}`));
