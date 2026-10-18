<script setup lang="ts">
/** Opening page: Kitty's cloud wallpaper, a wooden sign title and the adventure option(s). */
import { ref } from 'vue'
import { toy as T } from '@/data/toyStoryContent'
import ToyHeroes from './ToyHeroes.vue'
import { prefersReducedMotion, useTimers } from '@/composables/useCardHelpers'

const emit = defineEmits<{ start: [index: number] }>()
const reduce = prefersReducedMotion()
const { later } = useTimers()
const picked = ref<number | null>(null)

function pick(i: number) {
  if (picked.value !== null) return
  picked.value = i
  later(() => emit('start', i), reduce ? 0 : 900)
}
</script>

<template>
  <div class="landing" :class="{ leaving: picked !== null }">
    <div class="sign wood">
      <span class="nail l" aria-hidden="true"></span><span class="nail r" aria-hidden="true"></span>
      <h1>{{ T.landing.title }}</h1>
    </div>
    <p class="subtitle">{{ T.landing.subtitle }}</p>
    <div class="options">
      <button
        v-for="(o, i) in T.landing.options" :key="i" class="option" :class="{ chosen: picked === i }"
        :style="{ animationDelay: `${.3 + i * .15}s` }" @click="pick(i)"
      >
        <span class="icon" aria-hidden="true"><ToyHeroes /></span>
        <span class="label">{{ o.label }}</span>
        <span class="hint">{{ o.hint }}</span>
        <span class="go" aria-hidden="true">出發 ▶</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.landing { position: relative; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.2rem; padding: 3rem 16px; text-align: center; overflow: hidden; transition: opacity .6s, transform .6s; }
.landing.leaving { opacity: 0; transform: scale(1.06); transition-delay: .3s; }
.sign { position: relative; max-width: 30rem; padding: 1.2rem 1.6rem; border-radius: 16px; rotate: -2deg; box-shadow: inset 0 2px 0 #f0b97a, 0 6px 0 var(--wood-dark), 0 18px 34px #1e4a7a40, 0 4px 10px #1e4a7a26; animation: swing 3s ease-in-out infinite; transform-origin: 50% -2rem; }
.nail { position: absolute; top: .6rem; width: .7rem; height: .7rem; border-radius: 50%; background: #6b6b74; border: 2px solid var(--ink); }
.nail.l { left: .7rem; } .nail.r { right: .7rem; }
h1 { margin: 0; font-size: clamp(1.4rem, 6vw, 2rem); line-height: 1.35; color: #fff; -webkit-text-stroke: 6px #5a3414; paint-order: stroke fill; text-shadow: 0 4px 0 #3a2008; text-wrap: balance; }
.subtitle { margin: 0; padding: .3rem 1rem; border-radius: 999px; background: #ffffffeb; border: 2px solid var(--ink); font-weight: 700; box-shadow: 0 6px 16px #1e4a7a26; }
.options { width: 100%; max-width: 22rem; display: flex; flex-direction: column; gap: .9rem; }
.option {
  position: relative; display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto auto; column-gap: .9rem; align-items: center;
  padding: 1rem 1.2rem; text-align: left; cursor: pointer; border: 3px solid var(--ink); border-radius: 20px;
  background: repeating-linear-gradient(90deg, var(--yellow) 0 18px, #ffd54d 18px 36px); box-shadow: 0 6px 0 var(--ink), 0 18px 36px #1e4a7a47, 0 6px 14px #1e4a7a2e;
  font: inherit; color: var(--ink); animation: rise .6s cubic-bezier(.2, 1.3, .4, 1) both; transition: translate .15s, box-shadow .15s;
}
.option:hover { translate: 0 -3px; box-shadow: 0 9px 0 var(--ink), 0 24px 42px #1e4a7a52, 0 8px 16px #1e4a7a33; }
.option:active { translate: 0 4px; box-shadow: 0 2px 0 var(--ink); }
.option:focus-visible { outline: 3px solid var(--blue); outline-offset: 4px; }
.option.chosen { animation: chosen .6s ease both; }
.icon { grid-row: 1 / 4; width: 6.2rem; }
.label { font-size: 1.25rem; font-weight: 700; }
.hint { font-size: .85rem; color: var(--ink-soft); }
.go { justify-self: start; margin-top: .3rem; padding: .1rem .8rem; border-radius: 999px; background: var(--red); color: #fff; border: 2px solid var(--ink); font-size: .85rem; font-weight: 700; }
.float-star { position: absolute; font-size: 1.6rem; animation: float 4s ease-in-out infinite; }
.f1 { left: 8%; top: 12%; } .f2 { right: 10%; top: 18%; animation-delay: .7s; font-size: 1.2rem; } .f3 { left: 14%; bottom: 18%; animation-delay: 1.4s; }
.f4 { right: 12%; bottom: 12%; animation-delay: 2.1s; font-size: 2rem; } .f5 { left: 48%; top: 6%; animation-delay: 2.8s; font-size: 1rem; } .f6 { right: 40%; bottom: 6%; animation-delay: 3.5s; }
@keyframes swing { 50% { rotate: 2deg; } }
@keyframes rise { from { opacity: 0; transform: translateY(20px) scale(.95); } }
@keyframes chosen { 40% { scale: 1.06; } 100% { scale: 1; } }
@keyframes float { 50% { transform: translateY(-12px) rotate(15deg); } }
</style>
