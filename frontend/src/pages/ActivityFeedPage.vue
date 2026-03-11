<template>
  <section class="w-full space-y-6 px-4 pb-10 md:px-8 xl:px-10">
    <h1 class="font-display text-3xl font-extrabold">Fil d'activite</h1>
    <div class="space-y-3">
      <ActivityItem v-for="item in userStore.feed" :key="item._id" :item="item" />
    </div>
  </section>
</template>

<script setup>
import { onMounted } from "vue";
import ActivityItem from "../components/ActivityItem.vue";
import { useUserStore } from "../stores/userStore";

const userStore = useUserStore();

onMounted(() => {
  userStore.fetchActivityFeed();
});
</script>
