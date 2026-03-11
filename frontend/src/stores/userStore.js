import { defineStore } from "pinia";
import api from "../services/api";
import { useAuthStore } from "./authStore";

export const useUserStore = defineStore("user", {
  state: () => ({
    watchlist: [],
    myReviews: [],
    feed: [],
    friends: [],
    receivedRequests: [],
    sentRequests: [],
    userSearchResults: [],
    loading: false
  }),
  actions: {
    async fetchWatchlist(userId) {
      const { data } = await api.get(`/users/${userId}/watchlist`);
      this.watchlist = data.watchlist || [];
    },
    async addToWatchlist(movieId) {
      const { data } = await api.post("/users/watchlist", { movieId });
      this.watchlist = data.watchlist;
    },
    async removeFromWatchlist(movieId) {
      const { data } = await api.delete(`/users/watchlist/${movieId}`);
      this.watchlist = data.watchlist;
    },
    async markWatched(movieId) {
      await api.post("/users/watched", { movieId });
    },
    async fetchActivityFeed() {
      const { data } = await api.get("/users/feed/activity");
      this.feed = data;
    },
    async fetchMyReviews() {
      const { data } = await api.get("/reviews/me");
      this.myReviews = data || [];
    },
    async fetchFriendsOverview() {
      const { data } = await api.get("/users/friends/overview");
      this.friends = data.friends || [];
      this.receivedRequests = data.received || [];
      this.sentRequests = data.sent || [];
    },
    async searchUsers(query) {
      if (!query.trim()) {
        this.userSearchResults = [];
        return;
      }

      const { data } = await api.get("/users/search", {
        params: { q: query }
      });
      this.userSearchResults = data || [];
    },
    async sendFriendRequest(userId) {
      await api.post(`/users/friends/request/${userId}`);
      await Promise.all([this.fetchFriendsOverview(), useAuthStore().fetchMe()]);
    },
    async acceptFriendRequest(userId) {
      await api.post(`/users/friends/accept/${userId}`);
      await Promise.all([this.fetchFriendsOverview(), useAuthStore().fetchMe()]);
    },
    async rejectFriendRequest(userId) {
      await api.post(`/users/friends/reject/${userId}`);
      await this.fetchFriendsOverview();
    },
    async cancelFriendRequest(userId) {
      await api.delete(`/users/friends/request/${userId}`);
      await this.fetchFriendsOverview();
    },
    async removeFriend(userId) {
      await api.delete(`/users/friends/${userId}`);
      await Promise.all([this.fetchFriendsOverview(), useAuthStore().fetchMe()]);
    }
  }
});
