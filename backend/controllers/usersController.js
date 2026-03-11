const User = require("../models/User");
const Review = require("../models/Review");
const Activity = require("../models/Activity");
const Notification = require("../models/Notification");
const bcrypt = require("bcrypt");
const { fetchTmdb } = require("../services/tmdbService");
const { calculateAchievements } = require("../utils/calculateAchievements");

const publicUserSelect = "username avatar bio stats level xp";

const syncSocialCounts = (user) => {
  user.stats = user.stats || {};
  user.stats.followersCount = user.followers?.length || 0;
  user.stats.followingCount = user.following?.length || 0;
  user.stats.friendsCount = user.friends?.length || 0;
};

const getRelationshipStatus = (viewer, targetUserId) => {
  const targetId = String(targetUserId);

  if (String(viewer._id) === targetId) {
    return "self";
  }

  if ((viewer.friends || []).some((id) => String(id) === targetId)) {
    return "friend";
  }

  if ((viewer.friendRequestsSent || []).some((id) => String(id) === targetId)) {
    return "outgoing";
  }

  if ((viewer.friendRequestsReceived || []).some((id) => String(id) === targetId)) {
    return "incoming";
  }

  return "none";
};

const createNotification = async ({ recipientId, senderId, type, message, targetId }) => {
  await Notification.create({
    recipientId,
    senderId,
    type,
    message,
    targetId,
    targetType: "User"
  });

  await User.findByIdAndUpdate(recipientId, { $inc: { unreadNotifications: 1 } });
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate({ path: "reviews", options: { sort: { createdAt: -1 }, limit: 10 } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (String(req.user._id) !== String(userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const allowed = [
      "avatar",
      "username",
      "bio",
      "email",
      "language",
      "notificationsEnabled",
      "password"
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true
    }).select("-password");

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

const getWatchlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("watchlist");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ watchlist: user.watchlist });
  } catch (error) {
    return next(error);
  }
};

const addToWatchlist = async (req, res, next) => {
  try {
    const { movieId } = req.body;
    if (!movieId) {
      return res.status(400).json({ message: "movieId required" });
    }

    const user = await User.findById(req.user._id);
    if (!user.watchlist.includes(movieId)) {
      user.watchlist.push(movieId);
      await user.save();

      await Activity.create({
        userId: user._id,
        type: "watchlist_add",
        movieId,
        message: `${user.username} added a movie to watchlist`
      });
    }

    return res.status(201).json({ watchlist: user.watchlist });
  } catch (error) {
    return next(error);
  }
};

const removeFromWatchlist = async (req, res, next) => {
  try {
    const movieId = Number(req.params.movieId);
    const user = await User.findById(req.user._id);
    user.watchlist = user.watchlist.filter((id) => id !== movieId);
    await user.save();
    return res.json({ watchlist: user.watchlist });
  } catch (error) {
    return next(error);
  }
};

const markWatched = async (req, res, next) => {
  try {
    const { movieId } = req.body;
    if (!movieId) {
      return res.status(400).json({ message: "movieId required" });
    }

    const user = await User.findById(req.user._id);
    if (!user.watched.includes(movieId)) {
      const now = new Date();
      const previous = user.lastWatchedAt ? new Date(user.lastWatchedAt) : null;
      if (previous) {
        const diffDays = Math.floor((now - previous) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
          user.watchStreak = (user.watchStreak || 0) + 1;
        } else {
          user.watchStreak = 1;
        }
      } else {
        user.watchStreak = 1;
      }

      user.lastWatchedAt = now;
      user.xp = (user.xp || 0) + 10;
      user.level = Math.max(1, Math.floor(user.xp / 100) + 1);
      user.watched.push(movieId);
      user.watchlist = user.watchlist.filter((id) => id !== movieId);
      const userReviews = await Review.find({ userId: user._id });
      user.achievements = calculateAchievements(user, userReviews);
      await user.save();

      await Activity.create({
        userId: user._id,
        type: "watched",
        movieId,
        message: `${user.username} watched a movie`
      });
    }

    return res.json({
      watched: user.watched,
      achievements: user.achievements,
      level: user.level,
      xp: user.xp,
      watchStreak: user.watchStreak
    });
  } catch (error) {
    return next(error);
  }
};

