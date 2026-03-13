import jwt from "jsonwebtoken";
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  console.log("[AUTH] incoming Authorization header:", header);
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    console.log("[AUTH] missing token");
    return res.status(401).json({ message: "Missing token" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    console.error("[AUTH] jwt verify error:", e.message);
    return res.status(401).json({ message: "Invalid/expired token" });
  }
}