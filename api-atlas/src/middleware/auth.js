import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const raw = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
  if (!raw) return res.sendStatus(401);
  try {
    const { uid } = jwt.verify(raw, process.env.JWT_SECRET);
    req.userId = uid;
    next();
  } catch {
    res.sendStatus(401);
  }
}
