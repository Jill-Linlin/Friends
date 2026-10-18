<script setup lang="ts">
/** Visual-novel style dialogue: typewriter text, speaker avatar, tap / button to advance. Emits `done` after the last line. */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { toy as T, isTodo, type Line } from '@/data/toyStoryContent'
import { prefersReducedMotion } from '@/composables/useCardHelpers'
import ToyChibi from './ToyChibi.vue'

const props = defineProps<{ lines: Line[]; doneLabel?: string }>()
const emit = defineEmits<{ done: []; line: [index: number] }>()

const reduce = prefersReducedMotion()
const i = ref(0)
const typed = ref('')
const typing = ref(false)
let timer = 0

const line = computed(() => props.lines[i.value]!)
const isLast = computed(() => i.value >= props.lines.length - 1)
const NAMES = { her: T.herName, james: T.james.name, narrator: '', toy: '玩具們' } as const

function type() {
  clearInterval(timer)
  const text = line.value.text
  let n = 0
  typed.value = ''
  typing.value = true
  timer = window.setInterval(() => {
    typed.value = text.slice(0, ++n)
    if (n >= text.length) { clearInterval(timer); typing.value = false }
  }, reduce ? 1 : 38)
  emit('line', i.value)
}
function next() {
  if (typing.value) { clearInterval(timer); typed.value = line.value.text; typing.value = false; return }
  if (isLast.value) return emit('done')
  i.value++
  type()
}
watch(() => props.lines, () => { i.value = 0; type() }, { immediate: true })
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="dialogue" :class="line.who" role="group" aria-label="對話">
    <div class="avatar" aria-hidden="true">
      <ToyChibi v-if="line.who === 'her'" :look="T.looks.her" kind="her" />
      <ToyChibi v-else-if="line.who === 'james'" :look="T.looks.james" kind="james" />
      <span v-else-if="line.who === 'toy'" class="glyph">🧸</span>
      <span v-else class="glyph star-badge">★</span>
    </div>
    <div class="body">
      <b v-if="NAMES[line.who]" class="name">{{ NAMES[line.who] }}</b>
      <p class="text" :class="{ todo: isTodo(line.text) && !typing }" aria-live="polite">{{ typed }}</p>
    </div>
    <button class="toy-btn next" :class="isLast && !typing ? 'red' : 'ghost'" @click="next">
      {{ typing ? '▶▶' : isLast ? (doneLabel || '繼續') : '▶' }}
    </button>
  </div>
</template>

<style scoped>
.dialogue { position: relative; width: 100%; display: grid; grid-template-columns: auto 1fr; gap: .4rem .8rem; align-items: start; padding: .9rem 1rem 1rem; text-align: left; background: var(--cream); border: 3px solid var(--ink); border-radius: 18px; box-shadow: 0 5px 0 var(--ink); animation: pop .35s cubic-bezier(.2, 1.4, .4, 1) both; }
.dialogue.james { background: #eef3ff; }
.avatar { width: 3.4rem; height: 3.4rem; overflow: hidden; border-radius: 50%; border: 3px solid var(--ink); background: var(--sky); display: grid; place-items: center; }
/* the figure is taller than the frame: push it down so the face, not the hat/hair, is centred */
.avatar :deep(.chibi) { flex: none; align-self: start; justify-self: center; width: 3.5rem; margin-top: -.3rem; }
.dialogue.james .avatar { background: #ffd9e6; }
.glyph { font-size: 1.7rem; line-height: 1; }
.body { min-width: 0; }
.name { display: inline-block; padding: 0 .6rem; border-radius: 999px; background: var(--red); color: #fff; font-size: .8rem; }
.dialogue.james .name { background: var(--blue); }
.text { margin: .25rem 0 0; min-height: 3.4em; font-size: 1.02rem; line-height: 1.7; }
.dialogue.narrator .text { color: var(--ink-soft); font-style: italic; }
.next { grid-column: 2; justify-self: end; padding: .35rem 1rem; font-size: .9rem; }
@keyframes pop { from { opacity: 0; transform: translateY(10px) scale(.97); } }
</style>
