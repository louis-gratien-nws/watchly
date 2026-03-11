const User = require("../models/User");
const Like = require("../models/Like");
const Notification = require("../models/Notification");

// ============== STATS ==============
exports.getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      stats: user.stats,
      achievements: user.achievements,
      level: user.level,
      xp: user.xp
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============== FOLLOWS ==============
exports.followUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user.id;

    if (userId === targetUserId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.following.includes(targetUserId)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    user.following.push(targetUserId);
    targetUser.followers.push(userId);
    targetUser.stats.followersCount = targetUser.followers.length;
    user.stats.followingCount = user.following.length;

    await user.save();
    await targetUser.save();

    // Create notification
    await Notification.create({
      recipientId: targetUserId,
      senderId: userId,
      type: "follow",
      message: `${user.username} started following you`,
      targetId: userId,
      targetType: "User"
    });

    targetUser.unreadNotifications += 1;
    await targetUser.save();

    res.json({ message: "Following user" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    user.following = user.following.filter(id => id.toString() !== targetUserId);
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId);

    targetUser.stats.followersCount = targetUser.followers.length;
    user.stats.followingCount = user.following.length;

    await user.save();
    await targetUser.save();

    res.json({ message: "Unfollowed user" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("followers", "username avatar bio")
      .lean();

    res.json(user?.followers || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("following", "username avatar bio")
      .lean();

    res.json(user?.following || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============== LEADERBOARD ==============
exports.getLeaderboard = async (req, res) => {
  try {
    const { type = "followers", limit = 20 } = req.query;

    let sortField = {};
    if (type === "followers") sortField = { "stats.followersCount": -1 };
    if (type === "reviews") sortField = { "stats.reviewsCount": -1 };
    if (type === "likes") sortField = { "stats.likesCount": -1 };
    if (type === "xp") sortField = { xp: -1 };

    const leaderboard = await User.find()
      .select("username avatar bio level xp stats")
      .sort(sortField)
      .limit(parseInt(limit))
      .lean();

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============== NOTIFICATIONS ==============
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user.id })
      .populate("senderId", "username avatar")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markNotificationsAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;

    await Notification.updateMany(
      { _id: { $in: notificationIds } },
      { read: true }
    );

    const user = await User.findById(req.user.id);
    user.unreadNotifications = Math.max(0, user.unreadNotifications - notificationIds.length);
    await user.save();

    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
