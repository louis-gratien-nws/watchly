<template>
  <section v-if="user" class="w-full space-y-6 px-4 pb-10 md:px-8 xl:px-10">
    <!-- Header du profil -->
    <div class="rounded-2xl border border-white/10 bg-watchly-secondary p-6 md:p-8">
      <div class="flex flex-col gap-6 md:flex-row md:items-start">
        <img :src="user.avatar" :alt="user.username" class="h-32 w-32 rounded-full border-2 border-watchly-accent object-cover" />
        <div class="flex-1">
          <h1 class="font-display text-3xl font-bold mb-2">{{ user.username }}</h1>
          <p class="text-watchly-text-secondary mb-4">{{ user.bio }}</p>
          <div class="flex flex-wrap gap-3 items-center">
            <div class="text-center">
              <p class="font-display text-2xl font-bold">{{ user.stats?.followersCount || 0 }}</p>
              <p class="text-xs text-watchly-text-secondary">Abonnés</p>
            </div>
            <div class="text-center">
              <p class="font-display text-2xl font-bold">{{ user.stats?.reviewsCount || 0 }}</p>
              <p class="text-xs text-watchly-text-secondary">Critiques</p>
            </div>
            <div class="text-center">
              <p class="font-display text-2xl font-bold">⭐ {{ user.level }}</p>
              <p class="text-xs text-watchly-text-secondary">Niveau</p>
            </div>
            <FollowButton v-if="auth.user?._id !== user._id" :userId="user._id" :isFollowingProp="isFollowing" />
            <template v-if="auth.user?._id !== user._id">
              <button
                v-if="friendStatus === 'none'"
                class="rounded-lg bg-watchly-accent px-4 py-2 font-semibold text-black hover:brightness-110"
                :disabled="friendActionLoading"
                @click="sendFriendRequest"
              >
                Ajouter en ami
              </button>
              <button
                v-else-if="friendStatus === 'outgoing'"
                class="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-semibold hover:bg-white/10"
                :disabled="friendActionLoading"
                @click="cancelFriendRequest"
              >
                Annuler la demande
              </button>
              <div v-else-if="friendStatus === 'incoming'" class="flex flex-wrap gap-2">
                <button
                  class="rounded-lg bg-emerald-500/20 px-4 py-2 font-semibold text-emerald-300 hover:bg-emerald-500/30"
                  :disabled="friendActionLoading"
                  @click="acceptFriendRequest"
                >
                  Accepter
                </button>
                <button
                  class="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 font-semibold text-red-300 hover:bg-red-500/20"
                  :disabled="friendActionLoading"
                  @click="rejectFriendRequest"
                >
                  Refuser
                </button>
              </div>
              <button
                v-else-if="friendStatus === 'friend'"
                class="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 font-semibold text-red-300 hover:bg-red-500/20"
                :disabled="friendActionLoading"
                @click="removeFriend"
              >
                Retirer des amis
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistiques -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-2xl border border-white/10 bg-watchly-secondary p-6">
        <p class="text-watchly-text-secondary text-sm">Films Vus</p>
        <p class="font-display text-4xl font-bold">{{ user.stats?.moviesWatched || 0 }}</p>
      </div>
      <div class="rounded-2xl border border-white/10 bg-watchly-secondary p-6">
        <p class="text-watchly-text-secondary text-sm">Temps Total</p>
        <p class="font-display text-2xl font-bold">{{ formatTime(user.stats?.totalWatchTime || 0) }}</p>
      </div>
      <div class="rounded-2xl border border-white/10 bg-watchly-secondary p-6">
        <p class="text-watchly-text-secondary text-sm">J'aimes Reçus</p>
        <p class="font-display text-4xl font-bold">{{ user.stats?.likesCount || 0 }}</p>
      </div>
      <div class="rounded-2xl border border-white/10 bg-watchly-secondary p-6">
        <p class="text-watchly-text-secondary text-sm">Expérience</p>
        <p class="font-display text-4xl font-bold">{{ user.xp || 0 }}</p>
      </div>
    </div>

    <!-- Récompenses -->
    <div v-if="user.achievements?.length" class="rounded-2xl border border-white/10 bg-watchly-secondary p-6">
      <h2 class="font-display text-xl font-bold mb-4">Récompenses 🏆</h2>
      <div class="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        <div v-for="achievement in user.achievements" :key="achievement" class="rounded-lg border border-watchly-accent/30 bg-watchly-accent/10 p-3 text-center">
          <p class="text-sm font-semibold">{{ achievement }}</p>
        </div>
      </div>
    </div>

    <!-- Genres favoris -->
    <div v-if="user.stats?.genreStats?.length" class="rounded-2xl border border-white/10 bg-watchly-secondary p-6">
      <h2 class="font-display text-xl font-bold mb-4">Genres Préférés</h2>
      <div class="space-y-3">
        <div v-for="genre in user.stats.genreStats.slice(0, 5)" :key="genre.genreId" class="flex items-center justify-between">
          <div class="flex-1">
            <p class="text-sm font-medium">{{ genre.genreName }}</p>
            <div class="mt-1 h-2 w-full rounded-full bg-black/30">
              <div
                class="h-full rounded-full bg-watchly-accent"
                :style="{ width: getGenrePercentage(genre.count) + '%' }"
              />
            </div>
          </div>
          <p class="ml-3 text-sm font-semibold">{{ genre.count }}</p>
        </div>
      </div>
    </div>

    <!-- Critiques récentes -->
    <div v-if="reviews?.length" class="rounded-2xl border border-white/10 bg-watchly-secondary p-6">
      <h2 class="font-display text-xl font-bold mb-4">Critiques Récentes</h2>
      <div class="space-y-3">
        <ReviewCard v-for="review in reviews.slice(0, 5)" :key="review._id" :review="review" />
      </div>
    </div>
  </section>

  <section v-else class="w-full px-4 pb-10 md:px-8 xl:px-10">
    <div class="rounded-2xl border border-white/10 bg-watchly-secondary p-12 text-center">
      <p class="text-watchly-text-secondary">Utilisateur introuvable</p>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { socialService } from "../services/socialService";
