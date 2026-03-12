const mongoose = require("mongoose");

const clubMemberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
    points: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 700 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const pollOptionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 120 },
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { _id: false }
);

const pollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 180 },
    options: {
      type: [pollOptionSchema],
      validate: {
        validator: (value) => Array.isArray(value) && value.length >= 2 && value.length <= 6,
        message: "Poll needs between 2 and 6 options"
      }
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["role_update", "member_removed", "ownership_transfer"],
      required: true
    },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    actorUsername: { type: String, required: true },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetUsername: { type: String, required: true },
    metadata: {
      fromRole: { type: String, default: null },
      toRole: { type: String, default: null },
      previousOwnerRole: { type: String, default: null }
    },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: "", maxlength: 350 },
    isPrivate: { type: Boolean, default: true },
    inviteCode: { type: String, required: true, unique: true, uppercase: true, minlength: 6, maxlength: 8 },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [clubMemberSchema], default: [] },
    posts: { type: [postSchema], default: [] },
    polls: { type: [pollSchema], default: [] },
    auditLogs: { type: [auditLogSchema], default: [] }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model("Club", clubSchema);
