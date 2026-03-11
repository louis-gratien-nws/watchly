const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getUser,
  updateUser,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  markWatched,
  toggleFollow,
  getFeed,
  searchUsers,
  getFriendsOverview,
  getFriendCompatibility,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend
} = require("../controllers/usersController");

const router = express.Router();

router.get("/feed/activity", authMiddleware, getFeed);
router.get("/search", authMiddleware, searchUsers);
router.get("/friends/overview", authMiddleware, getFriendsOverview);
router.get("/friends/compatibility/:id", authMiddleware, getFriendCompatibility);
router.post("/friends/request/:id", authMiddleware, sendFriendRequest);
router.post("/friends/accept/:id", authMiddleware, acceptFriendRequest);
router.post("/friends/reject/:id", authMiddleware, rejectFriendRequest);
router.delete("/friends/request/:id", authMiddleware, cancelFriendRequest);
router.delete("/friends/:id", authMiddleware, removeFriend);
router.get("/:id", getUser);
router.put("/:id", authMiddleware, updateUser);
router.get("/:id/watchlist", getWatchlist);
router.post("/watchlist", authMiddleware, addToWatchlist);
router.delete("/watchlist/:movieId", authMiddleware, removeFromWatchlist);
router.post("/watched", authMiddleware, markWatched);
router.post("/:id/follow", authMiddleware, toggleFollow);

module.exports = router;
