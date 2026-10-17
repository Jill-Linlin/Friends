<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { STYLES } from './router'

const route = useRoute()
/** 依目前風格替切換列換配色 */
const theme = computed(() => String(route.name ?? 'star'))
</script>

<template>
  <nav class="style-bar" :class="`theme-${theme}`" aria-label="切換風格">
    <RouterLink v-for="s in STYLES" :key="s.name" :to="s.path">{{ s.label }}</RouterLink>
  </nav>

  <!-- :key 讓每次切換都重新掛載，賀卡從頭開始 -->
  <RouterView :key="route.path" />
</template>

<style scoped>
.style-bar {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 12px);
  left: 12px;
  z-index: 40;
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: 999px;
  font-size: .8rem;
  line-height: 1.6;
}
.style-bar a {
  padding: .25rem .75rem;
  border-radius: 999px;
  text-decoration: none;
  color: var(--bar-fg);
}
.style-bar a.router-link-active {
  background: var(--bar-accent);
  color: var(--bar-accent-fg);
}

/* 星夜 */
.theme-star {
  --bar-fg: #aab1d8; --bar-accent: #e3c27c; --bar-accent-fg: #0a0d22;
  background: #151a3e; border: 1px solid #8f7a4c;
  font-family: "Cinzel", "Noto Serif TC", serif;
}
/* 時光機 */
.theme-timemachine {
  --bar-fg: #a39a86; --bar-accent: linear-gradient(#e2c26e, #a07c2c); --bar-accent-fg: #2a1f0a;
  background: #23272b; border: 1px solid #4a5056; border-radius: 6px;
  box-shadow: 0 4px 12px #0008;
  font-family: "Noto Serif TC", serif;
}
.theme-timemachine a { border-radius: 4px; }
</style>