const toggleFollow = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (String(targetId) === String(req.user._id)) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.user._id),
      User.findById(targetId)
    ]);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = currentUser.following.some(
      (id) => String(id) === String(targetId)
    );

    if (isFollowing) {
      currentUser.following = currentUser.following.filter(
        (id) => String(id) !== String(targetId)
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => String(id) !== String(req.user._id)
      );
    } else {
      currentUser.following.push(targetId);
      targetUser.followers.push(req.user._id);
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    return res.json({ following: !isFollowing });
  } catch (error) {
    return next(error);
  }
};

const getFeed = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id).select("following");
    const feed = await Activity.find({ userId: { $in: currentUser.following } })
      .populate("userId", "username avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json(feed);
  } catch (error) {
    return next(error);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const query = String(req.query.q || "").trim();

    if (!query) {
      return res.json([]);
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      username: { $regex: query, $options: "i" }
    })
      .select(publicUserSelect)
      .limit(12)
      .lean();

    return res.json(
      users.map((user) => ({
        ...user,
        relationshipStatus: getRelationshipStatus(req.user, user._id)
      }))
    );
  } catch (error) {
    return next(error);
  }
};

const getFriendsOverview = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("friends", publicUserSelect)
      .populate("friendRequestsReceived", publicUserSelect)
      .populate("friendRequestsSent", publicUserSelect);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      friends: user.friends,
      received: user.friendRequestsReceived,
      sent: user.friendRequestsSent
    });
  } catch (error) {
    return next(error);
  }
};

const mapGenrePreference = (user) => {
  const stats = user?.stats?.genreStats || [];
  return stats.reduce((acc, item) => {
    if (!item?.genreId) {
      return acc;
    }

    const count = Number(item.count || 0);
    if (count <= 0) {
      return acc;
    }

    acc.set(Number(item.genreId), {
      genreId: Number(item.genreId),
      genreName: item.genreName || `Genre ${item.genreId}`,
      count
    });
    return acc;
  }, new Map());
};

const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(value)));

