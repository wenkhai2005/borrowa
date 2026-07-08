const jwt = require("jsonwebtoken");
const env = require("../config/env");
const prisma = require("../lib/prisma");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub }
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired authentication token" });
  }
}

module.exports = requireAuth;
