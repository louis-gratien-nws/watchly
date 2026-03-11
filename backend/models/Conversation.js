const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lastMessageText: { type: String, default: "" },
    lastMessageAt: { type: Date, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1, updatedAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