const getFriendCompatibility = async (req, res, next) => {
  try {
    const friendId = req.params.id;

    if (String(friendId) === String(req.user._id)) {
      return res.status(400).json({ message: "Cannot compare with yourself" });
    }

    const [currentUser, friend, currentReviews, friendReviews] = await Promise.all([
      User.findById(req.user._id).select("username watched stats friends"),
      User.findById(friendId).select("username watched stats friends avatar"),
      Review.find({ userId: req.user._id }).select("movieId rating").lean(),
      Review.find({ userId: friendId }).select("movieId rating").lean()
    ]);

    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    const areFriends = (currentUser.friends || []).some((id) => String(id) === String(friendId));
    if (!areFriends) {
      return res.status(403).json({ message: "Compatibility is only available with friends" });
    }

    const myWatched = new Set((currentUser.watched || []).map((id) => Number(id)));
    const friendWatched = new Set((friend.watched || []).map((id) => Number(id)));
    const commonMovies = [...myWatched].filter((movieId) => friendWatched.has(movieId));
    const watchedUnionSize = new Set([...myWatched, ...friendWatched]).size;

    const movieOverlapScore = watchedUnionSize
      ? clampPercent((commonMovies.length / watchedUnionSize) * 100)
      : 0;

    const myRatingsMap = new Map(currentReviews.map((review) => [Number(review.movieId), Number(review.rating)]));
    const friendRatingsMap = new Map(friendReviews.map((review) => [Number(review.movieId), Number(review.rating)]));

    const commonRated = [...myRatingsMap.keys()].filter((movieId) => friendRatingsMap.has(movieId));
    const ratingDiffAverage = commonRated.length
      ? commonRated.reduce((sum, movieId) => {
          return sum + Math.abs(myRatingsMap.get(movieId) - friendRatingsMap.get(movieId));
        }, 0) / commonRated.length
      : 2.5;
    const ratingScore = clampPercent((1 - ratingDiffAverage / 5) * 100);

    const myGenres = mapGenrePreference(currentUser);
    const friendGenres = mapGenrePreference(friend);
    const genreIds = new Set([...myGenres.keys(), ...friendGenres.keys()]);

    let genreIntersection = 0;
    let genreUnion = 0;

    for (const genreId of genreIds) {
      const mine = myGenres.get(genreId)?.count || 0;
      const theirs = friendGenres.get(genreId)?.count || 0;
      genreIntersection += Math.min(mine, theirs);
      genreUnion += Math.max(mine, theirs);
    }

    const genreScore = genreUnion ? clampPercent((genreIntersection / genreUnion) * 100) : 0;

    const overallScore = clampPercent(
      movieOverlapScore * 0.35 + genreScore * 0.35 + ratingScore * 0.3
    );

    const topGenreCandidates = [...genreIds]
      .map((genreId) => {
        const mine = myGenres.get(genreId);
        const theirs = friendGenres.get(genreId);
        return {
          genreId,
          genreName: mine?.genreName || theirs?.genreName || `Genre ${genreId}`,
          combinedScore: (mine?.count || 0) + (theirs?.count || 0)
        };
      })
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, 3);

    let idealMovie = null;
    if (topGenreCandidates.length) {
      try {
        const discover = await fetchTmdb("/discover/movie", {
          with_genres: topGenreCandidates.map((g) => g.genreId).join(","),
          sort_by: "vote_average.desc",
          "vote_count.gte": 250,
          page: 1,
          language: "fr-FR",
          include_adult: false
        });

        const firstUnwatched = (discover.results || []).find(
          (movie) => !myWatched.has(Number(movie.id)) && !friendWatched.has(Number(movie.id))
        );

        if (firstUnwatched) {
          idealMovie = {
            id: firstUnwatched.id,
            title: firstUnwatched.title,
            poster_path: firstUnwatched.poster_path,
            vote_average: firstUnwatched.vote_average,
            release_date: firstUnwatched.release_date
          };
        }
      } catch (tmdbError) {
        idealMovie = null;
      }
    }

    return res.json({
      friend: {
        _id: friend._id,
        username: friend.username,
        avatar: friend.avatar
      },
      score: overallScore,
      breakdown: {
        genres: genreScore,
        ratings: ratingScore,
        commonMovies: movieOverlapScore
      },
      common: {
        watchedCount: commonMovies.length,
        ratedCount: commonRated.length,
        sampleMovieIds: commonMovies.slice(0, 8)
      },
      idealNight: {
        topGenres: topGenreCandidates,
        movieSuggestion: idealMovie,
        vibeLabel:
          overallScore >= 80
            ? "Duet cinephile"
            : overallScore >= 60
              ? "Bon duo popcorn"
              : "Exploration de nouveaux genres"
      }
    });
  } catch (error) {
    return next(error);
  }
};

const sendFriendRequest = async (req, res, next) => {
  try {
    const targetId = req.params.id;

    if (String(targetId) === String(req.user._id)) {
      return res.status(400).json({ message: "Cannot add yourself" });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.user._id),
      User.findById(targetId)
    ]);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currentUser.friends.some((id) => String(id) === String(targetId))) {
      return res.status(400).json({ message: "Already friends" });
    }

    if (currentUser.friendRequestsSent.some((id) => String(id) === String(targetId))) {
      return res.status(400).json({ message: "Request already sent" });
    }

    const incomingRequestExists = currentUser.friendRequestsReceived.some(
      (id) => String(id) === String(targetId)
    );

    if (incomingRequestExists) {
      currentUser.friendRequestsReceived = currentUser.friendRequestsReceived.filter(
        (id) => String(id) !== String(targetId)
      );
      targetUser.friendRequestsSent = targetUser.friendRequestsSent.filter(
        (id) => String(id) !== String(req.user._id)
      );
      currentUser.friends.push(targetId);
      targetUser.friends.push(req.user._id);
      syncSocialCounts(currentUser);
      syncSocialCounts(targetUser);

      await Promise.all([currentUser.save(), targetUser.save()]);
      await createNotification({
        recipientId: targetUser._id,
        senderId: currentUser._id,
        type: "friend_accept",
        message: `${currentUser.username} a accepte votre demande d'ami`,
        targetId: currentUser._id
      });

      return res.json({ message: "Friend request accepted", relationshipStatus: "friend" });
    }

    currentUser.friendRequestsSent.push(targetUser._id);
    targetUser.friendRequestsReceived.push(currentUser._id);

    await Promise.all([currentUser.save(), targetUser.save()]);
    await createNotification({
      recipientId: targetUser._id,
      senderId: currentUser._id,
      type: "friend_request",
      message: `${currentUser.username} vous a envoye une demande d'ami`,
      targetId: currentUser._id
    });

    return res.status(201).json({ message: "Friend request sent", relationshipStatus: "outgoing" });
  } catch (error) {
    return next(error);
  }
};

