function createRateLimit({ windowMs, max, message }) {
  const attempts = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip}:${req.originalUrl}`;
    const current = attempts.get(key) || { count: 0, resetAt: now + windowMs };

    if (current.resetAt <= now) {
      current.count = 0;
      current.resetAt = now + windowMs;
    }

    current.count += 1;
    attempts.set(key, current);

    if (current.count > max) {
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        message,
        retryAfterSeconds
      });
    }

    return next();
  };
}

module.exports = createRateLimit;
