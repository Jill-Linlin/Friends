<script setup lang="ts">
/**
 * Easter egg shown just before each world's "to be continued" ending: the gifted ring and its engraving.
 * magic  → a floating glow, a velvet ring box opens, gold engraving.
 * gadget → the 4D pocket glows, the ring is pulled out like a secret gadget ("噹噹噹噹～ 友情戒指！"), comic panel.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { content as C, isTodo } from '@/data/cardContent'
import { prefersReducedMotion, useTimers } from '@/composables/useCardHelpers'
import GadgetArt from './gadget/GadgetArt.vue'

const props = defineProps<{ theme: 'magic' | 'gadget' }>()
const emit = defineEmits<{ done: [] }>()

const R = C.ring
const gadget = computed(() => props.theme === 'gadget')
const reduce = prefersReducedMotion()
const { later } = useTimers()

const phase = ref<'glow' | 'open' | 'ring'>('glow')
const typed = ref('')
const showMessage = ref(false)
let typeTimer = 0

function open() {
  if (phase.value !== 'glow') return
  phase.value = 'open'
  later(() => { phase.value = 'ring'; typeEngraving() }, reduce ? 0 : gadget.value ? 2300 : 1700)
}
function typeEngraving() {
  const full = R.engraving
  let n = 0
  typeTimer = window.setInterval(() => {
    typed.value = full.slice(0, ++n)
    if (n >= full.length) {
      clearInterval(typeTimer)
      later(() => { showMessage.value = true }, reduce ? 0 : 500)
    }
  }, reduce ? 1 : 85)
}
onBeforeUnmount(() => clearInterval(typeTimer))

const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  a: `${(i / 14) * 360}deg`,
  d: `${4 + (i % 3) * 1.5}rem`,
  delay: `${(i % 5) * .12}s`,
}))
</script>

<template>
  <div class="egg" :class="theme">
    <!-- 1. something is glowing -->
    <template v-if="phase === 'glow'">
      <p class="hint">{{ gadget ? R.gadgetHint : R.hint }}</p>
      <button v-if="!gadget" class="orb" aria-label="點開發光的東西" @click="open">
        <span class="halo" aria-hidden="true"></span>
        <span class="core" aria-hidden="true"></span>
        <span v-for="n in 4" :key="n" class="glint" :class="`g${n}`" aria-hidden="true">✦</span>
      </button>
      <button v-else class="glow-pocket" aria-label="把手伸進發光的口袋" @click="open">
        <span class="pocket-light" aria-hidden="true"></span>
        <GadgetArt kind="pocket" />
        <span v-for="n in 4" :key="n" class="glint" :class="`g${n}`" aria-hidden="true">✦</span>
      </button>
      <p class="tap">（點一下{{ gadget ? '口袋' : '' }}）</p>
    </template>

    <!-- 2a. magic: a velvet ring box opens -->
    <div v-else-if="phase === 'open' && !gadget" class="stage" aria-hidden="true">
      <div class="rays"></div>
      <div class="box">
        <div class="lid"></div>
        <div class="base"><span class="slot"></span></div>
      </div>
    </div>

    <!-- 2b. gadget: pulled out of the pocket like a secret gadget -->
    <div v-else-if="phase === 'open'" class="stage pull" role="status" :aria-label="`拿出了${R.gadgetName}`">
      <div class="rays" aria-hidden="true"></div>
      <div class="sfx" aria-hidden="true">噹噹噹噹～</div>
      <div class="pop-ring" aria-hidden="true"><img :src="R.photo" alt=""></div>
      <div class="pull-pocket" aria-hidden="true"><GadgetArt kind="pocket" /></div>
      <div class="callout">{{ R.gadgetName }}！</div>
    </div>

    <!-- 3. the ring and its engraving -->
    <template v-else>
      <div v-if="gadget" class="callout small">{{ R.gadgetName }}！</div>
      <div class="stage">
        <div class="rays" aria-hidden="true"></div>
        <i v-for="(s, i) in SPARKS" :key="i" class="spark" :style="{ '--a': s.a, '--d': s.d, animationDelay: s.delay }" aria-hidden="true"></i>
        <div class="frame">
          <img :src="R.photo" alt="刻著 YOU'VE GOT A FRIEND IN ME 的金色戒指">
          <span class="shine" aria-hidden="true"></span>
        </div>
      </div>
      <div class="caption">{{ R.caption }}</div>
      <p class="engraving" :aria-label="R.engraving">
        <span aria-hidden="true">{{ typed }}</span><span v-if="!showMessage" class="caret" aria-hidden="true">|</span>
      </p>
      <template v-if="showMessage">
        <p class="translation">「{{ R.translation }}」</p>
        <div class="message">
          <p v-for="(line, i) in R.message" :key="i" :style="{ animationDelay: `${i * .5}s` }">
            <span :class="{ ph: isTodo(line) }">{{ line }}</span>
          </p>
        </div>
        <button class="next" :style="{ animationDelay: `${R.message.length * .5 + .3}s` }" @click="emit('done')">
          {{ gadget ? '收進口袋，繼續冒險 →' : '收進心裡，繼續往下 →' }}
        </button>
      </template>
    </template>
  </div>
</template>

<style scoped>
/* magic: dark velvet + warm gold (sits on the night sky). gadget: the comic look of the Doraemon world — white panel, thick ink outlines, yellow and Doraemon blue. */
.egg {
  --gold: #e8c46a;
  --gold-hi: #fff1c1;
  --gold-lo: #9a7228;
  --velvet: #2a1430;
  --text: #f6ecd6;
  width: 100%; max-width: 26rem;
  display: flex; flex-direction: column; align-items: center; gap: 1rem;
  padding: 1.6rem 1.2rem 1.8rem; text-align: center;
  color: var(--text); font-family: "Noto Serif TC", "Songti TC", serif; line-height: 1.75;
  background: radial-gradient(ellipse at 50% 20%, #4a2650, var(--velvet) 70%);
  border-radius: 24px; box-shadow: 0 0 0 1px #e8c46a55, 0 20px 50px #0007;
  animation: rise .7s ease both;
}
.egg p { margin: 0; }
.hint { font-size: 1.05rem; color: var(--gold-hi); }
.tap { font-size: .85rem; color: #d9c7a4aa; }

/* glowing orb (magic) */
.orb { position: relative; width: 9rem; height: 9rem; border: none; background: none; padding: 0; cursor: pointer; animation: float 3s ease-in-out infinite; }
.halo { position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle, #fff6d0 0 12%, #f3cf6a88 30%, transparent 68%); animation: pulse 1.8s ease-in-out infinite; }
.core { position: absolute; left: 50%; top: 50%; width: 1.6rem; height: 1.6rem; margin: -.8rem 0 0 -.8rem; border-radius: 50%; background: #fffbe8; box-shadow: 0 0 18px 8px #ffe28a, 0 0 50px 20px #e8c46a88; }
.glint { position: absolute; color: var(--gold-hi); font-size: 1rem; animation: twinkle 1.6s ease-in-out infinite; }
.glint.g1 { left: 8%; top: 18%; } .glint.g2 { right: 6%; top: 30%; animation-delay: .4s; }
.glint.g3 { left: 22%; bottom: 8%; animation-delay: .8s; } .glint.g4 { right: 20%; bottom: 14%; animation-delay: 1.2s; font-size: .8rem; }
.orb:focus-visible { outline: 2px solid var(--gold); outline-offset: 4px; border-radius: 50%; }

/* stages */
.stage { position: relative; width: 14rem; height: 14rem; display: grid; place-items: center; }
.rays { position: absolute; inset: -10%; border-radius: 50%; background: repeating-conic-gradient(#ffe9a855 0 8deg, transparent 8deg 16deg); -webkit-mask: radial-gradient(circle, #000 25%, transparent 68%); mask: radial-gradient(circle, #000 25%, transparent 68%); animation: spin 16s linear infinite, fade .8s ease both; }

/* velvet ring box (magic) */
.box { position: relative; width: 8rem; height: 6.6rem; perspective: 500px; }
.base { position: absolute; left: 0; right: 0; bottom: 0; height: 3.6rem; border-radius: 8px 8px 12px 12px; background: linear-gradient(#7a1f3d, #4a0f24); box-shadow: inset 0 3px 0 #a33a5d, 0 10px 20px #0008; display: grid; place-items: start center; }
.slot { width: 5rem; height: 1.2rem; margin-top: .5rem; border-radius: 999px; background: #2a0816; box-shadow: 0 0 22px 8px #ffe28a; animation: fade .6s .6s ease both; }
.lid { position: absolute; left: 0; right: 0; top: 0; height: 3.4rem; border-radius: 12px 12px 6px 6px; background: linear-gradient(#a33a5d, #6d1834); box-shadow: inset 0 -3px 0 #4a0f24; transform-origin: 50% 100%; animation: lidOpen 1s .4s cubic-bezier(.5, 0, .3, 1.4) forwards; }
.lid::after { content: ""; position: absolute; left: 50%; top: 40%; width: 1.4rem; height: .5rem; margin-left: -.7rem; border-radius: 3px; background: var(--gold); }

/* ring reveal */
.frame { position: relative; width: 11rem; aspect-ratio: 1; border-radius: 50%; overflow: hidden; border: 4px solid var(--gold); box-shadow: 0 0 0 6px #e8c46a33, 0 0 40px 6px #ffe28a66; animation: emerge 1s cubic-bezier(.2, 1.3, .4, 1) both; }
.frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
.shine { position: absolute; top: -20%; bottom: -20%; left: -60%; width: 40%; rotate: 20deg; background: linear-gradient(90deg, transparent, #ffffffaa, transparent); animation: shine 3.2s 1s ease-in-out infinite; }
.spark { position: absolute; left: 50%; top: 50%; width: 6px; height: 6px; margin: -3px; border-radius: 50%; background: var(--gold-hi); box-shadow: 0 0 8px 2px #ffe28a; animation: burst 1.2s ease-out both; }
.caption { margin-top: -.2rem; font-family: "Cinzel", serif; font-size: .7rem; letter-spacing: .4em; color: #d9c7a4; }
.engraving {
  min-height: 1.6em; max-width: 18em; font-family: "Cinzel", "Times New Roman", serif; font-weight: 700;
  font-size: clamp(1.05rem, 5vw, 1.35rem); letter-spacing: .12em; line-height: 1.4; text-wrap: balance;
  background: linear-gradient(180deg, var(--gold-hi), var(--gold) 50%, var(--gold-lo));
  -webkit-background-clip: text; background-clip: text; color: transparent;
  filter: drop-shadow(0 1px 0 #00000088) drop-shadow(0 0 10px #ffe28a55);
}
.caret { color: var(--gold); -webkit-text-fill-color: var(--gold); animation: blink .8s steps(1) infinite; }
.translation { font-size: 1.05rem; color: var(--gold-hi); animation: rise .6s ease both; }
.message { display: flex; flex-direction: column; gap: .4rem; font-family: "LXGW WenKai TC", "Kaiti TC", serif; font-size: 1.05rem; }
.message p { animation: rise .7s ease both; }
.message .ph { color: var(--gold-hi); border-bottom: 1px dashed var(--gold); }
.next { margin-top: .4rem; padding: .6rem 1.4rem; border: 1px solid var(--gold); border-radius: 999px; background: transparent; color: var(--gold-hi); font: inherit; letter-spacing: .08em; cursor: pointer; animation: rise .6s ease both; transition: background .3s, color .3s; }
.next:hover, .next:focus-visible { background: var(--gold); color: var(--velvet); }

/* ================= gadget (Doraemon) look ================= */
.egg.gadget {
  --ink: #1d1d1f; --blue: #0096e0; --blue-deep: #0b4f8a; --yellow: #ffd400; --red: #e60012; --navy: #1d3557;
  color: var(--navy); font-family: "Huninn", "PingFang TC", "Microsoft JhengHei", sans-serif;
  background: #fff; border: 3px solid var(--ink); box-shadow: 0 6px 0 var(--ink);
}
.gadget .hint { font-weight: 700; color: var(--blue-deep); font-size: 1.1rem; }
.gadget .tap { color: #4a6a8a; }
.gadget .glint { color: var(--yellow); -webkit-text-stroke: 1px var(--ink); font-size: 1.3rem; }
.glow-pocket { position: relative; width: 10rem; padding: 0; border: none; background: none; cursor: pointer; animation: jiggle 1.2s ease-in-out infinite; }
.glow-pocket :deep(svg) { position: relative; }
.pocket-light { position: absolute; left: 50%; top: 36%; width: 9rem; height: 6rem; translate: -50% -50%; border-radius: 50%; background: radial-gradient(ellipse, #fff8c2 0 25%, #ffe56688 50%, transparent 72%); animation: pulse 1.4s ease-in-out infinite; }
.glow-pocket:focus-visible { outline: 3px solid var(--red); outline-offset: 4px; border-radius: 12px; }
.gadget .rays { background: repeating-conic-gradient(#fff3a0 0 10deg, #ffffff 10deg 20deg); -webkit-mask: radial-gradient(circle, #000 35%, transparent 70%); mask: radial-gradient(circle, #000 35%, transparent 70%); animation: spin 6s linear infinite, fade .4s ease both; }
.stage.pull { height: 16rem; }
.sfx { position: absolute; top: 0; font-weight: 900; font-size: 1.1rem; color: var(--blue); animation: rise .4s ease both; }
.pop-ring { position: absolute; top: 18%; width: 6.5rem; aspect-ratio: 1; border-radius: 50%; overflow: hidden; border: 3px solid var(--ink); box-shadow: 0 0 0 5px var(--yellow), 0 0 0 8px var(--ink); animation: popOut 1s .2s cubic-bezier(.2, 1.4, .4, 1) both; }
.pop-ring img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pull-pocket { position: absolute; bottom: 2.6rem; width: 8rem; }
.callout {
  font-size: clamp(2rem, 10vw, 2.6rem); font-weight: 900; letter-spacing: .04em; line-height: 1.2; color: var(--yellow);
  -webkit-text-stroke: 7px var(--blue-deep); paint-order: stroke fill; text-shadow: 0 5px 0 var(--ink);
}
.stage.pull .callout { position: absolute; bottom: 0; animation: calloutIn .5s .9s cubic-bezier(.2, 1.6, .4, 1) both; }
.callout.small { font-size: 1.7rem; -webkit-text-stroke-width: 6px; animation: rise .5s ease both; }
.gadget .frame { border: 3px solid var(--ink); box-shadow: 0 0 0 6px var(--yellow), 0 0 0 9px var(--ink), 0 10px 0 6px #0002; }
.gadget .spark { background: var(--yellow); box-shadow: 0 0 0 2px var(--ink); }
.gadget .caption { font-family: inherit; font-weight: 700; letter-spacing: .3em; color: var(--blue); }
.gadget .engraving {
  font-family: inherit; font-weight: 900; letter-spacing: .06em; color: var(--blue-deep);
  background: none; -webkit-text-fill-color: currentColor; filter: none;
}
.gadget .engraving span:first-child {
  padding: 0 .15em; background: linear-gradient(transparent 58%, #ffe866 58%);
  -webkit-box-decoration-break: clone; box-decoration-break: clone;
}
.gadget .caret { color: var(--red); -webkit-text-fill-color: var(--red); }
.gadget .translation, .gadget .message {
  position: relative; max-width: 24rem; padding: .7rem 1.1rem; background: #fff;
  border: 3px solid var(--ink); border-radius: 20px; box-shadow: 0 4px 0 var(--ink);
}
.gadget .translation { color: var(--red); font-weight: 900; font-size: 1.15rem; }
.gadget .message { font-family: inherit; font-size: 1rem; gap: .3rem; background: #e6f6ff; }
.gadget .message .ph { color: #c2410c; border-bottom: 2px dashed #fb923c; }
.gadget .next {
  border: 3px solid var(--ink); background: var(--yellow); color: var(--ink); font-weight: 700;
  box-shadow: 0 4px 0 var(--ink); transition: translate .08s, box-shadow .08s;
}
.gadget .next:hover, .gadget .next:focus-visible { background: var(--yellow); color: var(--ink); }
.gadget .next:active { translate: 0 3px; box-shadow: 0 1px 0 var(--ink); }

@keyframes rise { from { opacity: 0; transform: translateY(10px); } }
@keyframes fade { from { opacity: 0; } }
@keyframes float { 50% { transform: translateY(-10px); } }
@keyframes pulse { 50% { transform: scale(1.15); opacity: .8; } }
@keyframes twinkle { 0%, 100% { opacity: .3; scale: .7; } 50% { opacity: 1; scale: 1.2; } }
@keyframes spin { to { rotate: 360deg; } }
@keyframes lidOpen { to { transform: rotateX(-115deg); } }
@keyframes emerge { from { transform: translateY(2.5rem) scale(.3); opacity: 0; } }
@keyframes shine { 0% { translate: 0 0; } 60%, 100% { translate: 520% 0; } }
@keyframes burst { from { transform: rotate(var(--a)) translateX(0); opacity: 1; } to { transform: rotate(var(--a)) translateX(var(--d)); opacity: 0; } }
@keyframes blink { 50% { opacity: 0; } }
@keyframes jiggle { 0%, 100% { rotate: 0deg; } 20% { rotate: -6deg; } 40% { rotate: 6deg; } 60% { rotate: -3deg; } 80% { rotate: 3deg; } }
@keyframes popOut { 0% { transform: translateY(6rem) scale(.2) rotate(-30deg); opacity: 0; } 60% { transform: translateY(-.6rem) scale(1.12) rotate(6deg); opacity: 1; } 100% { transform: none; } }
@keyframes calloutIn { from { transform: scale(0) rotate(-12deg); opacity: 0; } }
</style>
