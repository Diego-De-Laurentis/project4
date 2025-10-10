import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Cart from "../models/cart.model.js";

const r = Router();

function cookieOpts() {
  const secure = String(process.env.COOKIE_SECURE || "true").toLowerCase() === "true";
  return { httpOnly: true, sameSite: "lax", secure, path: "/" };
}

r.post("/auth/register", async (req, res) => {
  let { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email/password nötig" });
  email = String(email).trim().toLowerCase();
  if (await User.findOne({ email })) return res.status(409).json({ error: "bereits vorhanden" });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash });
  await Cart.create({ user: user._id });

  const token = jwt.sign({ uid: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, cookieOpts());
  res.status(201).json({ id: user._id, email: user.email });
});

r.post("/auth/login", async (req, res) => {
  let { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email/password nötig" });
  email = String(email).trim().toLowerCase();

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.sendStatus(401);

  const token = jwt.sign({ uid: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, cookieOpts());
  res.json({ id: user._id, email: user.email });
});

r.post("/auth/logout", (_req, res) => {
  res.clearCookie("token", { path: "/" });
  res.sendStatus(204);
});

export default r;
