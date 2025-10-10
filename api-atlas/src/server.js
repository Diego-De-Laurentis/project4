import "dotenv/config.js";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connect } from "./db.js";
import authRoutes from "./routes/auth.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import productRoutes from "./routes/product.routes.js";
import adminRoutes from "./routes/admin.routes.js"; // <— hinzugefügt
app.use("/api", adminRoutes);

const app = express();
app.set("trust proxy", 1);

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "data:"],
      "style-src":  ["'self'", "'unsafe-inline'"],
      "img-src":    ["'self'", "data:"],
      "connect-src": ["'self'", "data:"],     // <— data: erlaubt
      "frame-src":  ["'self'", "https://www.google.com"]
    }
  }
}));

if (process.env.FRONTEND_ORIGIN) {
  app.use(cors({
    origin: process.env.FRONTEND_ORIGIN.split(","),
    credentials: true
  }));
}

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

// API
app.use("/api", authRoutes);
app.use("/api", cartRoutes);
app.use("/api", productRoutes);
app.use("/api", adminRoutes); // <— hinzugefügt

// Static aus Repo-Root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
app.use(express.static(ROOT));

// Health + SPA-Fallback
app.get("/healthz", (_req, res) => res.json({ ok: true }));
app.get("*", (_req, res) => res.sendFile(path.join(ROOT, "index.html")));

const port = Number(process.env.PORT || 8080);
await connect();
const { default: mongoose } = await import("mongoose");
console.log("DB name:", mongoose.connection.name);
app.listen(port, () => console.log(`API on :${port}`));
