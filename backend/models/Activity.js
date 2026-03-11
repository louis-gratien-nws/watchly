const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["watched", "watchlist_add", "review_create"],
      required: true
    },
    movieId: { type: Number },
    reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review" },
    message: { type: String, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model("Activity", activitySchema);
