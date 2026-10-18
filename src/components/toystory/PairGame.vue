<script setup lang="ts">
/** Flip-and-match with photos of her: each photo appears twice; matching every pair reveals the pair of hair clips. Emits `win`. */
import { ref } from 'vue'
import { toy as T } from '@/data/toyStoryContent'
import { asset, prefersReducedMotion, useTimers } from '@/composables/useCardHelpers'

const emit = defineEmits<{ win: [] }>()
const reduce = prefersReducedMotion()
const { later } = useTimers()

const PHOTOS = T.stations.clips.pairPhotos
const cards = ref(
  [...PHOTOS, ...PHOTOS]
    .map((src, i) => ({ id: i, src, open: false, matched: false }))
    .sort(() => Math.random() - .5),
)
const turns = ref(0)
let first: number | null = null
let locked = false

function flip(idx: number) {
  const c = cards.value[idx]!
  if (locked || c.open || c.matched) return
  c.open = true
  if (first === null) { first = idx; return }
  const a = cards.value[first]!
  first = null
  turns.value++
  if (a.src === c.src) {
    a.matched = c.matched = true
    if (cards.value.every(k => k.matched)) later(() => emit('win'), reduce ? 0 : 900)
  } else {
    locked = true
    later(() => { a.open = c.open = false; locked = false }, reduce ? 0 : 850)
  }
}
</script>

<template>
  <div class="pairs">
    <div class="grid">
      <button
        v-for="(c, i) in cards" :key="c.id" class="card" :class="{ open: c.open, matched: c.matched }"
        :aria-label="c.open || c.matched ? `${T.herName}的照片` : '翻開卡片'" @click="flip(i)"
      >
        <span class="in">
          <span class="back" aria-hidden="true">★</span>
          <span class="front"><img :src="asset(c.src)" :alt="`${T.herName}的照片`" loading="eager"></span>
        </span>
      </button>
    </div>
    <p class="turns">已翻 {{ turns }} 次</p>
  </div>
</template>

<style scoped>
.pairs { width: 100%; max-width: 21rem; display: flex; flex-direction: column; align-items: center; gap: .5rem; }
.grid { width: 100%; display: grid; grid-template-columns: repeat(4, 1fr); gap: .55rem; perspective: 600px; }
.card { aspect-ratio: 3 / 4; padding: 0; border: none; background: none; cursor: pointer; }
.in { position: relative; display: block; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform .45s; }
.card.open .in, .card.matched .in { transform: rotateY(180deg); }
.back, .front { position: absolute; inset: 0; display: grid; place-items: center; overflow: hidden; border: 3px solid var(--ink); border-radius: 10px; backface-visibility: hidden; box-shadow: 0 3px 0 var(--ink); }
.back { background: repeating-linear-gradient(45deg, var(--blue) 0 8px, #3d7ee8 8px 16px); color: var(--yellow); font-size: 1.4rem; -webkit-text-stroke: 1px var(--ink); }
.front { background: var(--cream); transform: rotateY(180deg); }
.front img { width: 100%; height: 100%; object-fit: cover; display: block; }
.card.matched .front { border-color: var(--green); box-shadow: 0 3px 0 var(--ink), 0 0 0 3px #5cbf3a66; animation: pop .4s ease; }
.turns { margin: 0; font-size: .85rem; color: var(--ink-soft); }
@keyframes pop { 50% { scale: 1.08; } }
</style>
