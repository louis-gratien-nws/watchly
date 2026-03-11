<template>
  <div class="relative">
    <button
      ref="bellButtonRef"
      class="relative rounded-full border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition"
      aria-label="Notifications"
      @click="toggleOpen"
    >
      <span class="text-lg">🔔</span>
      <span v-if="unreadCount > 0" class="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
        {{ Math.min(unreadCount, 9) }}{{ unreadCount > 9 ? '+' : '' }}
      </span>
    </button>

    <Transition name="dropdown-pop">
      <div
        v-if="open"
        ref="dropdownRef"
        class="absolute right-0 top-12 z-50 w-80 max-h-[400px] overflow-y-auto rounded-2xl border border-white/10 bg-watchly-secondary shadow-2xl"
      >
        <div v-if="notifications.length === 0" class="p-6 text-center text-watchly-text-secondary">
          <p>Pas de notifications</p>
        </div>

        <div v-else class="divide-y divide-white/10">
          <div
            v-for="notif in notifications"
            :key="notif._id"
            class="flex items-start gap-3 border-b border-white/10 p-3 hover:bg-black/20 transition cursor-pointer"
            :class="{ 'bg-watchly-accent/10': !notif.read }"
            @click="handleNotificationClick(notif)"
          >
            <img
              :src="notif.senderId?.avatar"
              :alt="notif.senderId?.username"
              class="h-10 w-10 rounded-full object-cover flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm">{{ notif.senderId?.username }}</p>
              <p class="text-xs text-watchly-text-secondary line-clamp-2">{{ notif.message }}</p>
              <p class="text-xs text-watchly-text-secondary mt-1">{{ formatTime(notif.createdAt) }}</p>
            </div>
            <button
              @click.stop="deleteNotification(notif._id)"
              class="text-xs text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>

        <div v-if="notifications.length > 0" class="border-t border-white/10 p-2">
          <button
            @click="markAllAsRead"
            class="w-full rounded-lg bg-watchly-accent/20 px-3 py-2 text-xs font-semibold text-watchly-accent hover:bg-watchly-accent/30"
          >
            Marquer tout comme lu
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "../stores/authStore";
import { socialService } from "../services/socialService";

const auth = useAuthStore();
const open = ref(false);
const notifications = ref([]);
const bellButtonRef = ref(null);
const dropdownRef = ref(null);
let pollInterval = null;

const unreadCount = computed(() =>
  notifications.value.filter(n => !n.read).length
);

const formatTime = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "à l'instant";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

const loadNotifications = async () => {
  try {
    const { data } = await socialService.getNotifications();
    notifications.value = data;
  } catch (error) {
    console.error("Error loading notifications:", error);
  }
};

const toggleOpen = () => {
  open.value = !open.value;
  if (open.value) {
    loadNotifications();
  }
};

const handleNotificationClick = (notif) => {
  if (!notif.read) {
    markAsRead([notif._id]);
  }
  // Could add navigation logic here based on notification type
};

const markAsRead = async (ids) => {
  try {
    await socialService.markNotificationsAsRead(ids);
    notifications.value = notifications.value.map(n =>
      ids.includes(n._id) ? { ...n, read: true } : n
    );
  } catch (error) {
    console.error("Error marking as read:", error);
  }
};

const markAllAsRead = async () => {
  const unreadIds = notifications.value
    .filter(n => !n.read)
    .map(n => n._id);

  if (unreadIds.length > 0) {
    await markAsRead(unreadIds);
  }
};

const deleteNotification = async (id) => {
  try {
    await socialService.deleteNotification(id);
    notifications.value = notifications.value.filter(n => n._id !== id);
  } catch (error) {
    console.error("Error deleting notification:", error);
  }
};

const handleClickOutside = (event) => {
  if (
    open.value &&
    !bellButtonRef.value?.contains(event.target) &&
    !dropdownRef.value?.contains(event.target)
  ) {
    open.value = false;
  }
};

onMounted(() => {
  if (auth.user) {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    pollInterval = setInterval(loadNotifications, 30000);
  }
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.dropdown-pop-enter-active,
.dropdown-pop-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
  transform-origin: top right;
}

.dropdown-pop-enter-from,
.dropdown-pop-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
