<template>
  <article class="flex items-start gap-3 rounded-xl border border-white/10 bg-watchly-secondary/80 p-4">
    <UserAvatar :src="item.userId?.avatar" :alt="item.userId?.username || 'user'" />
    <div>
      <p class="text-sm text-watchly-text-primary">{{ item.message }}</p>
      <p class="text-xs text-watchly-text-secondary">{{ formatDate(item.createdAt) }}</p>
    </div>
  </article>
</template>

<script setup>
import UserAvatar from "./UserAvatar.vue";

defineProps({
  item: { type: Object, required: true }
});

const formatDate = (dateStr) => new Date(dateStr).toLocaleString();
</script>
