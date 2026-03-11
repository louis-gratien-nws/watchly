<template>
  <button
    @click="toggleFollow"
    :disabled="loading"
    :class="[
      'rounded-lg px-4 py-2 font-semibold transition',
      isFollowing
        ? 'border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
        : 'bg-watchly-accent text-black hover:brightness-110'
    ]"
  >
    {{ loading ? '...' : (isFollowing ? 'Se désabonner' : 'Suivre') }}
  </button>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "../stores/authStore";
import { socialService } from "../services/socialService";

const props = defineProps({
  userId: { type: String, required: true },
  isFollowingProp: { type: Boolean, default: false }
});

const emit = defineEmits(["followStatusChanged"]);

const auth = useAuthStore();
const loading = ref(false);
const isFollowing = ref(props.isFollowingProp);

const toggleFollow = async () => {
  if (!auth.user || auth.user._id === props.userId) {
    alert("Vous ne pouvez pas vous suivre vous-même");
    return;
  }

  loading.value = true;
  try {
    if (isFollowing.value) {
      await socialService.unfollowUser(props.userId);
    } else {
      await socialService.followUser(props.userId);
    }
    isFollowing.value = !isFollowing.value;
    emit("followStatusChanged", isFollowing.value);
  } catch (error) {
    console.error("Error toggling follow:", error);
  } finally {
    loading.value = false;
  }
};
</script>
