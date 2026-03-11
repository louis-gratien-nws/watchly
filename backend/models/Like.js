const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    targetType: { type: String, enum: ["Review", "List"], required: true }
  },
  { timestamps: { createdAt: true } }
);

// Index pour éviter les doublons et les recherches rapides
likeSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });
likeSchema.index({ targetId: 1, targetType: 1 });

module.exports = mongoose.model("Like", likeSchema);
