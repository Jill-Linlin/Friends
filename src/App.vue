<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import LandingScene from './components/LandingScene.vue'
import type { World } from './data/cardContent'

/** 每個世界對應的賀卡（點選後才載入） */
const WORLDS: Record<World, ReturnType<typeof defineAsyncComponent>> = {
  magic: defineAsyncComponent(() => import('./components/StarAcademyCard.vue')),
  gadget: defineAsyncComponent(() => import('./components/GadgetCard.vue')),
}

/**
 * 目前選擇的世界；null = 停在開場選擇頁。
 * 同步到網址 hash（#magic / #gadget），所以重新整理會留在同一個世界，瀏覽器「上一頁」會回到開場。
 */
const fromHash = (): World | null => {
  const h = location.hash.slice(1)
  return h in WORLDS ? (h as World) : null
}
const selectedWorld = ref<World | null>(fromHash())

function chooseWorld(w: World) {
  selectedWorld.value = w
  history.pushState(null, '', `#${w}`)
}
function backToLanding() {
  selectedWorld.value = null
  history.pushState(null, '', location.pathname + location.search)
}
const onPop = () => { selectedWorld.value = fromHash() }
onMounted(() => addEventListener('popstate', onPop))
onBeforeUnmount(() => removeEventListener('popstate', onPop))
</script>

<template>
  <Transition name="world" mode="out-in">
    <LandingScene v-if="!selectedWorld" key="landing" @choose="chooseWorld" />
    <component :is="WORLDS[selectedWorld]" v-else :key="selectedWorld" />
  </Transition>

  <Transition name="world-back">
    <button v-if="selectedWorld" class="world-back" aria-label="回到開場，重新選擇世界" @click="backToLanding">
      <span aria-hidden="true">↺</span><span class="txt">重新選擇世界</span>
    </button>
  </Transition>
</template>

<style scoped>
/* world swap: the landing's portal already filled the screen with the next world's colour, so a soft fade finishes it */
.world-enter-active { transition: opacity .7s ease, filter .7s ease; }
.world-leave-active { transition: opacity .35s ease; }
.world-enter-from { opacity: 0; filter: blur(6px); }
.world-leave-to { opacity: 0; }

/* discreet way back to the landing scene: an icon that reveals its label on hover/focus */
.world-back {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 12px);
  left: 12px;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: .4rem;
  height: 2rem;
  padding: 0 .65rem;
  border-radius: 999px;
  border: 1px solid #ffffff2a;
  background: #0007;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #ffffffb0;
  font: .8rem/1 "Noto Serif TC", serif;
  cursor: pointer;
  opacity: .55;
  transition: opacity .3s, color .3s;
}
.world-back span:first-child { font-size: 1rem; }
.world-back .txt { max-width: 0; overflow: hidden; white-space: nowrap; transition: max-width .35s ease; }
.world-back:hover, .world-back:focus-visible { opacity: 1; color: #fff; }
.world-back:hover .txt, .world-back:focus-visible .txt { max-width: 7rem; }
.world-back:focus-visible { outline: 2px solid #e3c27c; outline-offset: 2px; }
.world-back-enter-active { transition: opacity .6s 1s; }
.world-back-enter-from { opacity: 0; }
</style>
