import api from "./api";

export const chatService = {
  listConversations() {
    return api.get("/chats");
  },

  getOrCreateConversation(friendId) {
    return api.post(`/chats/friend/${friendId}`);
  },

  listMessages(conversationId, limit = 60) {
    return api.get(`/chats/${conversationId}/messages`, { params: { limit } });
  },

  sendMessage(conversationId, text) {
    return api.post(`/chats/${conversationId}/messages`, { text });
  },

  markRead(conversationId) {
    return api.post(`/chats/${conversationId}/read`);
  }
};
