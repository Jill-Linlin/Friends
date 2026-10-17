<script setup lang="ts">
import { ref } from 'vue'
import { content as C, type World } from '@/data/cardContent'
import { prefersReducedMotion, useTimers } from '@/composables/useCardHelpers'

const emit = defineEmits<{ choose: [world: World] }>()

const reduce = prefersReducedMotion()
const { later } = useTimers()
const L = C.landing

/** each door's portal colour = the chosen card's own background, so the hand-off is seamless */
const WORLDS: { key: World; no: string; hint: string; portal: string }[] = [
  { key: 'magic', no: '01', hint: '推開魔法學院的門', portal: '#0a0d22' },
  { key: 'gadget', no: '02', hint: '打開四次元口袋', portal: '#7fd0ff' },
]

/* floating motes */
const motes = Array.from({ length: 36 }, () => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: `${Math.random() * 3 + 1.5}px`,
  dur: `${Math.random() * 8 + 7}s`,
  delay: `${-Math.random() * 12}s`,
  gold: Math.random() < .55,
}))

const picked = ref<World | null>(null)
const portal = ref<{ x: string; y: string; color: string } | null>(null)

function choose(w: (typeof WORLDS)[number], e: MouseEvent) {
  if (picked.value) return
  picked.value = w.key
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  portal.value = { x: `${r.left + r.width / 2}px`, y: `${r.top + r.height / 2}px`, color: w.portal }
  later(() => emit('choose', w.key), reduce ? 0 : 1300)
}
</script>

<template>
  <div class="landing" :class="{ leaving: picked }">
    <div class="motes" aria-hidden="true">
      <i
        v-for="(m, i) in motes" :key="i" :class="{ gold: m.gold }"
        :style="{ left: m.left, top: m.top, width: m.size, height: m.size, animationDuration: m.dur, animationDelay: m.delay }"
      ></i>
    </div>

    <main class="stage">
      <div class="eyebrow">{{ L.eyebrow }}</div>
      <h1 class="question">{{ L.question }}</h1>
      <p class="subtitle">{{ L.subtitle }}</p>

      <div class="doors">
        <button
          v-for="(w, i) in WORLDS" :key="w.key" class="door" :class="[w.key, { chosen: picked === w.key }]"
          :style="{ animationDelay: `${.5 + i * .18}s` }" :disabled="!!picked" @click="choose(w, $event)"
        >
          <span class="no">{{ w.no }}</span>

          <!-- magic: sorting hat + stars -->
          <svg v-if="w.key === 'magic'" class="icon" viewBox="0 0 120 120" aria-hidden="true">
            <defs>
              <radialGradient id="lp-magic-bg" cx="50%" cy="40%" r="60%">
                <stop offset="0" stop-color="#3b2a6e" /><stop offset="1" stop-color="#151a3e" />
              </radialGradient>
              <linearGradient id="lp-hat" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#a0754a" /><stop offset="1" stop-color="#5a3b1f" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="54" fill="url(#lp-magic-bg)" />
            <!-- brim -->
            <ellipse cx="60" cy="89" rx="40" ry="9" fill="#5a3b1f" stroke="#2e1d10" stroke-width="2.5" />
            <!-- crooked cone -->
            <path
              d="M30 87 C38 72 44 58 50 45 C54 35 57 27 63 21 C69 15 78 16 82 23 C75 22 71 26 69 33 C71 50 78 68 90 87 Z"
              fill="url(#lp-hat)" stroke="#2e1d10" stroke-width="2.5" stroke-linejoin="round"
            />
            <!-- patch + stitches -->
            <path d="M58 33 l8 -2 2 7 -8 2z" fill="#7a5530" stroke="#2e1d10" stroke-width="1.5" />
            <path d="M59 36 l1.5 -.4 M62 35.2 l1.5 -.4 M65 34.4 l1.2 -.3" stroke="#e3c27c" stroke-width="1" stroke-linecap="round" />
            <!-- folds that form the face -->
            <path d="M49 55 q4.5 -4 9 0" fill="none" stroke="#2e1d10" stroke-width="2.5" stroke-linecap="round" />
            <path d="M64 54 q4.5 -4 9 0" fill="none" stroke="#2e1d10" stroke-width="2.5" stroke-linecap="round" />
            <path d="M50 58 q4 2 7 0 M65 57 q4 2 7 0" fill="none" stroke="#3d2714" stroke-width="1.2" stroke-linecap="round" />
            <path d="M47 69 q13 8 28 -1" fill="none" stroke="#2e1d10" stroke-width="3" stroke-linecap="round" />
            <path d="M52 74 q8 3 16 0" fill="none" stroke="#3d2714" stroke-width="1.2" stroke-linecap="round" />
            <path d="M44 47 q5 3 3 9 M78 62 q-4 4 -2 10" fill="none" stroke="#3d2714" stroke-width="1.2" stroke-linecap="round" />
            <!-- band seam -->
            <path d="M33 81 q27 7 54 0" fill="none" stroke="#2e1d10" stroke-width="1.5" stroke-dasharray="3 3" />
            <path class="twinkle" d="M93 30 l3.5 8.5 8.5 3.5 -8.5 3.5 -3.5 8.5 -3.5 -8.5 -8.5 -3.5 8.5 -3.5z" fill="#f2e7c9" />
            <path class="twinkle d2" d="M98 64 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z" fill="#e3c27c" />
            <path class="twinkle d3" d="M30 34 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#9ad8ff" />
          </svg>

          <!-- gadget: magic pocket + bell -->
          <svg v-else class="icon" viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="54" fill="url(#lp-gadget-bg)" />
            <defs>
              <radialGradient id="lp-gadget-bg" cx="50%" cy="40%" r="60%">
                <stop offset="0" stop-color="#2e9be6" /><stop offset="1" stop-color="#0d4a7c" />
              </radialGradient>
            </defs>
            <path d="M30 58 H90 A30 30 0 0 1 30 58 Z" fill="#fff" stroke="#0d2a44" stroke-width="3" stroke-linejoin="round" />
            <path d="M36 58 H84" stroke="#0d2a44" stroke-width="3" stroke-linecap="round" />
            <circle cx="60" cy="30" r="11" fill="#ffd84a" stroke="#0d2a44" stroke-width="3" />
            <path d="M50 28 H70" stroke="#0d2a44" stroke-width="2.5" />
            <circle cx="60" cy="34" r="2.5" fill="#0d2a44" />
            <path class="twinkle" d="M92 34 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#fff" />
            <path class="twinkle d2" d="M26 36 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#ffd84a" />
          </svg>

          <span class="label">{{ L.options[w.key] }}</span>
          <span class="hint">{{ w.hint }} <span aria-hidden="true">→</span></span>
        </button>
      </div>
    </main>

    <div
      v-if="portal" class="portal" aria-hidden="true"
      :style="{ '--x': portal.x, '--y': portal.y, background: portal.color }"
    ></div>
  </div>
