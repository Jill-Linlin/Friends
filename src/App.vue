<script setup lang="ts">
import { ref } from 'vue'
import LandingScene from './components/toystory/LandingScene.vue'
import ToyStoryAdventure from './components/ToyStoryAdventure.vue'

/** landing = 開場選擇頁、adventure = 冒險地圖 */
const view = ref<'landing' | 'adventure'>('landing')

/** a few soft gold sparkles (positions in %, size in px) */
const SPARKLES = [
  { x: 12, y: 16, s: 10, d: 0 },
  { x: 86, y: 12, s: 8, d: 1.1 },
  { x: 78, y: 46, s: 12, d: 2.2 },
  { x: 8, y: 62, s: 9, d: .6 },
  { x: 90, y: 82, s: 10, d: 1.7 },
  { x: 30, y: 90, s: 7, d: 2.8 },
]
</script>

<template>
  <div class="toy-world">
    <!-- soft sky: 3 hand-drawn-style clouds + gently pulsing gold sparkles -->
    <div class="sky-deco" aria-hidden="true">
      <span class="cloud c1"></span>
      <span class="cloud c2"></span>
      <span class="cloud c3"></span>
      <span
        v-for="(p, i) in SPARKLES" :key="i" class="sparkle"
        :style="{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.s}px`, height: `${p.s}px`, animationDelay: `${p.d}s` }"
      ></span>
    </div>

    <div class="content">
      <Transition name="swap" mode="out-in">
        <LandingScene v-if="view === 'landing'" key="landing" @start="view = 'adventure'" />
        <ToyStoryAdventure v-else key="adventure" @home="view = 'landing'" />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.sky-deco { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
.content { position: relative; z-index: 1; }

/* rounded clouds: a soft pill body plus two puffs, slightly gradient-shaded, 60% opacity */
.cloud {
  position: absolute; width: 11rem; height: 3.4rem; border-radius: 999px; opacity: .6;
  background: linear-gradient(180deg, #ffffff 0%, #f1f7fc 100%);
  filter: drop-shadow(0 6px 10px #4a86b322);
  animation: drift 60s linear infinite;
}
.cloud::before, .cloud::after { content: ""; position: absolute; border-radius: 50%; background: inherit; }
.cloud::before { width: 4.6rem; height: 4.6rem; left: 1.8rem; top: -2.3rem; }
.cloud::after { width: 6rem; height: 6rem; left: 4.6rem; top: -3.2rem; }
.c1 { top: 14%; left: -12rem; animation-duration: 75s; animation-delay: -20s; }
.c2 { top: 48%; left: -12rem; scale: .75; animation-duration: 95s; animation-delay: -60s; }
.c3 { top: 78%; left: -12rem; scale: .9; animation-duration: 85s; animation-delay: -5s; }

/* gold sparkle: a soft four-point glint that fades in and out */
.sparkle {
  position: absolute; translate: -50% -50%;
  background: radial-gradient(circle, #fff6cf 0 18%, #ffd76a 35%, transparent 70%);
  clip-path: polygon(50% 0, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0 50%, 40% 40%);
  filter: drop-shadow(0 0 4px #ffd76a);
  animation: pulse 3.2s ease-in-out infinite;
}

.swap-enter-active { transition: opacity .6s ease, transform .6s ease; }
.swap-enter-from { opacity: 0; transform: scale(.96); }

@keyframes drift { to { transform: translateX(calc(100vw + 24rem)); } }
@keyframes pulse { 0%, 100% { opacity: .25; scale: .8; } 50% { opacity: 1; scale: 1.25; } }
</style>
