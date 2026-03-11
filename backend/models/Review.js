const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    movieId: { type: Number, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    spoiler: { type: Boolean, default: false },
    detailedRatings: {
      scenario: { type: Number, min: 1, max: 5, default: 3 },
      acting: { type: Number, min: 1, max: 5, default: 3 },
      visuals: { type: Number, min: 1, max: 5, default: 3 },
      rhythm: { type: Number, min: 1, max: 5, default: 3 }
    },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Review", default: null },
    reviewText: { type: String, required: true, trim: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    tags: [{ type: String }]
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model("Review", reviewSchema);
