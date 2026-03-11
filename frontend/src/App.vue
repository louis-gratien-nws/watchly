<template>
  <div class="min-h-screen bg-watchly-bg text-watchly-text-primary transition-colors duration-300">
    <Navbar v-if="!route.meta.hideNavbar" />
    <main :class="route.meta.hideNavbar ? 'pt-4 md:pt-6' : 'pt-20 md:pt-24'">
      <RouterView v-slot="{ Component, route }">
        <Transition name="page-fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </RouterView>
    </main>
    <ChatBubble v-if="auth.isAuthenticated && !route.meta.hideNavbar" />
  </div>
</template>

<script setup>
import { RouterView, useRoute } from "vue-router";
import Navbar from "./components/Navbar.vue";
import ChatBubble from "./components/ChatBubble.vue";
import { onMounted } from "vue";
import { useAuthStore } from "./stores/authStore";

const route = useRoute();
const auth = useAuthStore();

onMounted(() => {
  // Ensure theme is set on mount
  const theme = localStorage.getItem("watchly_theme") || "dark";
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(theme);
});
</script>