import api from "../services/api";
import FollowButton from "../components/FollowButton.vue";
import ReviewCard from "../components/ReviewCard.vue";

const route = useRoute();
const auth = useAuthStore();

const user = ref(null);
const reviews = ref([]);
const isFollowing = ref(false);
const friendActionLoading = ref(false);

const formatTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

const getGenrePercentage = (count) => {
  if (!user.value?.stats?.genreStats?.length) return 0;
  const maxCount = Math.max(...user.value.stats.genreStats.map(g => g.count));
  return (count / maxCount) * 100;
};

const currentProfileId = computed(() => String(route.params.id || ""));

const friendStatus = computed(() => {
  if (!auth.user || !currentProfileId.value) {
    return "none";
  }

  if (String(auth.user._id) === currentProfileId.value) {
    return "self";
  }

  if ((auth.user.friends || []).some((id) => String(id) === currentProfileId.value)) {
    return "friend";
  }

  if ((auth.user.friendRequestsSent || []).some((id) => String(id) === currentProfileId.value)) {
    return "outgoing";
  }

  if ((auth.user.friendRequestsReceived || []).some((id) => String(id) === currentProfileId.value)) {
    return "incoming";
  }

  return "none";
});

const loadProfile = async () => {
  const userId = route.params.id;
  if (!userId) return;

  const [userResponse, statsResponse] = await Promise.all([
    api.get(`/users/${userId}`),
    socialService.getUserStats(userId)
  ]);

  user.value = { ...userResponse.data, ...statsResponse.data };
  reviews.value = user.value.reviews || [];
  isFollowing.value = (auth.user?.following || []).some((id) => String(id) === String(userId));
};

const runFriendAction = async (request) => {
  if (!currentProfileId.value) {
    return;
  }

  friendActionLoading.value = true;
  try {
    await request();
    await Promise.all([auth.fetchMe(), loadProfile()]);
  } catch (error) {
    console.error("Error updating friendship:", error);
  } finally {
    friendActionLoading.value = false;
  }
};

const sendFriendRequest = () => runFriendAction(() => api.post(`/users/friends/request/${currentProfileId.value}`));
const cancelFriendRequest = () => runFriendAction(() => api.delete(`/users/friends/request/${currentProfileId.value}`));
const acceptFriendRequest = () => runFriendAction(() => api.post(`/users/friends/accept/${currentProfileId.value}`));
const rejectFriendRequest = () => runFriendAction(() => api.post(`/users/friends/reject/${currentProfileId.value}`));
const removeFriend = () => runFriendAction(() => api.delete(`/users/friends/${currentProfileId.value}`));

onMounted(async () => {
  try {
    await loadProfile();
  } catch (error) {
    console.error("Error loading profile:", error);
  }
});

watch(
  () => route.params.id,
  async () => {
    try {
      await loadProfile();
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  }
);
</script>
