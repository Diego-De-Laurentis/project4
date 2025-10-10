import "dotenv/config.js";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { connect } from "./db.js";
import authRoutes from "./routes/auth.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import productRoutes from "./routes/product.routes.js";

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit:"1mb" }));

// API
app.use("/api", authRoutes);
app.use("/api", cartRoutes);
app.use("/api", productRoutes);

// Static from repo root, without modifying your frontend files
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
app.use(express.static(ROOT));

app.get("/healthz", (_req,res)=>res.json({ ok:true }));
app.get("*", (_req,res)=>res.sendFile(path.join(ROOT,"index.html")));

const port = Number(process.env.PORT || 8080);
await connect();
const { default: mongoose } = await import("mongoose");
console.log("DB name:", mongoose.connection.name);
app.listen(port, ()=>console.log(`API on :${port}`));
