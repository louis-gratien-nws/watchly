const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getOrCreateConversation,
  listConversations,
  listMessages,
  sendMessage,
  markConversationRead
} = require("../controllers/chatController");

const router = express.Router();

router.get("/", authMiddleware, listConversations);
router.post("/friend/:friendId", authMiddleware, getOrCreateConversation);
router.get("/:id/messages", authMiddleware, listMessages);
router.post("/:id/messages", authMiddleware, sendMessage);
router.post("/:id/read", authMiddleware, markConversationRead);

module.exports = router;