const acceptFriendRequest = async (req, res, next) => {
  try {
    const requesterId = req.params.id;
    const [currentUser, requester] = await Promise.all([
      User.findById(req.user._id),
      User.findById(requesterId)
    ]);

    if (!requester) {
      return res.status(404).json({ message: "User not found" });
    }

    const hasRequest = currentUser.friendRequestsReceived.some(
      (id) => String(id) === String(requesterId)
    );

    if (!hasRequest) {
      return res.status(400).json({ message: "Friend request not found" });
    }

    currentUser.friendRequestsReceived = currentUser.friendRequestsReceived.filter(
      (id) => String(id) !== String(requesterId)
    );
    requester.friendRequestsSent = requester.friendRequestsSent.filter(
      (id) => String(id) !== String(req.user._id)
    );

    if (!currentUser.friends.some((id) => String(id) === String(requesterId))) {
      currentUser.friends.push(requester._id);
    }
    if (!requester.friends.some((id) => String(id) === String(req.user._id))) {
      requester.friends.push(currentUser._id);
    }

    syncSocialCounts(currentUser);
    syncSocialCounts(requester);

    await Promise.all([currentUser.save(), requester.save()]);
    await createNotification({
      recipientId: requester._id,
      senderId: currentUser._id,
      type: "friend_accept",
      message: `${currentUser.username} a accepte votre demande d'ami`,
      targetId: currentUser._id
    });

    return res.json({ message: "Friend request accepted", relationshipStatus: "friend" });
  } catch (error) {
    return next(error);
  }
};

const rejectFriendRequest = async (req, res, next) => {
  try {
    const requesterId = req.params.id;
    const [currentUser, requester] = await Promise.all([
      User.findById(req.user._id),
      User.findById(requesterId)
    ]);

    if (!requester) {
      return res.status(404).json({ message: "User not found" });
    }

    currentUser.friendRequestsReceived = currentUser.friendRequestsReceived.filter(
      (id) => String(id) !== String(requesterId)
    );
    requester.friendRequestsSent = requester.friendRequestsSent.filter(
      (id) => String(id) !== String(req.user._id)
    );

    await Promise.all([currentUser.save(), requester.save()]);

    return res.json({ message: "Friend request rejected", relationshipStatus: "none" });
  } catch (error) {
    return next(error);
  }
};

const cancelFriendRequest = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.user._id),
      User.findById(targetId)
    ]);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    currentUser.friendRequestsSent = currentUser.friendRequestsSent.filter(
      (id) => String(id) !== String(targetId)
    );
    targetUser.friendRequestsReceived = targetUser.friendRequestsReceived.filter(
      (id) => String(id) !== String(req.user._id)
    );

    await Promise.all([currentUser.save(), targetUser.save()]);

    return res.json({ message: "Friend request cancelled", relationshipStatus: "none" });
  } catch (error) {
    return next(error);
  }
};

const removeFriend = async (req, res, next) => {
  try {
    const friendId = req.params.id;
    const [currentUser, friendUser] = await Promise.all([
      User.findById(req.user._id),
      User.findById(friendId)
    ]);

    if (!friendUser) {
      return res.status(404).json({ message: "User not found" });
    }

    currentUser.friends = currentUser.friends.filter((id) => String(id) !== String(friendId));
    friendUser.friends = friendUser.friends.filter((id) => String(id) !== String(req.user._id));
    syncSocialCounts(currentUser);
    syncSocialCounts(friendUser);

    await Promise.all([currentUser.save(), friendUser.save()]);

    return res.json({ message: "Friend removed", relationshipStatus: "none" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
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
};
