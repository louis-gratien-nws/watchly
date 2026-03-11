import { defineStore } from "pinia";
import api from "../services/api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    token: localStorage.getItem("watchly_token") || "",
    loading: false
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token)
  },
  actions: {
    async register(payload) {
      this.loading = true;
      try {
        const { data } = await api.post("/auth/register", payload);
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem("watchly_token", data.token);
      } finally {
        this.loading = false;
      }
    },
    async login(payload) {
      this.loading = true;
      try {
        const { data } = await api.post("/auth/login", payload);
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem("watchly_token", data.token);
      } finally {
        this.loading = false;
      }
    },
    async fetchMe() {
      if (!this.token) {
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        this.user = data.user;
      } catch {
        this.logout();
      }
    },
    logout() {
      this.user = null;
      this.token = "";
      localStorage.removeItem("watchly_token");
    }
  }
});
