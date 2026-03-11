const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["follow", "like", "comment", "list_shared", "friend_request", "friend_accept"],
      required: true
    },
    message: { type: String, required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetType: { type: String, enum: ["Review", "List", "User"] },
    read: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

notificationSchema.index({ recipientId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
