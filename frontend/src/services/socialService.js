import api from "./api";

export const socialService = {
  getUserStats(userId) {
    return api.get(`/social/stats/${userId}`);
  },

  followUser(targetUserId) {
    return api.post("/social/follow", { targetUserId });
  },

  unfollowUser(targetUserId) {
    return api.post("/social/unfollow", { targetUserId });
  },

  getFollowers(userId) {
    return api.get(`/social/followers/${userId}`);
  },

  getFollowing(userId) {
    return api.get(`/social/following/${userId}`);
  },

  getLeaderboard(type = "followers", limit = 20) {
    return api.get("/social/leaderboard", { params: { type, limit } });
  },

  getFriendCompatibility(friendId) {
    return api.get(`/users/friends/compatibility/${friendId}`);
  },

  getNotifications() {
    return api.get("/social/notifications");
  },

  markNotificationsAsRead(notificationIds) {
    return api.post("/social/notifications/read", { notificationIds });
  },

  deleteNotification(notificationId) {
    return api.delete(`/social/notifications/${notificationId}`);
  }
};

export const likesService = {
  likeReview(reviewId) {
    return api.post("/likes/review", { reviewId });
  },

  unlikeReview(reviewId) {
    return api.post("/likes/review/unlike", { reviewId });
  },

  likeList(listId) {
    return api.post("/likes/list", { listId });
  },

  unlikeList(listId) {
    return api.post("/likes/list/unlike", { listId });
  },

  getLikesCount(targetId, targetType) {
    return api.get("/likes/count", { params: { targetId, targetType } });
  },

  isLiked(targetId, targetType) {
    return api.get("/likes/check", { params: { targetId, targetType } });
  }
};
