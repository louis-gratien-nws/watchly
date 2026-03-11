<template>
  <div v-if="isAuthenticated" class="fixed bottom-5 right-5 z-[70]">
    <Transition name="chat-panel">
      <section
        v-if="open"
        class="mb-3 h-[520px] w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-white/15 bg-[#0d1320]/95 shadow-2xl backdrop-blur-xl"
      >
        <header class="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p class="font-display text-lg font-bold">Messages</p>
            <p class="text-xs text-watchly-text-secondary">Discute avec tes amis</p>
          </div>
          <button class="rounded-lg border border-white/10 px-2 py-1 text-xs" @click="open = false">Fermer</button>
        </header>

        <div class="grid h-[calc(100%-62px)] grid-cols-[140px_1fr]">
          <aside class="border-r border-white/10 bg-black/20 p-2">
            <button
              class="mb-2 w-full rounded-lg px-2 py-2 text-xs"
              :class="activeTab === 'chats' ? 'bg-watchly-accent text-black font-semibold' : 'bg-white/5 text-watchly-text-secondary'"
              @click="activeTab = 'chats'"
            >
              Chats
            </button>
            <button
              class="mb-3 w-full rounded-lg px-2 py-2 text-xs"
              :class="activeTab === 'friends' ? 'bg-watchly-accent text-black font-semibold' : 'bg-white/5 text-watchly-text-secondary'"
              @click="activeTab = 'friends'"
            >
              Amis
            </button>

            <div v-if="activeTab === 'chats'" class="space-y-2 overflow-y-auto pr-1">
              <TransitionGroup name="chat-list" tag="div" class="space-y-2">
                <button
                  v-for="conversation in conversations"
                  :key="conversation._id"
                  class="w-full rounded-xl border px-2 py-2 text-left"
                  :class="selectedConversationId === conversation._id ? 'border-watchly-accent bg-watchly-accent/15' : 'border-white/10 bg-white/5'"
                  @click="selectConversation(conversation)"
                >
                  <div class="flex items-start gap-2">
                    <img
                      :src="conversation.friend?.avatar || fallbackAvatar"
                      :alt="conversation.friend?.username || 'Ami'"
                      class="h-8 w-8 rounded-full object-cover"
                    />
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-xs font-semibold">{{ conversation.friend?.username || 'Ami' }}</p>
                      <p class="mt-1 line-clamp-2 text-[10px] text-watchly-text-secondary">{{ conversation.lastMessage?.text || 'Nouveau chat' }}</p>
                    </div>
                  </div>
                  <span
                    v-if="conversation.unreadCount"
                    class="mt-1 inline-flex rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white"
                  >
                    {{ conversation.unreadCount > 9 ? '9+' : conversation.unreadCount }}
                  </span>
                </button>
              </TransitionGroup>

              <p v-if="!conversations.length" class="px-1 text-[11px] text-watchly-text-secondary">Aucun chat pour le moment.</p>
            </div>

            <div v-else class="space-y-2 overflow-y-auto pr-1">
              <button
                v-for="friend in friends"
                :key="friend._id"
                class="w-full rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-left hover:border-watchly-accent/60"
                @click="startChatWithFriend(friend)"
              >
                <p class="truncate text-xs font-semibold">{{ friend.username }}</p>
                <p class="truncate text-[10px] text-watchly-text-secondary">Demarrer chat</p>
              </button>

              <p v-if="!friends.length" class="px-1 text-[11px] text-watchly-text-secondary">Ajoute des amis pour discuter.</p>
            </div>
          </aside>

          <div class="flex min-h-0 flex-col">
            <div class="border-b border-white/10 px-3 py-2">
              <p class="truncate text-sm font-semibold">{{ activeFriendName }}</p>
            </div>

            <div ref="messagesContainer" class="flex-1 space-y-2 overflow-y-auto px-3 py-3">
              <div v-if="!selectedConversationId" class="text-xs text-watchly-text-secondary">
                Selectionne un chat ou un ami pour commencer.
              </div>

              <TransitionGroup name="message-bubble" tag="div" class="space-y-2">
                <div
                  v-for="message in messages"
                  :key="message._id"
                  class="flex items-end gap-2"
                  :class="isMine(message) ? 'justify-end' : 'justify-start'"
                >
                  <img
                    v-if="!isMine(message)"
                    :src="messageAvatar(message)"
                    :alt="message.senderId?.username || 'Ami'"
                    class="h-7 w-7 rounded-full object-cover"
                  />

                  <article
                    class="max-w-[78%] rounded-2xl px-3 py-2 text-xs"
                    :class="isMine(message) ? 'bg-watchly-accent text-black' : 'bg-white/10 text-white'"
                  >
                    <p v-if="!isMine(message)" class="mb-1 text-[10px] text-watchly-text-secondary">{{ message.senderId?.username || 'Ami' }}</p>
                    <p class="whitespace-pre-wrap break-words">{{ message.text }}</p>
                    <p
                      class="mt-1 text-[10px]"
                      :class="isMine(message) ? 'text-black/70' : 'text-watchly-text-secondary'"
                    >
                      {{ formatTime(message.createdAt) }}
                      <span v-if="isMine(message) && message._id === lastMineMessageId">
                        • {{ hasBeenReadByFriend(message) ? 'Lu' : 'Distribue' }}
                      </span>
                    </p>
                  </article>

                  <img
                    v-if="isMine(message)"
                    :src="messageAvatar(message)"
                    alt="Vous"
                    class="h-7 w-7 rounded-full object-cover"
                  />
                </div>
              </TransitionGroup>
            </div>

            <form class="border-t border-white/10 p-2" @submit.prevent="handleSend">
              <div class="flex gap-2">
                <input
                  v-model.trim="draft"
                  :disabled="!selectedConversationId || sending"
                  type="text"
                  placeholder="Ecris un message"
                  class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs outline-none"
                />
                <button
                  type="submit"
                  :disabled="!selectedConversationId || !draft || sending"
                  class="rounded-xl bg-watchly-accent px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
                >
                  Envoyer
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </Transition>

    <button
      class="chat-fab relative h-14 w-14 rounded-full bg-watchly-accent text-black shadow-[0_18px_40px_rgba(0,168,255,0.4)] transition hover:scale-105"
      aria-label="Ouvrir la messagerie"
      @click="toggleOpen"
    >
      <span class="text-xl font-black">✉</span>
      <span
        v-if="globalUnreadCount > 0"
        class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
      >
        {{ globalUnreadCount > 9 ? '9+' : globalUnreadCount }}
      </span>
    </button>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { useAuthStore } from "../stores/authStore";
