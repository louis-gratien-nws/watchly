const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

const ensureFriendship = (currentUser, friendId) =>
  (currentUser.friends || []).some((id) => String(id) === String(friendId));

const getOrCreateConversation = async (req, res, next) => {
  try {
    const friendId = req.params.friendId;

    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ message: "Invalid friend id" });
    }

    if (String(friendId) === String(req.user._id)) {
      return res.status(400).json({ message: "Cannot chat with yourself" });
    }

    const [currentUser, friend] = await Promise.all([
      User.findById(req.user._id).select("friends"),
      User.findById(friendId).select("username avatar")
    ]);

    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    if (!ensureFriendship(currentUser, friendId)) {
      return res.status(403).json({ message: "You can only chat with friends" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, friendId], $size: 2 }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, friendId],
        createdBy: req.user._id,
        lastMessageText: "",
        lastMessageAt: null
      });
    }

    return res.status(201).json({ conversation });
  } catch (error) {
    return next(error);
  }
};

const listConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "username avatar")
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    if (!conversations.length) {
      return res.json([]);
    }

    const conversationIds = conversations.map((c) => c._id);

    const [lastMessages, unreadCounts] = await Promise.all([
      Message.aggregate([
        { $match: { conversationId: { $in: conversationIds } } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$conversationId",
            text: { $first: "$text" },
            senderId: { $first: "$senderId" },
            createdAt: { $first: "$createdAt" }
          }
        }
      ]),
      Message.aggregate([
        {
          $match: {
            conversationId: { $in: conversationIds },
            senderId: { $ne: userId },
            readBy: { $ne: userId }
          }
        },
        { $group: { _id: "$conversationId", count: { $sum: 1 } } }
      ])
    ]);

    const lastMessageMap = new Map(lastMessages.map((item) => [String(item._id), item]));
    const unreadMap = new Map(unreadCounts.map((item) => [String(item._id), item.count]));

    const payload = conversations.map((conversation) => {
      const friend = (conversation.participants || []).find(
        (participant) => String(participant._id) !== String(userId)
      );
      const lastMessage = lastMessageMap.get(String(conversation._id));

      return {
        _id: conversation._id,
        friend,
        lastMessage: lastMessage
          ? {
              text: lastMessage.text,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt
            }
          : null,
        unreadCount: unreadMap.get(String(conversation._id)) || 0,
        updatedAt: conversation.updatedAt,
        lastMessageAt: conversation.lastMessageAt
      };
    });

    return res.json(payload);
  } catch (error) {
    return next(error);
  }
};

const listMessages = async (req, res, next) => {
  try {
    const conversationId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const limit = Math.min(Number(req.query.limit || 50), 100);

    const messages = await Message.find({ conversationId })
      .populate("senderId", "username avatar")
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    return res.json(messages);
  } catch (error) {
    return next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const text = String(req.body.text || "").trim();

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }

    if (!text) {
      return res.status(400).json({ message: "Message text required" });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const message = await Message.create({
      conversationId,
      senderId: req.user._id,
      text,
      readBy: [req.user._id]
    });

    conversation.lastMessageText = text.slice(0, 160);
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const payload = await Message.findById(message._id)
      .populate("senderId", "username avatar")
      .lean();

    return res.status(201).json(payload);
  } catch (error) {
    return next(error);
  }
};

const markConversationRead = async (req, res, next) => {
  try {
    const conversationId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: req.user._id },
        readBy: { $ne: req.user._id }
      },
      {
        $addToSet: { readBy: req.user._id }
      }
    );

    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getOrCreateConversation,
  listConversations,
  listMessages,
  sendMessage,
  markConversationRead
};
