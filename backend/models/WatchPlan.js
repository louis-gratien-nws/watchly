const mongoose = require("mongoose");

const watchPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    movieId: { type: Number, required: true },
    movieTitle: { type: String, default: "" },
    posterPath: { type: String, default: "" },
    plannedFor: { type: Date, required: true },
    status: { type: String, enum: ["planned", "done", "skipped"], default: "planned" },
    remindByEmail: { type: Boolean, default: true },
    remindByPush: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model("WatchPlan", watchPlanSchema);
