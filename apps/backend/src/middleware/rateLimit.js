const buckets = new Map();

function getClientKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || "unknown";
}

export function rateLimit({ windowMs = 60_000, max = 30 } = {}) {
  return (req, res, next) => {
    const key = `${getClientKey(req)}:${req.path}`;
    const now = Date.now();
    const state = buckets.get(key);

    if (!state || now > state.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (state.count >= max) {
      return res.status(429).json({ message: "Too many requests. Please try again soon." });
    }

    state.count += 1;
    return next();
  };
}
