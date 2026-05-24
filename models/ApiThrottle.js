import mongoose from 'mongoose';

const ApiThrottleSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    count: { type: Number, required: true, default: 1 },
    resetAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export default mongoose.models.ApiThrottle || mongoose.model('ApiThrottle', ApiThrottleSchema);
