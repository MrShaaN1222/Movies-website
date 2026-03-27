import { User } from "../models/User.js";

export async function requirePhoneVerified(req, res, next) {
  try {
    const u = await User.findById(req.user.sub).select("phoneVerified");
    if (!u?.phoneVerified) {
      return res.status(403).json({
        message: "Verify your mobile number before completing this purchase.",
        code: "PHONE_NOT_VERIFIED",
      });
    }
    return next();
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