</template>

<style scoped>
/* Layout: one centred column — eyebrow, shimmering question, two "doors" (side by side ≥ 720px, stacked on phones) over a dusk sky that is warm violet on the magic side and blue on the gadget side. */
.landing {
  --gold: #e3c27c;
  --cream: #f2e7c9;
  --mist: #aab1d8;
  --f-display: "Noto Serif TC", "Songti TC", serif;
  --f-latin: "Cinzel", "Times New Roman", serif;
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  display: grid;
  place-items: center;
  color: var(--cream);
  font-family: var(--f-display);
  line-height: 1.7;
  background:
    radial-gradient(ellipse at 12% 0%, #3a2766 0, transparent 55%),
    radial-gradient(ellipse at 90% 100%, #0f4670 0, transparent 55%),
    radial-gradient(ellipse at 50% 50%, #141836, #0b0d1f 75%);
}

/* motes */
.motes { position: absolute; inset: 0; pointer-events: none; }
.motes i { position: absolute; border-radius: 50%; background: #9ad8ff; box-shadow: 0 0 8px #9ad8ff; opacity: 0; animation: mote linear infinite; }
.motes i.gold { background: var(--gold); box-shadow: 0 0 8px var(--gold); }

.stage {
  position: relative; z-index: 1; width: 100%; max-width: 46rem;
  display: flex; flex-direction: column; align-items: center; gap: 1rem;
  padding: 3.5rem 16px 3rem; text-align: center;
  transition: opacity .6s ease, filter .6s ease;
}
.eyebrow { font-family: var(--f-latin); font-size: .78rem; letter-spacing: .4em; text-transform: uppercase; color: var(--gold); animation: rise .9s ease both; }
.question {
  margin: 0; font-size: clamp(1.55rem, 5.6vw, 2.5rem); font-weight: 700; letter-spacing: .06em; text-wrap: balance;
  background: linear-gradient(100deg, var(--cream) 0%, var(--cream) 40%, #fff 50%, var(--gold) 60%, var(--cream) 70%, var(--cream) 100%);
  background-size: 250% 100%; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: rise .9s .15s ease both, shimmer 5s 1.2s ease-in-out infinite;
}
.subtitle { margin: 0; color: var(--mist); animation: rise .9s .3s ease both; }

/* doors */
.doors { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; width: 100%; margin-top: 1.25rem; }
@media (max-width: 720px) { .doors { grid-template-columns: 1fr; max-width: 22rem; } }
.door {
  --c1: var(--gold); --c2: #8f6bd8;
  position: relative; overflow: hidden; isolation: isolate;
  display: flex; flex-direction: column; align-items: center; gap: .7rem;
  padding: 2rem 1.5rem 1.6rem; border-radius: 22px; border: 1px solid #ffffff1f;
  font: inherit; color: inherit; cursor: pointer; text-align: center;
  background: linear-gradient(160deg, #ffffff12, #ffffff05);
  backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 18px 40px #0007, inset 0 1px 0 #ffffff22;
  animation: rise .9s ease both;
  transition: translate .35s cubic-bezier(.2, .9, .3, 1.2), box-shadow .35s, border-color .35s, opacity .5s, scale .5s;
}
.door.gadget { --c1: #4fb6ff; --c2: #ffd84a; }
.door::before { /* colour wash */
  content: ""; position: absolute; inset: 0; z-index: -1; opacity: .18; transition: opacity .35s;
  background: radial-gradient(circle at 50% 0%, var(--c1), transparent 65%), radial-gradient(circle at 50% 120%, var(--c2), transparent 60%);
}
.door::after { /* light sweep */
  content: ""; position: absolute; top: -50%; bottom: -50%; left: -60%; width: 40%; z-index: 1; pointer-events: none;
  background: linear-gradient(90deg, transparent, #ffffff30, transparent); rotate: 20deg; translate: 0 0;
  animation: sweep 6s ease-in-out infinite;
}
.door.gadget::after { animation-delay: 3s; }
.door:hover, .door:focus-visible { translate: 0 -6px; border-color: color-mix(in srgb, var(--c1) 60%, transparent); box-shadow: 0 24px 50px #0008, 0 0 36px color-mix(in srgb, var(--c1) 35%, transparent), inset 0 1px 0 #ffffff33; }
.door:hover::before, .door:focus-visible::before { opacity: .32; }
.door:focus-visible { outline: 2px solid var(--c1); outline-offset: 4px; }
.door:disabled { cursor: default; }
.no { position: absolute; top: .9rem; left: 1.1rem; font-family: var(--f-latin); font-size: .8rem; letter-spacing: .2em; color: var(--c1); opacity: .8; }
.icon { width: 7.5rem; height: 7.5rem; filter: drop-shadow(0 8px 18px #0008); transition: scale .35s cubic-bezier(.2, .9, .3, 1.4); }
.door:hover .icon { scale: 1.06; }
.label { font-size: 1.25rem; font-weight: 700; letter-spacing: .08em; text-wrap: balance; }
.hint { font-size: .85rem; color: var(--mist); transition: color .3s, letter-spacing .3s; }
.door:hover .hint { color: var(--c1); letter-spacing: .06em; }
.twinkle { transform-box: fill-box; transform-origin: center; animation: twinkle 2.4s ease-in-out infinite; }
.twinkle.d2 { animation-delay: .8s; }
.twinkle.d3 { animation-delay: 1.6s; }
.glow { animation: twinkle 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }

/* choosing: chosen door glows, the other fades, then a portal of the next world's colour opens from the door */
.leaving .stage > :not(.doors) { opacity: 0; transition: opacity .5s; }
.leaving .door:not(.chosen) { opacity: 0; scale: .92; }
.door.chosen { translate: 0 -6px; scale: 1.05; border-color: var(--c1); box-shadow: 0 0 60px color-mix(in srgb, var(--c1) 55%, transparent), 0 24px 50px #0009; }
.door.chosen::before { opacity: .45; }
.portal {
  position: fixed; inset: 0; z-index: 5; pointer-events: none;
  clip-path: circle(0 at var(--x) var(--y));
  animation: portal 1s .35s cubic-bezier(.7, 0, .3, 1) forwards;
}

@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes shimmer { 0%, 100% { background-position: 100% 0; } 50% { background-position: 0 0; } }
@keyframes sweep { 0%, 60% { translate: 0 0; } 100% { translate: 520% 0; } }
@keyframes twinkle { 0%, 100% { opacity: .35; scale: .75; } 50% { opacity: 1; scale: 1.1; } }
@keyframes mote { 0% { opacity: 0; transform: translateY(0); } 20% { opacity: .9; } 80% { opacity: .6; } 100% { opacity: 0; transform: translateY(-90px); } }
@keyframes portal { to { clip-path: circle(150% at var(--x) var(--y)); } }
</style>
