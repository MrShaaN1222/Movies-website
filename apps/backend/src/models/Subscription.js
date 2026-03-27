import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    provider: { type: String, default: "razorpay" },
    planCode: { type: String, required: true },
    status: { type: String, enum: ["inactive", "active", "past_due", "cancelled"], default: "inactive" },
    razorpayCustomerId: String,
    razorpaySubscriptionId: String,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    planStartedAt: Date,
    currentPeriodEnd: Date,
    previousPlanCode: String,
    previousProvider: String,
    previousStatus: String,
    previousPeriodEnd: Date,
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
