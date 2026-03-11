const mongoose = require("mongoose");

const swipeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    movieId: { type: Number, required: true },
    choice: { type: String, enum: ["yes", "no"], required: true }
  },
  { _id: false }
);

const movieNightSessionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    candidateMovieIds: [{ type: Number }],
    swipes: [swipeSchema],
    status: { type: String, enum: ["open", "closed"], default: "open" }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model("MovieNightSession", movieNightSessionSchema);
