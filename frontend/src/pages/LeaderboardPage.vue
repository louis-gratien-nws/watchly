<template>
  <section class="w-full space-y-6 px-4 pb-10 md:px-8 xl:px-10">
    <h1 class="font-display text-3xl font-extrabold">🏆 Classement</h1>

    <!-- Tabs pour filtrer -->
    <div class="flex gap-2 overflow-x-auto pb-2">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="activeTab = tab.value"
        :class="[
          'whitespace-nowrap rounded-lg px-4 py-2 font-semibold transition',
          activeTab === tab.value
            ? 'bg-watchly-accent text-black'
            : 'border border-white/10 bg-black/20 text-white hover:border-watchly-accent'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tableau des leaders -->
    <div class="rounded-2xl border border-white/10 bg-watchly-secondary overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/10 bg-black/30">
              <th class="px-4 py-3 text-left text-sm font-semibold">#</th>
              <th class="px-4 py-3 text-left text-sm font-semibold">Utilisateur</th>
              <th class="px-4 py-3 text-left text-sm font-semibold">Niveau</th>
              <th class="px-4 py-3 text-right text-sm font-semibold">{{ getTabLabel() }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(user, index) in leaderboard"
              :key="user._id"
              class="border-b border-white/10 hover:bg-black/20 transition"
            >
              <td class="px-4 py-3 text-center font-bold text-lg">
                <span v-if="index === 0">🥇</span>
                <span v-else-if="index === 1">🥈</span>
                <span v-else-if="index === 2">🥉</span>
                <span v-else>{{ index + 1 }}</span>
              </td>
              <td class="px-4 py-3">
                <router-link :to="`/profile/${user._id}`" class="flex items-center gap-3 hover:opacity-80 transition">
                  <img :src="user.avatar" :alt="user.username" class="h-10 w-10 rounded-full object-cover" />
                  <div>
                    <p class="font-semibold">{{ user.username }}</p>
                    <p class="text-xs text-watchly-text-secondary">{{ user.bio }}</p>
                  </div>
                </router-link>
              </td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center gap-1 rounded-lg border border-watchly-accent/30 bg-watchly-accent/10 px-2 py-1 text-sm font-semibold">
                  ⭐ {{ user.level }}
                </span>
              </td>
              <td class="px-4 py-3 text-right font-bold">{{ getStatValue(user) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Votre position si applicable -->
    <div v-if="auth.user" class="rounded-2xl border border-watchly-accent/50 bg-watchly-accent/10 p-6">
      <h2 class="font-display text-lg font-bold mb-2">Votre Position</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <p class="text-watchly-text-secondary text-sm">Rang dans le {{ activeTab }}</p>
          <p class="font-display text-3xl font-bold">{{ yourRank }}</p>
        </div>
        <div>
          <p class="text-watchly-text-secondary text-sm">{{ getTabLabel() }}</p>
          <p class="font-display text-3xl font-bold">{{ getYourStat() }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../stores/authStore";
import api from "../services/api";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const router = useRouter();
const activeTab = ref("followers");
const leaderboard = ref([]);
const yourRank = ref("-");

const tabs = [
  { label: "Abonnés", value: "followers" },
  { label: "Critiques", value: "reviews" },
  { label: "J'aimes reçus", value: "likes" },
  { label: "Expérience", value: "xp" }
];

const getTabLabel = () => {
  const tab = tabs.find(t => t.value === activeTab.value);
  return tab?.label || "";
};

const getStatValue = (user) => {
  switch (activeTab.value) {
    case "followers":
      return user.stats?.followersCount || 0;
    case "reviews":
      return user.stats?.reviewsCount || 0;
    case "likes":
      return user.stats?.likesCount || 0;
    case "xp":
      return user.xp || 0;
    default:
      return 0;
  }
};

const getYourStat = () => {
  if (!auth.user) return "N/A";
  switch (activeTab.value) {
    case "followers":
      return auth.user.stats?.followersCount || 0;
    case "reviews":
      return auth.user.stats?.reviewsCount || 0;
    case "likes":
      return auth.user.stats?.likesCount || 0;
    case "xp":
      return auth.user.xp || 0;
    default:
      return 0;
  }
};

const fetchLeaderboard = async () => {
  try {
    const { data } = await api.get("/social/leaderboard", {
      params: { type: activeTab.value, limit: 50 }
    });
    leaderboard.value = data;
    
    // Calculate your rank
    if (auth.user?._id) {
      const yourIndex = data.findIndex(u => u._id === auth.user._id);
      yourRank.value = yourIndex >= 0 ? yourIndex + 1 : "-";
    }
  } catch (error) {
    console.error("Error loading leaderboard:", error);
  }
};

onMounted(fetchLeaderboard);

// Watch active tab and refetch
import { watch } from "vue";
watch(activeTab, fetchLeaderboard);
</script>
