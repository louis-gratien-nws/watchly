import api from "./api";

export const clubService = {
  getMyClubs() {
    return api.get("/clubs");
  },

  getGlobalUnreadCount() {
    return api.get("/clubs/unread-count");
  },

  createClub(payload) {
    return api.post("/clubs", payload);
  },

  joinClub(inviteCode) {
    return api.post("/clubs/join", { inviteCode });
  },

  getClubDetails(clubId) {
    return api.get(`/clubs/${clubId}`);
  },

  createPost(clubId, content) {
    return api.post(`/clubs/${clubId}/posts`, { content });
  },

  togglePostLike(clubId, postId) {
    return api.post(`/clubs/${clubId}/posts/${postId}/toggle-like`);
  },

  createPoll(clubId, payload) {
    return api.post(`/clubs/${clubId}/polls`, payload);
  },

  votePoll(clubId, pollId, optionIndex) {
    return api.post(`/clubs/${clubId}/polls/${pollId}/vote`, { optionIndex });
  },

  updateMemberRole(clubId, memberId, role) {
    return api.patch(`/clubs/${clubId}/members/${memberId}/role`, { role });
  },

  removeMember(clubId, memberId) {
    return api.delete(`/clubs/${clubId}/members/${memberId}`);
  },

  transferOwnership(clubId, targetMemberId, previousOwnerRole = "admin") {
    return api.post(`/clubs/${clubId}/transfer-ownership`, { targetMemberId, previousOwnerRole });
  },

  getRanking(clubId) {
    return api.get(`/clubs/${clubId}/ranking`);
  },

  getStats(clubId, days = 7) {
    return api.get(`/clubs/${clubId}/stats`, { params: { days } });
  },

  getNotifications(clubId, params = {}) {
    return api.get(`/clubs/${clubId}/notifications`, { params });
  },

  getUnreadCount(clubId) {
    return api.get(`/clubs/${clubId}/notifications/unread-count`);
  },

  markNotificationsAsRead(clubId) {
    return api.post(`/clubs/${clubId}/notifications/read`);
  },

  getAuditLogs(clubId, limit = 40) {
    return api.get(`/clubs/${clubId}/audit`, { params: { limit } });
  },

  regenerateInvite(clubId) {
    return api.post(`/clubs/${clubId}/regenerate-invite`);
  },

  leaveClub(clubId) {
    return api.post(`/clubs/${clubId}/leave`);
  },

  async openEventStream(onEvent, onError) {
    const token = localStorage.getItem("watchly_token");
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, "");

    if (!token) {
      return () => {};
    }

    const controller = new AbortController();
    let buffer = "";

    const parseChunk = (chunk) => {
      buffer += chunk;
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      parts.forEach((part) => {
        const lines = part.split("\n");
        let eventName = "message";
        let dataLine = "";

        lines.forEach((line) => {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          }
          if (line.startsWith("data:")) {
            dataLine += line.slice(5).trim();
          }
        });

        if (!dataLine) return;

        try {
          const payload = JSON.parse(dataLine);
          onEvent?.(eventName, payload);
        } catch {
          // Ignore malformed event payloads.
        }
      });
    };

    fetch(`${baseUrl}/clubs/stream`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok || !response.body) {
          throw new Error("stream_unavailable");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          parseChunk(decoder.decode(value, { stream: true }));
        }
      })
      .catch((error) => {
        if (error?.name !== "AbortError") {
          onError?.(error);
        }
      });

    return () => controller.abort();
  }
};
