const Review = require("../models/Review");
const User = require("../models/User");
const Activity = require("../models/Activity");
const Notification = require("../models/Notification");
const { calculateAchievements } = require("../utils/calculateAchievements");

const getStableTimestamp = (review) => {
  const createdAt = review?.createdAt ? new Date(review.createdAt).getTime() : NaN;
  if (!Number.isNaN(createdAt)) {
    return createdAt;
  }

  // Fallback to ObjectId timestamp for legacy/malformed dates.
  try {
    return review?._id?.getTimestamp?.()?.getTime?.() || 0;
  } catch {
    return 0;
  }
};

const sortRepliesOldestFirst = (a, b) => {
  const timeA = getStableTimestamp(a);
  const timeB = getStableTimestamp(b);

  if (timeA !== timeB) {
    return timeA - timeB;
  }

  // Deterministic tie-breaker when timestamps are equal.
  return String(a?._id || "").localeCompare(String(b?._id || ""));
};

const createReview = async (req, res, next) => {
  try {
    const {
      movieId,
      rating,
      reviewText,
      tags = [],
      spoiler = false,
      parentId = null,
      detailedRatings = {}
    } = req.body;
    const userId = req.user._id;

    if (!movieId || rating === undefined || !reviewText) {
      return res.status(400).json({ message: "movieId, rating, reviewText required" });
    }

    const review = await Review.create({
      userId,
      movieId,
      rating,
      spoiler,
      parentId,
      detailedRatings: {
        scenario: Number(detailedRatings.scenario || 3),
        acting: Number(detailedRatings.acting || 3),
        visuals: Number(detailedRatings.visuals || 3),
        rhythm: Number(detailedRatings.rhythm || 3)
      },
      reviewText,
      tags
    });

    if (parentId) {
      const parentReview = await Review.findById(parentId).populate("userId", "_id username");
      if (parentReview && String(parentReview.userId?._id) !== String(userId)) {
        await Notification.create({
          recipientId: parentReview.userId._id,
          senderId: userId,
          type: "comment",
          message: `${user?.username || "Un utilisateur"} a repondu a votre avis`,
          targetId: parentReview._id,
          targetType: "Review"
        });

        await User.findByIdAndUpdate(parentReview.userId._id, {
          $inc: { unreadNotifications: 1 }
        });
      }
    }

    const user = await User.findById(userId);
    user.reviews.push(review._id);
    user.xp = (user.xp || 0) + 20;
    user.level = Math.max(1, Math.floor(user.xp / 100) + 1);
    const allReviews = await Review.find({ userId });
    user.achievements = calculateAchievements(user, allReviews);
    await user.save();

    await Activity.create({
      userId,
      type: "review_create",
      movieId,
      reviewId: review._id,
      message: `${user.username} left a review`
    });

    return res.status(201).json(review);
  } catch (error) {
    return next(error);
  }
};

const getMovieReviews = async (req, res, next) => {
  try {
    const movieId = Number(req.params.id);
    const reviews = await Review.find({ movieId })
      .populate("userId", "username avatar")
      .sort({ createdAt: -1 });

    const parents = reviews.filter((r) => !r.parentId);
    const children = reviews.filter((r) => Boolean(r.parentId));

    const threaded = parents.map((parent) => ({
      ...parent.toObject(),
      replies: children
        .filter((child) => String(child.parentId) === String(parent._id))
        .sort(sortRepliesOldestFirst)
    }));

    return res.json(threaded);
  } catch (error) {
    return next(error);
  }
};

const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.json(reviews);
  } catch (error) {
    return next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (String(review.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { rating, reviewText, tags } = req.body;
    if (rating !== undefined) {
      review.rating = rating;
    }
    if (reviewText !== undefined) {
      review.reviewText = reviewText;
    }
    if (tags !== undefined) {
      review.tags = tags;
    }

    await review.save();
    return res.json(review);
  } catch (error) {
    return next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (String(review.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await Review.findByIdAndDelete(id);
    await User.findByIdAndUpdate(req.user._id, { $pull: { reviews: id } });
    return res.json({ message: "Review deleted" });
  } catch (error) {
    return next(error);
  }
};

const likeReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const userId = String(req.user._id);
    const alreadyLiked = review.likes.some((id) => String(id) === userId);

    if (alreadyLiked) {
      review.likes = review.likes.filter((id) => String(id) !== userId);
    } else {
      review.likes.push(req.user._id);
    }

    await review.save();
    return res.json({ likesCount: review.likes.length, liked: !alreadyLiked });
  } catch (error) {
    return next(error);
  }
};

const commentReview = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Comment text required" });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.comments.push({ userId: req.user._id, text });
    await review.save();
    await review.populate("comments.userId", "username avatar");

    return res.status(201).json(review.comments[review.comments.length - 1]);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createReview,
  getMovieReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  likeReview,
  commentReview
};
