<template>
  <div class="w-full">
    <input
      v-model="value"
      type="text"
      :placeholder="placeholder"
      class="w-full rounded-xl border border-white/10 bg-watchly-secondary/80 px-4 py-2 text-sm text-watchly-text-primary outline-none transition focus:border-watchly-accent"
    />
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: { type: String, default: "" },
  placeholder: { type: String, default: "Rechercher un film..." },
  debounceMs: { type: Number, default: 400 }
});

const emit = defineEmits(["update:modelValue"]);
const value = ref(props.modelValue);
let timeout = null;

watch(
  () => props.modelValue,
  (next) => {
    value.value = next;
  }
);

watch(value, (next) => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    emit("update:modelValue", next);
  }, props.debounceMs);
});
</script>
