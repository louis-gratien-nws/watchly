const Like = require("../models/Like");
const Review = require("../models/Review");
const List = require("../models/List");
const User = require("../models/User");
const Notification = require("../models/Notification");

exports.likeReview = async (req, res) => {
  try {
    const { reviewId } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if already liked
    const existingLike = await Like.findOne({
      userId,
      targetId: reviewId,
      targetType: "Review"
    });

    if (existingLike) {
      return res.status(400).json({ message: "Already liked" });
    }

    // Create like
    await Like.create({
      userId,
      targetId: reviewId,
      targetType: "Review"
    });

    // Update review likes array
    if (!review.likes.includes(userId)) {
      review.likes.push(userId);
      await review.save();
    }

    // Update user stats
    const user = await User.findById(userId);
    user.stats.likesCount = (user.stats.likesCount || 0) + 1;
    await user.save();

    // Create notification for review author
    if (review.userId.toString() !== userId) {
      await Notification.create({
        recipientId: review.userId,
        senderId: userId,
        type: "like",
        message: `${user.username} liked your review`,
        targetId: reviewId,
        targetType: "Review"
      });

      const reviewAuthor = await User.findById(review.userId);
      reviewAuthor.unreadNotifications += 1;
      await reviewAuthor.save();
    }

    res.json({ message: "Review liked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unlikeReview = async (req, res) => {
  try {
    const { reviewId } = req.body;
    const userId = req.user.id;

    const like = await Like.findOneAndDelete({
      userId,
      targetId: reviewId,
      targetType: "Review"
    });

    if (!like) {
      return res.status(400).json({ message: "Like not found" });
    }

    // Update review likes array
    await Review.findByIdAndUpdate(reviewId, {
      $pull: { likes: userId }
    });

    // Update user stats
    const user = await User.findById(userId);
    user.stats.likesCount = Math.max(0, (user.stats.likesCount || 0) - 1);
    await user.save();

    res.json({ message: "Review unliked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.likeList = async (req, res) => {
  try {
    const { listId } = req.body;
    const userId = req.user.id;

    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    const existingLike = await Like.findOne({
      userId,
      targetId: listId,
      targetType: "List"
    });

    if (existingLike) {
      return res.status(400).json({ message: "Already liked" });
    }

    await Like.create({
      userId,
      targetId: listId,
      targetType: "List"
    });

    if (!list.likes) list.likes = [];
    if (!list.likes.includes(userId)) {
      list.likes.push(userId);
      await list.save();
    }

    const user = await User.findById(userId);
    user.stats.likesCount = (user.stats.likesCount || 0) + 1;
    await user.save();

    // Notification
    if (list.userId.toString() !== userId) {
      await Notification.create({
        recipientId: list.userId,
        senderId: userId,
        type: "like",
        message: `${user.username} liked your list`,
        targetId: listId,
        targetType: "List"
      });

      const listAuthor = await User.findById(list.userId);
      listAuthor.unreadNotifications += 1;
      await listAuthor.save();
    }

    res.json({ message: "List liked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unlikeList = async (req, res) => {
  try {
    const { listId } = req.body;
    const userId = req.user.id;

    await Like.findOneAndDelete({
      userId,
      targetId: listId,
      targetType: "List"
    });

    await List.findByIdAndUpdate(listId, {
      $pull: { likes: userId }
    });

    const user = await User.findById(userId);
    user.stats.likesCount = Math.max(0, (user.stats.likesCount || 0) - 1);
    await user.save();

    res.json({ message: "List unliked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLikesCount = async (req, res) => {
  try {
    const { targetId, targetType } = req.query;
    const count = await Like.countDocuments({
      targetId,
      targetType
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.isLiked = async (req, res) => {
  try {
    const { targetId, targetType } = req.query;
    const userId = req.user.id;

    const like = await Like.findOne({
      userId,
      targetId,
      targetType
    });

    res.json({ liked: !!like });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