import { useUserStore } from "../stores/userStore";
import { chatService } from "../services/chatService";

const auth = useAuthStore();
const userStore = useUserStore();

const open = ref(false);
const activeTab = ref("chats");
const conversations = ref([]);
const selectedConversationId = ref("");
const messages = ref([]);
const draft = ref("");
const sending = ref(false);
const messagesContainer = ref(null);
const fallbackAvatar = "https://placehold.co/80x80/0f172a/f8fafc?text=U";

let conversationsInterval = null;
let messagesInterval = null;

const isAuthenticated = computed(() => auth.isAuthenticated && Boolean(auth.user));
const friends = computed(() => userStore.friends || []);
const globalUnreadCount = computed(() =>
  conversations.value.reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0)
);

const activeConversation = computed(() =>
  conversations.value.find((conversation) => conversation._id === selectedConversationId.value) || null
);

const activeFriendId = computed(() => activeConversation.value?.friend?._id || "");

const lastMineMessageId = computed(() => {
  for (let i = messages.value.length - 1; i >= 0; i -= 1) {
    if (isMine(messages.value[i])) {
      return messages.value[i]._id;
    }
  }
  return "";
});

const activeFriendName = computed(() => activeConversation.value?.friend?.username || "Messagerie");

const isMine = (message) => String(message.senderId?._id || message.senderId) === String(auth.user?._id);

const messageAvatar = (message) => {
  if (isMine(message)) {
    return auth.user?.avatar || fallbackAvatar;
  }
  return message.senderId?.avatar || activeConversation.value?.friend?.avatar || fallbackAvatar;
};

const formatTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const hasBeenReadByFriend = (message) => {
  if (!isMine(message) || !activeFriendId.value) {
    return false;
  }

  const readBy = Array.isArray(message.readBy) ? message.readBy : [];
  return readBy.some((id) => String(id?._id || id) === String(activeFriendId.value));
};

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const fetchConversations = async () => {
  if (!isAuthenticated.value) {
    return;
  }

  const { data } = await chatService.listConversations();
  conversations.value = Array.isArray(data) ? data : [];

  if (!selectedConversationId.value && conversations.value.length) {
    selectedConversationId.value = conversations.value[0]._id;
    await fetchMessages();
  }
};

const fetchMessages = async () => {
  if (!selectedConversationId.value) {
    messages.value = [];
    return;
  }

  const { data } = await chatService.listMessages(selectedConversationId.value, 80);
  messages.value = Array.isArray(data) ? data : [];
  await chatService.markRead(selectedConversationId.value);
  await fetchConversations();
  await scrollToBottom();
};

const selectConversation = async (conversation) => {
  selectedConversationId.value = conversation._id;
  await fetchMessages();
};

const startChatWithFriend = async (friend) => {
  const { data } = await chatService.getOrCreateConversation(friend._id);
  selectedConversationId.value = data.conversation._id;
  activeTab.value = "chats";
  await Promise.all([fetchConversations(), fetchMessages()]);
};

const handleSend = async () => {
  if (!selectedConversationId.value || !draft.value || sending.value) {
    return;
  }

  sending.value = true;
  try {
    const text = draft.value;
    draft.value = "";
    const { data } = await chatService.sendMessage(selectedConversationId.value, text);
    messages.value.push(data);
    await scrollToBottom();
    await fetchConversations();
  } finally {
    sending.value = false;
  }
};

const toggleOpen = async () => {
  open.value = !open.value;
  if (open.value) {
    await Promise.all([userStore.fetchFriendsOverview(), fetchConversations()]);
    if (selectedConversationId.value) {
      await fetchMessages();
    }
  }
};

const openChatWithFriendEvent = async (event) => {
  const friendId = event?.detail?.friendId;
  if (!friendId || !isAuthenticated.value) {
    return;
  }

  open.value = true;
  await userStore.fetchFriendsOverview();
  const friend = friends.value.find((item) => String(item._id) === String(friendId));
  if (friend) {
    await startChatWithFriend(friend);
  } else {
    const { data } = await chatService.getOrCreateConversation(friendId);
    selectedConversationId.value = data.conversation._id;
    await Promise.all([fetchConversations(), fetchMessages()]);
  }
};

onMounted(async () => {
  if (!isAuthenticated.value) {
    return;
  }

  await fetchConversations();
  conversationsInterval = setInterval(fetchConversations, 8000);
  messagesInterval = setInterval(() => {
    if (open.value && selectedConversationId.value) {
      fetchMessages();
    }
  }, 5000);

  window.addEventListener("open-watchly-chat", openChatWithFriendEvent);
});

onUnmounted(() => {
  if (conversationsInterval) {
    clearInterval(conversationsInterval);
  }
  if (messagesInterval) {
    clearInterval(messagesInterval);
  }
  window.removeEventListener("open-watchly-chat", openChatWithFriendEvent);
});
</script>

<style scoped>
.chat-panel-enter-active,
.chat-panel-leave-active {
  transition: opacity 280ms cubic-bezier(0.22, 1, 0.36, 1), transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
}

.chat-panel-enter-from,
.chat-panel-leave-to {
  opacity: 0;
  transform: translateY(18px) scale(0.94);
}

.message-bubble-enter-active,
.message-bubble-leave-active {
  transition: all 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.message-bubble-enter-from,
.message-bubble-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.chat-list-enter-active,
.chat-list-leave-active {
  transition: all 180ms ease;
}

.chat-list-enter-from,
.chat-list-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}

.chat-fab {
  animation: breathe 2.8s ease-in-out infinite;
}

@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 18px 40px rgba(0, 168, 255, 0.4);
  }
  50% {
    transform: scale(1.03);
    box-shadow: 0 22px 48px rgba(0, 168, 255, 0.52);
  }
}
</style>
