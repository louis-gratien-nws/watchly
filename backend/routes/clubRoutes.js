const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  listMyClubs,
  createClub,
  joinClubByCode,
  getClubDetails,
  getClubNotifications,
  getClubUnreadCount,
  getGlobalClubUnreadCount,
  markClubNotificationsAsRead,
  createClubPost,
  togglePostLike,
  createPoll,
  votePoll,
  updateMemberRole,
  removeMember,
  transferOwnership,
  getClubRanking,
  getClubStats,
  getClubAuditLogs,
  streamClubEvents,
  regenerateInviteCode,
  leaveClub
} = require("../controllers/clubsController");

const router = express.Router();

router.get("/", authMiddleware, listMyClubs);
router.get("/stream", authMiddleware, streamClubEvents);
router.get("/unread-count", authMiddleware, getGlobalClubUnreadCount);
router.post("/", authMiddleware, createClub);
router.post("/join", authMiddleware, joinClubByCode);
router.get("/:id", authMiddleware, getClubDetails);
router.get("/:id/stats", authMiddleware, getClubStats);
router.get("/:id/notifications", authMiddleware, getClubNotifications);
router.get("/:id/notifications/unread-count", authMiddleware, getClubUnreadCount);
router.post("/:id/notifications/read", authMiddleware, markClubNotificationsAsRead);
router.get("/:id/audit", authMiddleware, getClubAuditLogs);
router.post("/:id/posts", authMiddleware, createClubPost);
router.post("/:id/posts/:postId/toggle-like", authMiddleware, togglePostLike);
router.post("/:id/polls", authMiddleware, createPoll);
router.post("/:id/polls/:pollId/vote", authMiddleware, votePoll);
router.patch("/:id/members/:memberId/role", authMiddleware, updateMemberRole);
router.delete("/:id/members/:memberId", authMiddleware, removeMember);
router.post("/:id/transfer-ownership", authMiddleware, transferOwnership);
router.get("/:id/ranking", authMiddleware, getClubRanking);
router.post("/:id/regenerate-invite", authMiddleware, regenerateInviteCode);
router.post("/:id/leave", authMiddleware, leaveClub);

module.exports = router;
