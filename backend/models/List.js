const mongoose = require("mongoose");

const listSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isCollaborative: { type: Boolean, default: false },
    collaborators: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, enum: ["owner", "editor", "viewer"], default: "editor" }
      }
    ],
    movies: [{ type: Number }],
    votes: [
      {
        movieId: { type: Number, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        value: { type: Number, enum: [1, -1], required: true }
      }
    ],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model("List", listSchema);
