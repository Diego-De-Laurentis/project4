import jwt from "jsonwebtoken";
export function requireAuth(req, res, next) {
  const bearer = req.headers.authorization;
  const headerToken = bearer?.startsWith("Bearer ") ? bearer.slice(7) : null;
  const raw = req.cookies?.token || headerToken;
  if (!raw) return res.sendStatus(401);
  try {
    const { uid } = jwt.verify(raw, process.env.JWT_SECRET, { algorithms:["HS256"], clockTolerance:5 });
    req.userId = uid; next();
  } catch { res.sendStatus(401); }
}
