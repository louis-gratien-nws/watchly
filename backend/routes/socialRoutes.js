const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const socialController = require("../controllers/socialController");

router.get("/stats/:userId", socialController.getUserStats);
router.get("/leaderboard", socialController.getLeaderboard);

router.post("/follow", authMiddleware, socialController.followUser);
router.post("/unfollow", authMiddleware, socialController.unfollowUser);
router.get("/followers/:userId", socialController.getFollowers);
router.get("/following/:userId", socialController.getFollowing);

router.get("/notifications", authMiddleware, socialController.getNotifications);
router.post("/notifications/read", authMiddleware, socialController.markNotificationsAsRead);
router.delete("/notifications/:id", authMiddleware, socialController.deleteNotification);

module.exports = router;
