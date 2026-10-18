<script setup lang="ts">
/** The final treasure: Kitty's chest opens with a burst of stars → ring close-up → letter → closing line + gift list. */
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { toy as T, isTodo } from '@/data/toyStoryContent'
import { countdownTo, prefersReducedMotion, useTimers } from '@/composables/useCardHelpers'
import GiftIcon, { type GiftKind } from './GiftIcon.vue'

defineProps<{ gifts: { kind: GiftKind; name: string }[] }>()
const emit = defineEmits<{ opened: []; restart: [] }>()

const R = T.treasure
const reduce = prefersReducedMotion()
const { later } = useTimers()
const phase = ref<'closed' | 'opening' | 'open'>('closed')
const step = ref(0) // 0 ring, 1 letter, 2 closing, 3 sequel teaser

/* next chapter: a sequel "poster" with a countdown to next year */
const Q = T.sequel
const { days, label } = countdownTo(Q.revealDate)
const sequelEl = ref<HTMLElement>()
const NIGHT_STARS = Array.from({ length: 16 }, (_, i) => ({ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 92}%`, delay: `${(i % 6) * .4}s` }))
function showSequel() {
  step.value = 3
  nextTick(() => sequelEl.value?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }))
}

const BURST = Array.from({ length: 22 }, (_, i) => ({
  a: `${(i / 22) * 360}deg`,
  d: `${7 + (i % 4) * 2}rem`,
  c: ['#ffcc29', '#e23b2e', '#2f6fdb', '#5cbf3a', '#ffffff'][i % 5],
  delay: `${(i % 6) * .05}s`,
}))

/* background music: starts with the tap that opens the chest (browsers only allow sound after a tap), stops when leaving */
const M = R.music
const playing = ref(false)
const musicMissing = ref(false)
let audio: HTMLAudioElement | null = null
function startMusic() {
  if (!M.src) return
  audio = new Audio(M.src)
  audio.loop = M.loop
  audio.volume = M.volume
  audio.addEventListener('error', () => { musicMissing.value = true; playing.value = false })
  audio.addEventListener('ended', () => { playing.value = false })
  audio.play().then(() => { playing.value = true }).catch(() => { playing.value = false })
}
function toggleMusic() {
  if (!audio || musicMissing.value) return
  if (audio.paused) audio.play().then(() => { playing.value = true }).catch(() => {})
  else { audio.pause(); playing.value = false }
}
function stopMusic() {
  if (audio) { audio.pause(); audio.currentTime = 0 }
  playing.value = false
}
onBeforeUnmount(stopMusic)
function restart() {
  stopMusic()
  emit('restart')
}

function open() {
  if (phase.value !== 'closed') return
  phase.value = 'opening'
  startMusic()
  emit('opened')
  later(() => { phase.value = 'open' }, reduce ? 0 : 1500)
  later(() => { step.value = 1 }, reduce ? 0 : 4200)
}
</script>

<template>
  <div class="treasure">
    <template v-if="phase !== 'open'">
      <p class="arrive">{{ R.arrive }}</p>
      <button class="chest" :class="phase" :disabled="phase !== 'closed'" aria-label="打開凱蒂的寶箱" @click="open">
        <span class="rays" aria-hidden="true"></span>
        <span class="lid wood"><span class="label">{{ R.chestLabel }}</span></span>
        <span class="box wood"><span class="lock" aria-hidden="true">★</span></span>
        <template v-if="phase === 'opening'">
          <i v-for="(b, i) in BURST" :key="i" class="burst" :style="{ '--a': b.a, '--d': b.d, color: b.c, animationDelay: b.delay }" aria-hidden="true">★</i>
        </template>
      </button>
      <p v-if="phase === 'closed'" class="hint">（點一下寶箱）</p>
    </template>

    <template v-else>
      <div class="spot" aria-hidden="true"></div>
      <div class="ring-frame">
        <img v-if="R.photo" :src="R.photo" alt="終極寶藏：刻著 YOU'VE GOT A FRIEND IN ME 的戒指">
        <span v-else class="ring-art" role="img" aria-label="終極寶藏：刻著 YOU'VE GOT A FRIEND IN ME 的金戒指"><GiftIcon kind="ring" /></span>
        <span class="shine" aria-hidden="true"></span>
        <i v-for="n in 6" :key="n" class="sparkle" :class="`s${n}`" aria-hidden="true">✦</i>
      </div>
      <div class="engraving-row">
        <p class="engraving">{{ R.engraving }}</p>
        <button
          v-if="!musicMissing" class="music-btn" :class="{ on: playing }" :aria-pressed="playing"
          :aria-label="playing ? '暫停音樂' : '播放音樂'" :title="playing ? '暫停音樂' : '播放音樂'" @click="toggleMusic"
        >
          <span aria-hidden="true">🎵</span>
          <span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>
        </button>
      </div>

      <div v-if="step >= 1" class="letter cream-card">
        <p class="greet">{{ R.letter.greeting }}</p>
        <p v-for="(para, i) in R.letter.paragraphs" :key="i" :style="{ animationDelay: `${i * .4}s` }"><span :class="{ todo: isTodo(para) }">{{ para }}</span></p>
        <p class="sign"><span :class="{ todo: isTodo(R.letter.signature) }">{{ R.letter.signature }}</span></p>
      </div>
      <button v-if="step === 1" class="toy-btn red" @click="step = 2">讀完了 ♥</button>

      <template v-if="step >= 2">
        <p class="closing">{{ R.closing }}</p>
        <div class="gift-list wood">
          <div class="gl-title">本次冒險收集到的禮物</div>
          <ul>
            <li v-for="g in gifts" :key="g.kind"><span class="gl-icon"><GiftIcon :kind="g.kind" /></span>{{ g.name }}<span class="check">✔</span></li>
          </ul>
        </div>
        <button v-if="step === 2" class="toy-btn blue" @click="showSequel">{{ Q.button }}</button>
      </template>

      <!-- next chapter: sequel teaser -->
      <section v-if="step >= 3" ref="sequelEl" class="sequel" aria-label="下集預告">
        <span v-for="(s, i) in NIGHT_STARS" :key="i" class="s-star" :style="{ left: s.left, top: s.top, animationDelay: s.delay }" aria-hidden="true">✦</span>
        <div class="kicker">{{ Q.kicker }}</div>
        <h2 class="poster-title"><span>{{ Q.title }}</span><b>{{ Q.number }}</b></h2>
        <div class="mystery" aria-hidden="true">
          <span class="m-lid"></span><span class="m-box"><span class="q">?</span></span>
        </div>
        <p class="tagline">{{ Q.tagline }}</p>
        <div class="coming">COMING SOON</div>
        <div class="count"><b>{{ days }}</b><span>天後揭曉</span><small>{{ label }}</small></div>
        <ul class="teasers" aria-label="下一章預告（尚未揭曉）">
          <li v-for="(t, i) in Q.teasers" :key="i"><span aria-hidden="true">{{ t }}</span></li>
        </ul>
        <p class="motto">{{ Q.motto }}</p>
        <button class="toy-btn ghost" @click="restart">再玩一次冒險</button>
      </section>
    </template>
  </div>
</template>

<style scoped>
.treasure { position: relative; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center; }
.arrive { margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--ink); background: #ffffffcc; padding: .4rem 1rem; border-radius: 999px; border: 2px solid var(--ink); }
.hint { margin: 0; color: var(--ink-soft); }

/* chest */
.chest { position: relative; width: 15rem; height: 13rem; padding: 0; border: none; background: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; perspective: 600px; }
.chest:disabled { cursor: default; }
.chest.closed { animation: wiggle 2.4s ease-in-out infinite; }
.box { position: relative; width: 13rem; height: 6.5rem; border-radius: 6px 6px 12px 12px; display: grid; place-items: start center; }
.lock { margin-top: -.9rem; width: 2.4rem; height: 2.4rem; display: grid; place-items: center; border-radius: 50%; background: var(--yellow); border: 3px solid var(--ink); font-size: 1.3rem; color: var(--red); }
.lid { position: relative; z-index: 1; width: 13.6rem; height: 3.6rem; border-radius: 40px 40px 6px 6px; display: grid; place-items: center; transform-origin: 50% 100%; transition: transform .9s cubic-bezier(.4, 0, .3, 1.4); }
.label { font-family: var(--f-toy); font-size: 1.7rem; letter-spacing: .1em; color: var(--ink); rotate: -4deg; }
.chest.opening .lid { transform: rotateX(-110deg); }
.rays { position: absolute; left: 50%; top: 40%; width: 22rem; height: 22rem; translate: -50% -50%; border-radius: 50%; background: repeating-conic-gradient(#fff6b0 0 10deg, transparent 10deg 20deg); -webkit-mask: radial-gradient(circle, #000 25%, transparent 70%); mask: radial-gradient(circle, #000 25%, transparent 70%); opacity: 0; transition: opacity .6s; animation: spin 12s linear infinite; pointer-events: none; }
.chest.opening .rays { opacity: 1; }
.burst { position: absolute; left: 50%; top: 55%; font-style: normal; font-size: 1.3rem; -webkit-text-stroke: 1px var(--ink); animation: burst 1.3s ease-out both; }

/* ring close-up */
.spot { position: absolute; top: -2rem; left: 50%; width: 26rem; height: 26rem; translate: -50% 0; border-radius: 50%; background: radial-gradient(circle, #fff8cc 0, #fff8cc66 35%, transparent 65%); pointer-events: none; animation: fade 1s ease both; }
.title { position: relative; margin: 0; font-size: clamp(1.5rem, 6.5vw, 2rem); color: var(--red); -webkit-text-stroke: 6px #fff; paint-order: stroke fill; text-shadow: 0 4px 0 var(--ink); animation: zoom .6s cubic-bezier(.2, 1.5, .4, 1) both; }
.ring-frame { position: relative; width: 13rem; aspect-ratio: 1; border-radius: 50%; overflow: hidden; border: 4px solid var(--ink); box-shadow: 0 0 0 8px var(--yellow), 0 0 0 11px var(--ink), 0 0 50px 14px #fff6b0; animation: zoom .9s .2s cubic-bezier(.2, 1.4, .4, 1) both; }
.ring-frame { background: radial-gradient(circle, #fffdf2, #fff1c2); }
.ring-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ring-art { display: grid; place-items: center; width: 100%; height: 100%; padding: 10%; animation: turn 4s ease-in-out infinite; }

/* sequel teaser poster */
.sequel { position: relative; width: 100%; max-width: 28rem; margin-top: 1rem; display: flex; flex-direction: column; align-items: center; gap: .8rem; padding: 1.6rem 1.2rem 1.6rem; overflow: hidden; border: 4px solid var(--ink); border-radius: 22px; color: #fff; background: radial-gradient(ellipse at 50% 30%, #2a3d8f, #101845 70%); box-shadow: 0 8px 0 var(--ink); animation: rise .8s ease both; scroll-margin-top: 1rem; }
.s-star { position: absolute; color: #fff6c2; font-size: .7rem; animation: twinkle 2.4s ease-in-out infinite; }
.sequel .kicker { position: relative; font-family: var(--f-toy); letter-spacing: .3em; color: #7cc6ff; }
.poster-title { position: relative; margin: 0; display: flex; align-items: center; gap: .4rem; font-size: clamp(1.4rem, 6vw, 1.8rem); color: var(--yellow); -webkit-text-stroke: 6px var(--red); paint-order: stroke fill; text-shadow: 0 4px 0 var(--ink); }
.poster-title b { font-family: var(--f-toy); font-size: 3.4rem; line-height: 1; color: var(--red); -webkit-text-stroke: 6px var(--yellow); rotate: 8deg; animation: zoom .7s .3s cubic-bezier(.2, 1.6, .4, 1) both; }
.mystery { position: relative; width: 7rem; height: 6.4rem; filter: drop-shadow(0 0 20px #fff6c288); animation: float 3s ease-in-out infinite; }
.m-box { position: absolute; left: .6rem; right: .6rem; bottom: 0; height: 4.2rem; display: grid; place-items: center; border: 3px solid var(--ink); border-radius: 6px; background: linear-gradient(90deg, transparent 42%, var(--yellow) 42% 58%, transparent 58%), #1b2557; }
.m-lid { position: absolute; left: .2rem; right: .2rem; bottom: 3.9rem; height: 1.5rem; border: 3px solid var(--ink); border-radius: 6px; background: linear-gradient(90deg, transparent 42%, var(--yellow) 42% 58%, transparent 58%), #24306b; }
.q { position: relative; font-family: var(--f-toy); font-size: 2.2rem; color: #fff; text-shadow: 0 0 12px #7cc6ff; }
.tagline { position: relative; margin: 0; max-width: 22rem; line-height: 1.8; }
.coming { position: relative; padding: .1rem 1.2rem; border-radius: 6px; background: var(--red); border: 3px solid var(--ink); font-family: var(--f-toy); letter-spacing: .2em; rotate: -3deg; box-shadow: 0 4px 0 var(--ink); }
.count { position: relative; display: flex; flex-wrap: wrap; align-items: baseline; justify-content: center; gap: .1rem .4rem; }
.count b { font-family: var(--f-toy); font-size: 3rem; line-height: 1.1; color: var(--yellow); text-shadow: 0 0 18px #ffcc2988; }
.count small { flex-basis: 100%; text-align: center; color: #b9c8ff; }
.teasers { position: relative; list-style: none; margin: 0; padding: 0; width: 100%; display: flex; flex-direction: column; gap: .4rem; }
.teasers li { padding: .45rem .9rem; border-radius: 10px; border: 2px dashed #7cc6ff88; background: #ffffff12; overflow: hidden; }
.teasers span { display: block; filter: blur(5px); user-select: none; animation: fog 5s ease-in-out infinite; }
.teasers li:nth-child(2) span { animation-delay: 1.6s; } .teasers li:nth-child(3) span { animation-delay: 3.2s; }
.motto { position: relative; margin: 0; font-family: var(--f-toy); font-size: 1.1rem; color: #7cc6ff; letter-spacing: .06em; }
.shine { position: absolute; top: -20%; bottom: -20%; left: -60%; width: 40%; rotate: 20deg; background: linear-gradient(90deg, transparent, #ffffffaa, transparent); animation: shine 3s 1.2s ease-in-out infinite; }
.sparkle { position: absolute; font-style: normal; color: #fff; font-size: 1rem; text-shadow: 0 0 6px #ffcc29; animation: twinkle 1.6s ease-in-out infinite; }
.sparkle.s1 { left: 14%; top: 18%; } .sparkle.s2 { right: 16%; top: 12%; animation-delay: .3s; } .sparkle.s3 { right: 10%; top: 55%; animation-delay: .6s; }
.sparkle.s4 { left: 20%; bottom: 14%; animation-delay: .9s; } .sparkle.s5 { left: 50%; top: 6%; animation-delay: 1.2s; } .sparkle.s6 { right: 30%; bottom: 8%; animation-delay: 1.5s; }
.engraving-row { position: relative; display: flex; align-items: center; justify-content: center; gap: .5rem; }
.music-btn { flex: none; display: inline-flex; align-items: center; gap: .25rem; height: 2.2rem; padding: 0 .55rem; border: 2px solid var(--ink); border-radius: 999px; background: #fff; box-shadow: 0 3px 0 var(--ink); font-size: 1rem; cursor: pointer; opacity: .55; transition: opacity .3s, background .3s; }
.music-btn.on { opacity: 1; background: #fff6c2; }
.music-btn:active { translate: 0 2px; box-shadow: 0 1px 0 var(--ink); }
.music-btn:focus-visible { outline: 3px solid var(--blue); outline-offset: 2px; }
.eq { display: inline-flex; align-items: flex-end; gap: 2px; height: .9rem; }
.eq i { width: 3px; height: 30%; border-radius: 2px; background: var(--ink); }
.music-btn.on .eq i { animation: eq .8s ease-in-out infinite alternate; }
.music-btn.on .eq i:nth-child(2) { animation-delay: .25s; }
.music-btn.on .eq i:nth-child(3) { animation-delay: .5s; }
.engraving { position: relative; margin: 0; max-width: 18em; font-family: var(--f-toy); font-size: clamp(1.05rem, 5vw, 1.35rem); letter-spacing: .06em; color: var(--blue); text-wrap: balance; text-shadow: 2px 2px 0 #fff; }

.letter { width: 100%; max-width: 28rem; padding: 1.3rem 1.3rem 1.4rem; text-align: left; font-family: var(--f-hand); font-size: 1.05rem; line-height: 1.9; animation: rise .8s ease both;
  background: repeating-linear-gradient(transparent 0 calc(1.9em - 1px), #e8d6b0 calc(1.9em - 1px) 1.9em) 0 1.2rem, var(--cream); }
.letter p { margin: 0 0 .3rem; animation: rise .7s ease both; }
.letter .greet { font-weight: 700; }
.letter .sign { text-align: right; margin-top: .6rem; }
.closing { margin: 0; max-width: 26rem; padding: 1rem 1.2rem; border-radius: 18px; background: var(--red); color: #fff; border: 3px solid var(--ink); box-shadow: 0 5px 0 var(--ink); font-size: 1.1rem; font-weight: 700; line-height: 1.8; animation: zoom .6s cubic-bezier(.2, 1.4, .4, 1) both; }
.gift-list { width: 100%; max-width: 24rem; padding: .9rem 1rem; border-radius: 16px; text-align: left; color: #fff; animation: rise .7s .3s ease both; }
.gl-title { font-weight: 700; text-align: center; text-shadow: 0 2px 0 var(--wood-dark); margin-bottom: .3rem; }
.gift-list ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .35rem; }
.gift-list li { display: flex; align-items: center; gap: .6rem; padding: .3rem .6rem; border-radius: 10px; background: var(--cream); color: var(--ink); border: 2px solid var(--wood-dark); font-weight: 700; }
.gl-icon { width: 2rem; flex: none; }
.check { margin-left: auto; color: var(--green); }

@keyframes wiggle { 0%, 80%, 100% { rotate: 0deg; } 85% { rotate: -3deg; } 90% { rotate: 3deg; } 95% { rotate: -2deg; } }
@keyframes spin { to { rotate: 360deg; } }
@keyframes burst { from { transform: rotate(var(--a)) translateY(0) scale(.4); opacity: 1; } to { transform: rotate(var(--a)) translateY(calc(var(--d) * -1)) scale(1.2); opacity: 0; } }
@keyframes fade { from { opacity: 0; } }
@keyframes zoom { from { transform: scale(.3); opacity: 0; } }
@keyframes shine { 0% { translate: 0 0; } 60%, 100% { translate: 520% 0; } }
@keyframes twinkle { 50% { opacity: .3; scale: .7; } }
@keyframes turn { 50% { transform: rotate(-6deg) scale(1.04); } }
@keyframes float { 50% { transform: translateY(-8px); } }
@keyframes fog { 50% { filter: blur(3.5px); opacity: .7; } }
@keyframes eq { from { height: 25%; } to { height: 100%; } }
@keyframes rise { from { opacity: 0; transform: translateY(12px); } }
</style>
