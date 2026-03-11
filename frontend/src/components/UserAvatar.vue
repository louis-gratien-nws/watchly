<template>
  <img
    :src="src || fallback"
    :alt="alt"
    class="h-10 w-10 rounded-full border border-white/20 object-cover"
  />
</template>

<script setup>
const props = defineProps({
  src: { type: String, default: "" },
  alt: { type: String, default: "Avatar utilisateur" }
});

const fallback =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200";
</script>
