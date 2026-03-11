<template>
  <article class="space-y-3 rounded-2xl border border-white/10 bg-watchly-secondary p-4">
    <header class="flex items-center gap-3">
      <UserAvatar :src="review.userId?.avatar" :alt="review.userId?.username || 'utilisateur'" />
      <div>
        <p class="font-semibold">{{ review.userId?.username || "Anonyme" }}</p>
        <p class="text-xs text-watchly-text-secondary">{{ review.rating }}/5</p>
      </div>
    </header>

    <div v-if="review.movieId" class="text-xs text-watchly-text-secondary">
      Film #{{ review.movieId }}
    </div>

    <div class="flex flex-wrap gap-2 text-[11px] text-watchly-text-secondary">
      <span class="rounded-full border border-white/10 px-2 py-1">Scenario {{ review.detailedRatings?.scenario || review.rating }}/5</span>
      <span class="rounded-full border border-white/10 px-2 py-1">Acting {{ review.detailedRatings?.acting || review.rating }}/5</span>
      <span class="rounded-full border border-white/10 px-2 py-1">Visuel {{ review.detailedRatings?.visuals || review.rating }}/5</span>
      <span class="rounded-full border border-white/10 px-2 py-1">Rythme {{ review.detailedRatings?.rhythm || review.rating }}/5</span>
    </div>

    <div v-if="review.spoiler" class="space-y-2">
      <button class="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-200" @click="showSpoiler = !showSpoiler">
        {{ showSpoiler ? "Masquer spoiler" : "Afficher spoiler" }}
      </button>
      <p v-if="showSpoiler" class="text-sm text-watchly-text-secondary">{{ review.reviewText }}</p>
    </div>
    <p v-else class="text-sm text-watchly-text-secondary">{{ review.reviewText }}</p>

    <div v-if="review.replies?.length" class="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
      <p class="text-xs uppercase tracking-[0.15em] text-watchly-text-secondary">Reponses</p>
      <div v-for="reply in sortedReplies" :key="reply._id" class="rounded-lg border border-white/10 bg-black/30 p-2">
        <p class="text-xs font-semibold">{{ reply.userId?.username || "Utilisateur" }}</p>
        <p class="text-sm text-watchly-text-secondary">{{ reply.reviewText }}</p>
      </div>
    </div>

    <div class="flex gap-2 text-xs">
      <button
        @click="toggleLike"
        :disabled="liking"
        :class="[
          'rounded-lg px-3 py-1 font-semibold transition',
          isLiked
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : 'bg-white/10 hover:bg-white/20'
        ]"
      >
        {{ isLiked ? '❤️' : '🤍' }} ({{ likesCount }})
      </button>
      <button class="rounded-lg bg-white/10 px-3 py-1 hover:bg-white/20" @click="$emit('reply', review)">
        Repondre
      </button>
    </div>
  </article>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import UserAvatar from "./UserAvatar.vue";
import { useAuthStore } from "../stores/authStore";
import { likesService } from "../services/socialService";

const props = defineProps({
  review: { type: Object, required: true }
});

const emit = defineEmits(["like", "reply"]);

const auth = useAuthStore();
const showSpoiler = ref(false);
const isLiked = ref(false);
const likesCount = ref(props.review.likes?.length || 0);
const liking = ref(false);

const sortedReplies = computed(() => {
  const replies = Array.isArray(props.review?.replies) ? [...props.review.replies] : [];

  return replies.sort((a, b) => {
    const timeA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    return String(a?._id || "").localeCompare(String(b?._id || ""));
  });
});

const toggleLike = async () => {
  if (!auth.user) {
    alert("Vous devez être connecté pour liker");
    return;
  }

  liking.value = true;
  try {
    if (isLiked.value) {
      await likesService.unlikeReview(props.review._id);
      isLiked.value = false;
      likesCount.value = Math.max(0, likesCount.value - 1);
    } else {
      await likesService.likeReview(props.review._id);
      isLiked.value = true;
      likesCount.value += 1;
    }
    emit("like", props.review);
  } catch (error) {
    console.error("Error toggling like:", error);
  } finally {
    liking.value = false;
  }
};

onMounted(async () => {
  if (auth.user) {
    try {
      const { data } = await likesService.isLiked(props.review._id, "Review");
      isLiked.value = data.liked;
    } catch (error) {
      console.error("Error checking like status:", error);
    }
  }
});
</script>

