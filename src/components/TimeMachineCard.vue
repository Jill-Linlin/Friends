<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { content as C, isTodo, type Era } from '@/data/cardContent'
import { prefersReducedMotion, saveReply, useRetrigger, useTimers } from '@/composables/useCardHelpers'

type Scene = 'boot' | 'corridor' | 'era' | 'capsule'

const TM = C.timeMachine
const ERAS = TM.eras
const reduce = prefersReducedMotion()
const { later, clearAll } = useTimers()
const PRESENT_YEAR = new Date().getFullYear()
const OPEN_YEAR = PRESENT_YEAR + TM.capsuleOpensInYears

/* ---------- gears ---------- */
function gearPath(teeth: number, rOut: number, rIn: number, rHole: number) {
  const step = (Math.PI * 2) / teeth
  const pt = (r: number, a: number) => `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`
  let d = ''
  for (let i = 0; i < teeth; i++) {
    const a = i * step
    d += `${i ? 'L' : 'M'}${pt(rIn, a)} L${pt(rOut, a + step * .2)} L${pt(rOut, a + step * .5)} L${pt(rIn, a + step * .7)} `
  }
  return `${d}Z M${rHole} 0 A${rHole} ${rHole} 0 1 0 ${-rHole} 0 A${rHole} ${rHole} 0 1 0 ${rHole} 0 Z`
}
const GEAR_BIG = gearPath(14, 50, 42, 12)
const GEAR_SMALL = gearPath(9, 30, 24, 8)

/** gear speed follows the machine's state */
const engine = ref<'idle' | 'charge' | 'warp'>('idle')
const spin = computed(() => ({ idle: '26s', charge: '2.4s', warp: '.7s' })[engine.value])

/* ---------- scene routing ---------- */
const scene = ref<Scene>('boot')
const go = (s: Scene) => { scene.value = s }
const sel = ref(0)
const era = computed<Era>(() => ERAS[sel.value]!)
const imprints = reactive(new Set<number>())
const allDone = computed(() => imprints.size === ERAS.length)

/* ---------- 1. boot: time-coordinate keypad ---------- */
const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'GO']
const code = ref('')
const bootMsg = ref('')
const booting = ref(false)
let wrongs = 0
const { active: bootShaking, fire: shakeBoot } = useRetrigger()
const ledCoord = computed(() => {
  const d = code.value.padEnd(8, ' ')
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`
})

function pressKey(k: string) {
  if (k === '⌫') return backspace()
  if (k === 'GO') return engage()
  if (booting.value || code.value.length >= 8) return
  code.value += k
  bootMsg.value = ''
}
function backspace() {
  if (!booting.value) code.value = code.value.slice(0, -1)
}
function engage() {
  if (booting.value) return
  if (!code.value) { bootMsg.value = '請先輸入時光座標。'; return }
  if (TM.coordinate.answers.includes(code.value)) {
    booting.value = true
    bootMsg.value = ''
    engine.value = 'charge'
    later(() => { engine.value = 'idle'; booting.value = false; go('corridor') }, reduce ? 50 : 2600)
  } else {
    const h = TM.coordinate.hints
    bootMsg.value = h[Math.min(wrongs++, h.length - 1)]!
    code.value = ''
    shakeBoot()
  }
}

/* ---------- 2. corridor: gauge, odometer, lever ---------- */
const angleOf = (i: number) => (ERAS.length === 1 ? 0 : -70 + (140 * i) / (ERAS.length - 1))
const polar = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180
  return { x: 120 + r * Math.sin(a), y: 130 - r * Math.cos(a) }
}
const MINOR_TICKS = Array.from({ length: 17 }, (_, i) => -80 + i * 10)
const yearChars = computed(() => [...era.value.year])

const pulling = ref(false)
function pullLever() {
  if (pulling.value) return
  pulling.value = true
  later(() => { sel.value = (sel.value + 1) % ERAS.length }, reduce ? 0 : 280)
  later(() => { pulling.value = false }, reduce ? 0 : 720)
}

const warpKey = ref(0)
function depart() {
  engine.value = 'warp'
  warpKey.value++
  later(() => { engine.value = 'idle'; openEra(sel.value) }, reduce ? 50 : 950)
  later(() => { warpKey.value = 0 }, reduce ? 60 : 1500)
}

/* ---------- 3. era: puzzles ---------- */
const puz = reactive({
  solved: false,
  collected: false,
  msg: '',
  dialed: '',
  dialRot: 0,
  dialDur: 0,
  dialBusy: false,
  knob: 0,
  switches: [] as boolean[],
})
const { active: puzShaking, fire: shakePuz } = useRetrigger()

const dialP = computed(() => (era.value.puzzle.type === 'dial' ? era.value.puzzle : null))
const knobP = computed(() => (era.value.puzzle.type === 'knob' ? era.value.puzzle : null))
const switchP = computed(() => (era.value.puzzle.type === 'switches' ? era.value.puzzle : null))

function openEra(i: number) {
  sel.value = i
  const p = ERAS[i]!.puzzle
  const has = imprints.has(i)
  Object.assign(puz, {
    solved: has, collected: has, msg: '', dialed: '', dialRot: 0, dialDur: 0, dialBusy: false, knob: 0,
    switches: p.type === 'switches' ? p.statements.map(() => false) : [],
  })
  go('era')
}
function solve() { puz.solved = true; puz.msg = '' }
function wrong(msg: string) {
  puz.msg = `${msg}${era.value.puzzle.hint}`
  shakePuz()
}
function collect() {
  imprints.add(sel.value)
  puz.collected = true
}

/* rotary dial: hole k (1…9, 10 = "0") turns clockwise until it reaches the finger stop */
const DIAL_HOLES = Array.from({ length: 10 }, (_, i) => {
  const k = i + 1
  const a = ((60 - 30 * (k + 1)) * Math.PI) / 180
  return { k, digit: String(k % 10), x: 100 + 66 * Math.cos(a), y: 100 + 66 * Math.sin(a) }
})
function dial(k: number) {
  if (puz.dialBusy || puz.dialed.length >= 8) return
  puz.dialBusy = true
  const t = reduce ? 0 : 0.12 + 0.07 * (k + 1)
  puz.dialDur = t
  puz.dialRot = 30 * (k + 1)
  later(() => {
    puz.dialed += String(k % 10)
    puz.msg = ''
    puz.dialDur = t * 1.4
    puz.dialRot = 0
    later(() => { puz.dialBusy = false }, puz.dialDur * 1000)
  }, t * 1000 + 60)
}
function submitDial() {
  if (!dialP.value || puz.dialBusy) return
  if (!puz.dialed) { puz.msg = '先撥號再送出。'; return }
  if (puz.dialed === dialP.value.answer) return solve()
  puz.dialed = ''
  wrong('撥錯號碼了。')
}

/* selector knob */
const knobAngle = (i: number, n: number) => (n === 1 ? 0 : -60 + (120 * i) / (n - 1))
const knobMark = (i: number, n: number) => {
  const a = (knobAngle(i, n) * Math.PI) / 180
  return { left: `${50 + 47 * Math.sin(a)}%`, top: `${50 - 47 * Math.cos(a)}%` }
}
function turnKnob(d: number) {
  if (!knobP.value) return
  const n = knobP.value.options.length
  puz.knob = (puz.knob + d + n) % n
  puz.msg = ''
}
function submitKnob() {
  if (!knobP.value) return
  if (puz.knob === knobP.value.correctIndex) return solve()
  wrong('頻率不對，只收到雜訊。')
}

/* toggle switches */
function submitSwitches() {
  if (!switchP.value) return
  const off = switchP.value.correct.filter((c, i) => c !== puz.switches[i]).length
  if (!off) return solve()
  wrong(`電路不通：還有 ${off} 個開關不對。`)
}

/* ---------- 4. capsule ---------- */
const cap = reactive({ phase: 'loading' as 'loading' | 'ready' | 'letter' | 'sealed' })
const reply = ref('')
const replyMsg = ref('')
function openCapsule() {
  cap.phase = 'loading'
  go('capsule')
  later(() => { cap.phase = 'ready' }, reduce ? 0 : 900 + ERAS.length * 350)
}
function seal() {
  const v = reply.value.trim()
  if (!v) { replyMsg.value = '先寫下想說的話，再封存膠囊。'; return }
  saveReply('time-machine-reply', v)
  replyMsg.value = ''
  cap.phase = 'sealed'
  engine.value = 'charge'
  later(() => { engine.value = 'idle' }, reduce ? 0 : 2000)
}

/* ---------- reset / dev jumps ---------- */
function resetAll() {
  clearAll()
  engine.value = 'idle'
  booting.value = false
  code.value = ''
  bootMsg.value = ''
  wrongs = 0
  imprints.clear()
  sel.value = 0
  warpKey.value = 0
  reply.value = ''
  replyMsg.value = ''
  go('boot')
}
const fillImprints = () => ERAS.forEach((_, i) => imprints.add(i))
const devOpen = ref(false)
const DEV: [string, () => void][] = [
  ['1. 啟動時光機', resetAll],
  ['2. 時光迴廊', () => go('corridor')],
  ...ERAS.map((e, i) => [`　└ ${e.label}`, () => openEra(i)] as [string, () => void]),
  ['（集滿回憶印記）', () => { fillImprints(); go('corridor') }],
  ['3. 時光膠囊', () => { fillImprints(); openCapsule() }],
]
function devJump(fn: () => void) { devOpen.value = false; fn() }

/* ---------- keyboard for the keypad ---------- */
function onKey(e: KeyboardEvent) {
  if (scene.value !== 'boot') return
  const el = e.target as HTMLElement
  if (el.matches('input, textarea')) return
  if (/^\d$/.test(e.key)) { e.preventDefault(); pressKey(e.key) }
  else if (e.key === 'Backspace') { e.preventDefault(); backspace() }
  else if (e.key === 'Enter' && !el.closest('button, a')) { e.preventDefault(); engage() }
}
onMounted(() => addEventListener('keydown', onKey))
onBeforeUnmount(() => removeEventListener('keydown', onKey))
</script>

<template>
  <div class="tm-card" :style="{ '--spin': spin }">
    <!-- background machinery -->
    <svg class="bg-gear g1" viewBox="-55 -55 110 110" aria-hidden="true"><path :d="GEAR_BIG" fill-rule="evenodd" /></svg>
    <svg class="bg-gear g2 ccw" viewBox="-55 -55 110 110" aria-hidden="true"><path :d="GEAR_BIG" fill-rule="evenodd" /></svg>
    <svg class="bg-gear g3" viewBox="-35 -35 70 70" aria-hidden="true"><path :d="GEAR_SMALL" fill-rule="evenodd" /></svg>

    <nav class="dev" aria-label="場景目錄（原型測試用）">
      <button :aria-expanded="devOpen" @click="devOpen = !devOpen">SCENES</button>
      <ul v-if="devOpen">
        <li v-for="[t, fn] in DEV" :key="t"><button @click="devJump(fn)">{{ t }}</button></li>
      </ul>
    </nav>

    <main class="wrap">
      <header class="brand">
        <svg class="mini-gear" viewBox="-35 -35 70 70" aria-hidden="true"><path :d="GEAR_SMALL" fill-rule="evenodd" /></svg>
        <div>
          <div class="plate">CHRONO-LINK · MODEL 1985</div>
          <div class="brand-title">時光機</div>
        </div>
        <svg class="mini-gear ccw" viewBox="-35 -35 70 70" aria-hidden="true"><path :d="GEAR_SMALL" fill-rule="evenodd" /></svg>
      </header>

      <!-- 1. Boot -->
      <section v-if="scene === 'boot'" class="scene">
        <div class="panel">
          <div class="panel-head">
            <span class="plate">TIME COORDINATE</span>
            <span class="lamp" :class="{ on: booting }" aria-hidden="true"></span>
          </div>
          <h1>給 <span :class="{ ph: isTodo(C.friendName) }">{{ C.friendName }}</span> 的時光機</h1>
          <p class="question"><span :class="{ ph: isTodo(TM.coordinate.question) }">{{ TM.coordinate.question }}</span></p>

          <div class="led big" :class="{ flicker: booting, shake: bootShaking }" data-ghost="8888.88.88" role="status" :aria-label="`已輸入 ${code || '無'}`">{{ ledCoord }}</div>
          <div class="caption">YEAR · MONTH · DAY</div>

          <div class="keypad">
            <button
              v-for="k in KEYPAD" :key="k" class="key" :class="{ go: k === 'GO', back: k === '⌫' }"
              :aria-label="k === '⌫' ? '刪除' : k === 'GO' ? '啟動' : k" @click="pressKey(k)"
            >{{ k }}</button>
          </div>

          <p class="msg" role="status">{{ bootMsg }}</p>
          <div v-if="booting" class="charge"><i></i><span>TIME CIRCUITS ON</span></div>
          <p v-if="TM.coordinate.prototypeNote" class="note">{{ TM.coordinate.prototypeNote }}</p>
        </div>
      </section>

      <!-- 2. Corridor -->
      <section v-else-if="scene === 'corridor'" class="scene">
        <div class="panel">
          <div class="hud">
            <div><span class="plate sm">DESTINATION</span><span class="led" :data-ghost="'8'.repeat(era.year.length)">{{ era.year }}</span></div>
            <div><span class="plate sm">PRESENT</span><span class="led green" data-ghost="8888">{{ PRESENT_YEAR }}</span></div>
            <div><span class="plate sm">IMPRINTS</span><span class="led red" data-ghost="8/8">{{ imprints.size }}/{{ ERAS.length }}</span></div>
          </div>

          <h2>時光迴廊</h2>
          <p class="sub">拉下拉桿或轉動指針，選一個年代出發。</p>

          <svg class="gauge" viewBox="0 0 240 150" role="img" :aria-label="`年代指針：${era.label}`">
            <defs>
              <radialGradient id="tm-face" cx="50%" cy="90%" r="80%">
                <stop offset="0" stop-color="#fbf4df" /><stop offset="1" stop-color="#d9c99f" />
              </radialGradient>
            </defs>
            <path d="M6 132 A114 114 0 0 1 234 132 Z" fill="#1a1d20" />
            <path d="M12 130 A108 108 0 0 1 228 130 Z" fill="url(#tm-face)" />
            <line
              v-for="a in MINOR_TICKS" :key="a"
              :x1="polar(94, a).x" :y1="polar(94, a).y" :x2="polar(100, a).x" :y2="polar(100, a).y"
              stroke="#5a4a30" stroke-width="1"
            />
            <g v-for="(e, i) in ERAS" :key="i" class="era-mark" :class="{ cur: i === sel }" @click="sel = i">
              <line :x1="polar(84, angleOf(i)).x" :y1="polar(84, angleOf(i)).y" :x2="polar(100, angleOf(i)).x" :y2="polar(100, angleOf(i)).y" stroke-width="3" />
              <text :x="polar(68, angleOf(i)).x" :y="polar(68, angleOf(i)).y + 4" text-anchor="middle">{{ e.label }}</text>
              <circle v-if="imprints.has(i)" :cx="polar(106, angleOf(i)).x" :cy="polar(106, angleOf(i)).y" r="3" fill="#4dff9a" />
            </g>
            <text x="120" y="112" text-anchor="middle" class="gauge-label">ERA</text>
            <g class="needle" :style="{ transform: `rotate(${angleOf(sel)}deg)` }">
              <path d="M117.5 130 L120 34 L122.5 130 Z" fill="#c9241a" />
            </g>
            <circle cx="120" cy="130" r="9" fill="#c9a24a" stroke="#5a431a" stroke-width="2" />
            <path d="M24 120 A100 100 0 0 1 120 30" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="6" stroke-linecap="round" />
          </svg>

          <div class="odo-row">
            <div class="odo" :aria-label="`年代計數器 ${era.year}`">
              <span v-for="(ch, i) in yearChars" :key="i" class="reel">
                <span
                  v-if="/\d/.test(ch)" class="strip"
                  :style="{ transform: `translateY(-${Number(ch)}em)`, transitionDelay: `${i * .12}s` }"
                ><span v-for="n in 10" :key="n">{{ n - 1 }}</span></span>
                <span v-else>{{ ch }}</span>
              </span>
            </div>
            <button class="lever" :class="{ pull: pulling }" aria-label="拉下拉桿，切換到下一個年代" @click="pullLever">
              <span class="arm"><i class="ball"></i></span>
              <span class="lever-base"></span>
            </button>
          </div>

          <div class="era-btns" role="group" aria-label="選擇年代">
            <button v-for="(e, i) in ERAS" :key="i" class="era-btn" :class="{ cur: i === sel }" :aria-pressed="i === sel" @click="sel = i">
              <span class="lamp" :class="{ on: imprints.has(i) }" aria-hidden="true"></span>{{ e.label }}
            </button>
          </div>

          <button class="btn primary" @click="depart">啟動躍遷 → {{ era.label }}</button>
          <button v-if="allDone" class="btn gold" @click="openCapsule">回憶印記到齊・前往時光膠囊</button>
        </div>
      </section>

      <!-- 3. Era -->
      <section v-else-if="scene === 'era'" class="scene">
        <div class="panel">
          <div class="hud">
            <div><span class="plate sm">DESTINATION</span><span class="led" :data-ghost="'8'.repeat(era.year.length)">{{ era.year }}</span></div>
            <div><span class="plate sm">PRESENT</span><span class="led green" data-ghost="8888">{{ PRESENT_YEAR }}</span></div>
            <div><span class="plate sm">IMPRINTS</span><span class="led red" data-ghost="8/8">{{ imprints.size }}/{{ ERAS.length }}</span></div>
          </div>
          <div class="panel-head"><span class="plate">ERA {{ sel + 1 }} · {{ era.year }}</span></div>
          <h2>{{ era.label }}</h2>

          <!-- puzzle -->
          <template v-if="!puz.solved">
            <!-- rotary dial -->
            <template v-if="dialP">
              <p class="question"><span :class="{ ph: isTodo(dialP.question) }">{{ dialP.question }}</span></p>
              <div class="led" :class="{ shake: puzShaking }" data-ghost="88888888">{{ puz.dialed.padEnd(8, ' ') }}</div>
              <svg class="dial" viewBox="0 0 200 200" role="group" aria-label="撥號盤">
                <defs>
                  <mask id="tm-dial-mask">
                    <circle cx="100" cy="100" r="92" fill="#fff" />
                    <circle v-for="h in DIAL_HOLES" :key="h.k" :cx="h.x" :cy="h.y" r="14" fill="#000" />
                  </mask>
                  <radialGradient id="tm-dial-metal" cx="40%" cy="35%" r="75%">
                    <stop offset="0" stop-color="#5b6168" /><stop offset="1" stop-color="#1f2226" />
                  </radialGradient>
                </defs>
                <circle cx="100" cy="100" r="96" fill="#efe6cf" stroke="#1a1d20" stroke-width="3" />
                <text v-for="h in DIAL_HOLES" :key="h.k" :x="h.x" :y="h.y + 6" text-anchor="middle" class="dial-digit">{{ h.digit }}</text>
                <g class="wheel" :style="{ transform: `rotate(${puz.dialRot}deg)`, transition: `transform ${puz.dialDur}s ${puz.dialRot ? 'ease-out' : 'linear'}` }">
                  <circle cx="100" cy="100" r="92" fill="url(#tm-dial-metal)" mask="url(#tm-dial-mask)" />
                  <circle cx="100" cy="100" r="38" fill="#c9a24a" stroke="#5a431a" stroke-width="2" />
                  <text x="100" y="97" text-anchor="middle" class="hub-text">TIME</text>
                  <text x="100" y="111" text-anchor="middle" class="hub-text">PHONE</text>
                </g>
                <path d="M146 166 L158 186" stroke="#c9a24a" stroke-width="7" stroke-linecap="round" />
                <circle
                  v-for="h in DIAL_HOLES" :key="h.k" class="hit" :cx="h.x" :cy="h.y" r="14"
                  role="button" tabindex="0" :aria-label="`撥 ${h.digit}`"
                  @click="dial(h.k)" @keydown.enter.space.prevent="dial(h.k)"
                />
              </svg>
              <div class="row">
                <button class="btn ghost" @click="puz.dialed = ''; puz.msg = ''">清除</button>
                <button class="btn primary" @click="submitDial">撥出</button>
              </div>
            </template>

            <!-- selector knob -->
            <template v-else-if="knobP">
              <p class="question"><span :class="{ ph: isTodo(knobP.question) }">{{ knobP.question }}</span></p>
              <div class="knob-wrap" :class="{ shake: puzShaking }">
                <button
                  v-for="(_, i) in knobP.options" :key="i" class="knob-mark" :class="{ cur: puz.knob === i }"
                  :style="knobMark(i, knobP.options.length)" :aria-label="`選項 ${'ABCDEFGH'[i]}`" @click="puz.knob = i; puz.msg = ''"
                >{{ 'ABCDEFGH'[i] }}</button>
                <button
                  class="knob" :style="{ rotate: `${knobAngle(puz.knob, knobP.options.length)}deg` }"
                  aria-label="轉動旋鈕" @click="turnKnob(1)"
                ></button>
              </div>
              <ol class="legend">
                <li v-for="(o, i) in knobP.options" :key="i">
                  <button class="opt" :class="{ cur: puz.knob === i }" @click="puz.knob = i; puz.msg = ''">
                    <b>{{ 'ABCDEFGH'[i] }}</b><span :class="{ ph: isTodo(o) }">{{ o }}</span>
                  </button>
                </li>
              </ol>
              <div class="row">
                <button class="key-sm" aria-label="向左轉" @click="turnKnob(-1)">◀</button>
                <button class="btn primary" @click="submitKnob">鎖定頻率</button>
                <button class="key-sm" aria-label="向右轉" @click="turnKnob(1)">▶</button>
              </div>
            </template>

            <!-- toggle switches -->
            <template v-else-if="switchP">
              <p class="question"><span :class="{ ph: isTodo(switchP.question) }">{{ switchP.question }}</span></p>
              <ul class="switches" :class="{ shake: puzShaking }">
                <li v-for="(s, i) in switchP.statements" :key="i" class="sw-row">
                  <button
                    class="toggle" role="switch" :aria-checked="puz.switches[i]" :aria-label="s"
                    @click="puz.switches[i] = !puz.switches[i]; puz.msg = ''"
                  ></button>
                  <span class="sw-text" :class="{ ph: isTodo(s) }">{{ s }}</span>
                  <span class="lamp" :class="{ on: puz.switches[i] }" aria-hidden="true"></span>
                </li>
              </ul>
              <button class="btn primary" @click="submitSwitches">接通電路</button>
            </template>

            <p class="msg" role="status">{{ puz.msg }}</p>
            <button class="btn ghost" @click="go('corridor')">← 返回時光迴廊</button>
          </template>

          <!-- memory unlocked -->
          <template v-else>
            <div class="scan">
              <img v-if="era.photo" class="scan-img" :src="era.photo" :alt="`${era.label}時期的照片`">
              <div v-else class="scan-img">【待放：{{ era.label }}時期的照片】</div>
              <span class="date-stamp">'{{ era.year.slice(-2) }}</span>
              <span class="scan-cap">{{ era.label }}</span>
              <span class="scanline" aria-hidden="true"></span>
            </div>
            <p class="memory"><span :class="{ ph: isTodo(era.memory) }">{{ era.memory }}</span></p>
            <template v-if="!puz.collected">
              <button class="btn gold" @click="collect">收下回憶印記</button>
            </template>
            <template v-else>
              <div class="imprint stamp"><b>{{ era.label }}</b><small>{{ era.year }}</small></div>
              <p class="sub">{{ allDone ? '所有回憶印記都到齊了！' : `已收集 ${imprints.size} / ${ERAS.length} 枚回憶印記` }}</p>
              <button class="btn primary" @click="go('corridor')">返回時光迴廊</button>
            </template>
          </template>
        </div>
      </section>

      <!-- 4. Capsule -->
      <section v-else-if="scene === 'capsule'" class="scene">
        <div class="panel">
          <div class="panel-head"><span class="plate">TIME CAPSULE</span></div>
          <h2>{{ cap.phase === 'sealed' ? '時光膠囊已封存' : '把回憶印記存入時光膠囊' }}</h2>

          <div class="capsule" :class="{ sealed: cap.phase === 'sealed' }">
            <div class="cap-end top"></div>
            <div class="cap-body">
              <div class="porthole">
                <div class="inside">
                  <div v-for="(e, i) in ERAS" :key="i" class="imprint mini drop" :style="{ animationDelay: `${.4 + i * .35}s` }">
                    <b>{{ e.label }}</b><small>{{ e.year }}</small>
                  </div>
                </div>
                <div class="shutter"></div>
              </div>
            </div>
            <div class="cap-end bottom"></div>
          </div>

          <div class="led" :class="cap.phase === 'sealed' ? 'green' : 'red'">
            {{ cap.phase === 'sealed' ? `SEALED · OPEN ${OPEN_YEAR}` : `LOADED ${ERAS.length}/${ERAS.length}` }}
          </div>

          <button v-if="cap.phase === 'ready'" class="btn primary" @click="cap.phase = 'letter'">讀取來自過去的信</button>

          <template v-if="cap.phase === 'letter' || cap.phase === 'sealed'">
            <div class="letter">
              <p>親愛的 <span :class="{ ph: isTodo(C.friendName) }">{{ C.friendName }}</span>：</p>
              <p v-for="(line, i) in [C.letter.opening, C.letter.middle, C.letter.closing]" :key="i"><span :class="{ ph: isTodo(line) }">{{ line }}</span></p>
              <p class="sign">
                —— <span :class="{ ph: isTodo(C.letter.signature) }">{{ C.letter.signature }}</span>，<span :class="{ ph: isTodo(C.letter.date) }">{{ C.letter.date }}</span>
              </p>
            </div>
          </template>

          <template v-if="cap.phase === 'letter'">
            <label for="tmReply" class="plate">寫給 {{ C.myName }}，一起放進膠囊</label>
            <textarea id="tmReply" v-model="reply" :placeholder="C.replyPlaceholder" @input="replyMsg = ''"></textarea>
            <button class="btn gold" @click="seal">封存時光膠囊</button>
            <p class="msg" role="status">{{ replyMsg }}</p>
          </template>

          <template v-if="cap.phase === 'sealed'">
            <p class="final"><span :class="{ ph: isTodo(C.finalLine) }">{{ C.finalLine }}</span></p>
            <p class="sub">膠囊將在 {{ OPEN_YEAR }} 年再次開啟。（原型：留言目前只存在這台裝置上）</p>
            <button class="btn ghost" @click="resetAll">重新啟動時光機</button>
          </template>
        </div>
      </section>
    </main>

    <div v-if="warpKey" :key="warpKey" class="warp" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
/* Layout: a retro-future machine. Brushed-metal panels with rivets and amber LEDs sit over slowly turning gears; one centered column (max 34rem), one scene at a time. Single dark look by design. */
.tm-card {
  --bg: #15120e;
  --metal-1: #4b5157;
  --metal-2: #2c3035;
  --brass: #c9a24a;
  --brass-hi: #f0d68a;
  --brass-lo: #7a5c22;
  --amber: #ffb02e;
  --red-led: #ff4a3d;
  --green-led: #4dff9a;
  --cream: #efe6cf;
  --ink: #2a2116;
  --text: #e9e2d0;
  --muted: #a39a86;
  --f-led: "Share Tech Mono", "Consolas", monospace;
  --f-label: "Orbitron", "Arial Black", sans-serif;
  --f-body: "Noto Serif TC", "Songti TC", serif;
  --f-hand: "LXGW WenKai TC", "Kaiti TC", "KaiTi", serif;
  color-scheme: dark;
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  color: var(--text);
  font-family: var(--f-body);
  font-size: 16px;
  line-height: 1.7;
  background:
    repeating-linear-gradient(45deg, #ffffff05 0 2px, transparent 2px 7px),
    radial-gradient(ellipse at 50% 0%, #2c251b, var(--bg) 70%);
  background-attachment: fixed;
}
button { font: inherit; color: inherit; cursor: pointer; }
:focus-visible { outline: 2px solid var(--amber); outline-offset: 3px; }
h1, h2 { margin: 0; font-weight: 700; letter-spacing: .06em; text-wrap: balance; }
h1 { font-size: clamp(1.5rem, 6vw, 2rem); }
h2 { font-size: 1.5rem; color: var(--brass-hi); }
p { margin: 0; }
.ph { color: var(--amber); border-bottom: 1px dashed #ffb02e88; }

/* gears */
.bg-gear { position: fixed; pointer-events: none; fill: #2e2820; stroke: #3d3528; stroke-width: 1; animation: spin var(--spin) linear infinite; }
.bg-gear.g1 { width: 300px; top: -90px; right: -90px; }
.bg-gear.g2 { width: 220px; bottom: -70px; left: -70px; }
.bg-gear.g3 { width: 120px; top: 44%; right: -40px; }
.ccw { animation-direction: reverse !important; }
.mini-gear { width: 2.6rem; fill: var(--brass); stroke: var(--brass-lo); stroke-width: 2; animation: spin var(--spin) linear infinite; }

.wrap { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; align-items: center; gap: 1.25rem; padding: 4.5rem 16px 2.5rem; }
.brand { display: flex; align-items: center; gap: .9rem; text-align: center; }
.brand-title { font-size: 1.6rem; font-weight: 700; letter-spacing: .4em; color: var(--brass-hi); text-shadow: 0 2px 0 #000; margin-top: .2rem; }
.scene { width: 100%; display: flex; justify-content: center; animation: fadeIn .7s ease both; }

/* panel */
.panel {
  position: relative; width: 100%; max-width: 34rem;
  display: flex; flex-direction: column; align-items: center; gap: 1.1rem; text-align: center;
  padding: 1.75rem 1.25rem 2rem; border-radius: 16px;
  background:
    radial-gradient(circle at 14px 14px, #c8ccd0 0 2.5px, #1c1f22 3px 4px, transparent 4.5px),
    radial-gradient(circle at calc(100% - 14px) 14px, #c8ccd0 0 2.5px, #1c1f22 3px 4px, transparent 4.5px),
    radial-gradient(circle at 14px calc(100% - 14px), #c8ccd0 0 2.5px, #1c1f22 3px 4px, transparent 4.5px),
    radial-gradient(circle at calc(100% - 14px) calc(100% - 14px), #c8ccd0 0 2.5px, #1c1f22 3px 4px, transparent 4.5px),
    repeating-linear-gradient(90deg, #ffffff06 0 1px, transparent 1px 3px),
    linear-gradient(160deg, var(--metal-1), var(--metal-2));
  box-shadow: inset 0 1px 0 #7d848b, inset 0 -3px 0 #121416, 0 0 0 2px #0d0f11, 0 18px 40px #000a;
}
.panel-head { display: flex; align-items: center; gap: .6rem; }
.plate {
  display: inline-block; font-family: var(--f-label); font-size: .65rem; font-weight: 700; letter-spacing: .2em;
  color: #2a1f0a; padding: .2rem .7rem; border-radius: 3px;
  background: linear-gradient(#e2c26e, #a07c2c); text-shadow: 0 1px 0 #f3dc94;
  box-shadow: 0 1px 0 #000, inset 0 1px 0 #fbe7a8;
}
.plate.sm { font-size: .5rem; letter-spacing: .14em; padding: .15rem .45rem; }
.question { max-width: 26rem; font-size: 1.05rem; }
.sub, .note, .caption { color: var(--muted); font-size: .9rem; }
.caption { font-family: var(--f-label); font-size: .55rem; letter-spacing: .3em; margin-top: -.6rem; }
.note { font-size: .8rem; }
.msg { min-height: 1.6em; color: var(--red-led); font-size: .95rem; text-shadow: 0 0 6px #ff4a3d66; max-width: 26rem; }
.row { display: flex; gap: .75rem; align-items: center; justify-content: center; flex-wrap: wrap; }

/* LED displays: lit digits over dim "8" ghosts */
.led {
  position: relative; isolation: isolate; display: inline-block;
  font-family: var(--f-led); font-size: 1.35rem; line-height: 1.2; letter-spacing: .08em; white-space: pre;
  color: var(--amber); text-shadow: 0 0 4px var(--amber), 0 0 12px #ff8a0080;
  background: #0d0904; padding: .35rem .8rem; border-radius: 6px;
  box-shadow: inset 0 2px 6px #000, 0 0 0 2px #1a1510, 0 0 0 3px #4a3f2f;
}
.led::before { content: attr(data-ghost); position: absolute; left: .8rem; top: .35rem; z-index: -1; color: #ffb02e14; text-shadow: none; }
.led.big { font-size: clamp(1.7rem, 8vw, 2.5rem); padding: .4rem 1rem; }
.led.big::before { left: 1rem; top: .4rem; }
.led.red { color: var(--red-led); text-shadow: 0 0 4px var(--red-led), 0 0 12px #ff4a3d80; }
.led.red::before { color: #ff4a3d14; }
.led.green { color: var(--green-led); text-shadow: 0 0 4px var(--green-led), 0 0 12px #4dff9a80; }
.led.green::before { color: #4dff9a14; }
.flicker { animation: flicker .12s steps(2) infinite; }
.lamp { flex: none; width: 10px; height: 10px; border-radius: 50%; background: #3a1a12; box-shadow: inset 0 1px 2px #000, 0 0 0 1px #0008; transition: background .2s, box-shadow .2s; }
.lamp.on { background: var(--green-led); box-shadow: 0 0 8px var(--green-led), 0 0 0 1px #0008; }

/* keypad */
.keypad { display: grid; grid-template-columns: repeat(3, 1fr); gap: .6rem; width: 100%; max-width: 15rem; }
.key, .key-sm {
  border: none; border-radius: 8px; font-family: var(--f-led); font-size: 1.4rem; color: #222;
  background: linear-gradient(#f1ecdf, #bdb6a6); box-shadow: 0 4px 0 #6d685d, 0 6px 10px #0006;
  transition: translate .06s, box-shadow .06s;
}
.key { height: 3.1rem; }
.key-sm { width: 2.8rem; height: 2.6rem; font-size: 1rem; }
.key:active, .key-sm:active { translate: 0 3px; box-shadow: 0 1px 0 #6d685d, 0 2px 4px #0006; }
.key.back { background: linear-gradient(#9aa0a6, #5f656b); color: #111; }
.key.go { font-family: var(--f-label); font-size: .8rem; font-weight: 700; color: #2a1300; background: linear-gradient(#ffcf6a, #e08a1e); box-shadow: 0 4px 0 #8a4f0c, 0 6px 10px #0006; }
.charge { width: 100%; max-width: 18rem; display: flex; flex-direction: column; gap: .4rem; }
.charge i { display: block; height: 10px; border-radius: 5px; background: linear-gradient(90deg, var(--amber), #fff3c4); box-shadow: 0 0 10px var(--amber); animation: charge 2.4s ease-in both; }
.charge span { font-family: var(--f-label); font-size: .65rem; letter-spacing: .3em; color: var(--amber); }

/* buttons */
.btn { border: none; border-radius: 10px; padding: .7rem 1.4rem; font-family: var(--f-body); font-weight: 700; letter-spacing: .1em; transition: translate .08s, box-shadow .08s; }
.btn.primary { background: linear-gradient(#ffcf6a, #e08a1e); color: #2a1300; box-shadow: 0 4px 0 #8a4f0c, 0 8px 16px #0006; }
.btn.gold { background: linear-gradient(#f0d68a, #b8902f); color: #2a1f0a; box-shadow: 0 4px 0 #6b4f17, 0 8px 16px #0006; }
.btn.primary:active, .btn.gold:active { translate: 0 3px; box-shadow: 0 1px 0 #6b4f17; }
.btn.ghost { background: transparent; color: var(--muted); border: 1px solid #ffffff22; font-weight: 400; }
.btn.ghost:hover { color: var(--brass-hi); border-color: var(--brass); }

/* HUD */
.hud { display: grid; grid-template-columns: repeat(3, 1fr); gap: .5rem; width: 100%; }
.hud > div { display: flex; flex-direction: column; align-items: center; gap: .35rem; }
.hud .led { font-size: 1.05rem; padding: .2rem .5rem; }
.hud .led::before { left: .5rem; top: .2rem; }

/* gauge */
.gauge { width: 100%; max-width: 22rem; }
.era-mark { cursor: pointer; stroke: #5a4a30; }
.era-mark text { font-family: var(--f-body); font-size: 12px; font-weight: 700; fill: #5a4a30; stroke: none; }
.era-mark.cur { stroke: #c9241a; }
.era-mark.cur text { fill: #c9241a; }
.gauge-label { font-family: var(--f-label); font-size: 8px; letter-spacing: .3em; fill: #8a7650; }
.needle { transform-origin: 120px 130px; transition: transform .9s cubic-bezier(.34, 1.56, .64, 1); }

/* odometer + lever */
.odo-row { display: flex; align-items: flex-end; justify-content: center; gap: 1.25rem; }
.odo { display: flex; gap: 4px; padding: 6px; border-radius: 8px; background: #0b0b0b; font-family: var(--f-led); font-size: 2.4rem; line-height: 1; box-shadow: inset 0 2px 6px #000, 0 0 0 2px #1a1d20, 0 0 0 4px var(--brass-lo); }
.reel { position: relative; width: .72em; height: 1em; overflow: hidden; border-radius: 3px; color: #f4efe2; background: linear-gradient(#111, #2c2c2c 50%, #111); box-shadow: inset 0 7px 6px -5px #000, inset 0 -7px 6px -5px #000; text-align: center; }
.strip { display: flex; flex-direction: column; transition: transform .9s cubic-bezier(.2, .9, .3, 1.15); }
.strip span { height: 1em; }
.lever { position: relative; width: 3.4rem; height: 7rem; border: none; background: none; padding: 0; }
.lever-base { position: absolute; left: 50%; bottom: 0; translate: -50% 0; width: 2.6rem; height: 2.2rem; border-radius: 8px; background: linear-gradient(160deg, #6b7279, #2a2e33); box-shadow: inset 0 1px 0 #9aa1a8, 0 4px 8px #0008; }
.arm { position: absolute; left: 50%; bottom: 1.5rem; width: 8px; height: 4.3rem; margin-left: -4px; border-radius: 4px; background: linear-gradient(90deg, #777, #eee, #888); transform-origin: 50% 100%; }
.ball { position: absolute; top: -14px; left: 50%; translate: -50% 0; width: 26px; height: 26px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #ff9b8a, #c9241a 55%, #6e0e08); box-shadow: 0 3px 6px #0008; }
.lever.pull .arm { animation: pull .7s ease-in-out; }
.era-btns { display: flex; flex-wrap: wrap; justify-content: center; gap: .5rem; }
.era-btn { display: flex; align-items: center; gap: .45rem; padding: .3rem .85rem; border-radius: 999px; background: #1d2024; border: 1px solid #ffffff22; font-size: .9rem; }
.era-btn.cur { border-color: var(--amber); color: var(--amber); }

/* rotary dial */
.dial { width: min(100%, 17rem); touch-action: manipulation; }
.dial-digit { font-family: var(--f-led); font-size: 17px; fill: var(--ink); }
.wheel { transform-origin: 100px 100px; pointer-events: none; }
.hub-text { font-family: var(--f-label); font-size: 8px; font-weight: 700; letter-spacing: .2em; fill: #3a2a0a; }
.hit { fill: transparent; cursor: pointer; outline: none; }
.hit:hover { fill: #ffb02e22; }
.hit:focus-visible { stroke: var(--amber); stroke-width: 3; }

/* selector knob */
.knob-wrap { position: relative; width: 12rem; aspect-ratio: 1; }
.knob-mark { position: absolute; translate: -50% -50%; border: none; background: none; font-family: var(--f-label); font-weight: 700; color: var(--muted); padding: .2rem .4rem; }
.knob-mark.cur { color: var(--amber); text-shadow: 0 0 8px var(--amber); }
.knob {
  position: absolute; inset: 20%; border-radius: 50%; border: none; padding: 0;
  background: repeating-conic-gradient(#0000 0 5deg, #0005 5deg 10deg), radial-gradient(circle at 40% 35%, #737a81, #2a2e33 70%);
  box-shadow: 0 6px 14px #000a, inset 0 2px 0 #9aa1a8, 0 0 0 6px #1a1d20, 0 0 0 8px #4a5056;
  transition: rotate .45s cubic-bezier(.34, 1.56, .64, 1);
}
.knob::after { content: ""; position: absolute; top: 8%; left: 50%; width: 6px; height: 30%; margin-left: -3px; border-radius: 3px; background: var(--amber); box-shadow: 0 0 8px var(--amber); }
.legend { list-style: none; margin: 0; padding: 0; width: 100%; max-width: 24rem; display: flex; flex-direction: column; gap: .4rem; }
.opt { width: 100%; display: flex; gap: .7rem; align-items: baseline; text-align: left; padding: .45rem .8rem; border-radius: 8px; border: 1px solid #ffffff1a; background: #1b1e22; }
.opt b { font-family: var(--f-led); color: var(--amber); }
.opt.cur { border-color: var(--amber); box-shadow: 0 0 10px #ffb02e33; }

/* toggle switches */
.switches { list-style: none; margin: 0; padding: 0; width: 100%; max-width: 26rem; display: flex; flex-direction: column; gap: .6rem; }
.sw-row { display: flex; align-items: center; gap: .9rem; padding: .5rem .8rem; border-radius: 10px; background: #1b1e22; text-align: left; }
.sw-text { flex: 1; }
.toggle { position: relative; flex: none; width: 2.6rem; height: 3.2rem; border: none; border-radius: 6px; background: linear-gradient(160deg, #6b7279, #2a2e33); box-shadow: inset 0 1px 0 #9aa1a8, 0 3px 6px #0008; }
.toggle::before { content: ""; position: absolute; left: 50%; top: 50%; width: 1.3rem; height: 1.3rem; translate: -50% -50%; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #e3e6e9, #7d848b); box-shadow: 0 0 0 2px #2a2e33; }
.toggle::after { content: ""; position: absolute; left: calc(50% - 4px); bottom: 50%; width: 8px; height: 1.4rem; border-radius: 4px 4px 3px 3px; background: linear-gradient(90deg, #8a9096, #f2f4f6, #8a9096); transform-origin: 50% 100%; rotate: 180deg; transition: rotate .15s ease-out; }
.toggle[aria-checked="true"]::after { rotate: 0deg; }

/* yellowed photo scan */
.scan { position: relative; width: 100%; max-width: 22rem; padding: .6rem .6rem 2.2rem; background: #e9dcc0; rotate: -1.5deg; box-shadow: 0 10px 24px #000a; animation: develop 1.8s ease-out both; }
.scan-img { display: grid; place-items: center; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; filter: sepia(.75) contrast(.95) brightness(.95); color: #6e5a35; font-size: .9rem; background: repeating-radial-gradient(circle at 30% 40%, #0000 0 2px, #0000000a 2px 3px), linear-gradient(#cdb98e, #b49c6a); }
.date-stamp { position: absolute; right: 1.2rem; bottom: 2.6rem; font-family: var(--f-led); font-size: 1rem; color: #ff7a1a; text-shadow: 0 0 4px #ff5a00; }
.scan-cap { position: absolute; left: 0; right: 0; bottom: .45rem; font-family: var(--f-hand); color: var(--ink); }
.scanline { position: absolute; left: .6rem; right: .6rem; top: .6rem; height: 3px; background: #fffa; box-shadow: 0 0 16px 6px #fff6; animation: scanline 1.8s ease-out forwards; }
.memory { font-family: var(--f-hand); font-size: 1.1rem; max-width: 26rem; animation: fadeIn .8s .8s ease both; }

/* imprint badges */
.imprint {
  width: 5.2rem; height: 5.2rem; border-radius: 50%; display: grid; place-content: center; line-height: 1.2;
  color: #3a2a0a; background: radial-gradient(circle at 35% 30%, #f6e3a4, var(--brass) 55%, var(--brass-lo));
  outline: 2px dashed #7a5c2299; outline-offset: -9px; box-shadow: 0 6px 14px #0008;
}
.imprint b { font-family: var(--f-hand); font-size: 1.05rem; }
.imprint small { font-family: var(--f-led); font-size: .7rem; }
.imprint.stamp { animation: stamp .6s cubic-bezier(.2, 1.4, .4, 1) both; }
.imprint.mini { width: 3.3rem; height: 3.3rem; outline-offset: -5px; }
.imprint.mini b { font-size: .7rem; }
.imprint.mini small { font-size: .55rem; }
.imprint.drop { animation: drop .7s cubic-bezier(.3, 1.3, .5, 1) both; }

/* capsule */
.capsule { width: 12rem; display: flex; flex-direction: column; align-items: center; }
.cap-end { width: 78%; height: 1.5rem; background: linear-gradient(90deg, var(--brass-lo), var(--brass-hi) 40%, var(--brass) 60%, var(--brass-lo)); box-shadow: 0 2px 4px #0008; }
.cap-end.top { border-radius: 12px 12px 3px 3px; }
.cap-end.bottom { border-radius: 3px 3px 12px 12px; }
.cap-body { width: 100%; padding: 1.2rem 0; display: grid; place-items: center; border-radius: 18px; background: linear-gradient(90deg, #3a4046, #9aa2aa 30%, #e6eaee 45%, #8a9299 60%, #2e3338); box-shadow: 0 10px 24px #000a; transition: box-shadow 1s; }
.capsule.sealed .cap-body { box-shadow: 0 10px 24px #000a, 0 0 36px #4dff9a55; }
.porthole { position: relative; width: 8.4rem; aspect-ratio: 1; border-radius: 50%; overflow: hidden; display: grid; place-items: center; background: radial-gradient(#1a2a30, #0a1216); box-shadow: inset 0 0 20px #000, 0 0 0 6px var(--brass), 0 0 0 8px var(--brass-lo); }
.inside { display: flex; flex-wrap: wrap; justify-content: center; gap: .2rem; width: 7.2rem; }
.shutter { position: absolute; inset: 0; border-radius: 50%; background: repeating-conic-gradient(#7d848b 0 15deg, #5a6066 15deg 30deg); transform: scale(0) rotate(-180deg); transition: transform 1.2s cubic-bezier(.6, 0, .3, 1); }
.capsule.sealed .shutter { transform: scale(1) rotate(0); }

/* letter + reply */
.letter { width: 100%; max-width: 28rem; display: flex; flex-direction: column; gap: .8rem; padding: 1.5rem 1.4rem; text-align: left; font-family: var(--f-hand); font-size: 1.05rem; color: #3a2c17; background: radial-gradient(ellipse at 20% 10%, #f4e9cf, #e3d0a4); rotate: .5deg; box-shadow: 0 10px 24px #000a; animation: unroll 1s ease both; }
.letter .ph { color: #8a5a1a; border-color: #b08a50; }
.letter .sign { text-align: right; }
textarea { width: 100%; max-width: 28rem; min-height: 6rem; padding: .8rem 1rem; resize: vertical; font-family: var(--f-hand); font-size: 1rem; color: #ffd27a; caret-color: var(--amber); background: #0d0904; border: 2px solid #4a3f2f; border-radius: 10px; }
.final { font-size: clamp(1.3rem, 5vw, 1.7rem); font-weight: 700; color: var(--brass-hi); text-shadow: 0 0 18px #ffb02e55; max-width: 28rem; }

/* warp flash */
.warp { position: fixed; inset: 0; z-index: 50; pointer-events: none; background: repeating-radial-gradient(circle, #fff8 0 6px, #ffd27a33 6px 28px), radial-gradient(circle, #fff, #ffd27a 25%, #ff8a00 45%, transparent 70%); animation: warp 1.1s ease-in-out forwards; }

.shake { animation: shake .4s; }

/* scene index (prototype only) */
.dev { position: fixed; top: calc(env(safe-area-inset-top, 0px) + 12px); right: 12px; z-index: 30; font-family: var(--f-label); }
.dev > button { padding: .3rem .9rem; font-size: .65rem; font-weight: 700; letter-spacing: .15em; color: #2a1f0a; border: none; border-radius: 4px; background: linear-gradient(#e2c26e, #a07c2c); }
.dev ul { list-style: none; margin: .5rem 0 0; padding: .4rem; border-radius: 8px; background: #23272b; border: 1px solid #4a5056; font-family: var(--f-body); }
.dev li button { width: 100%; text-align: left; background: none; border: none; padding: .35rem .7rem; font-size: .85rem; border-radius: 6px; }
.dev li button:hover { background: #3a4046; }

@keyframes spin { to { rotate: 360deg; } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes flicker { 50% { opacity: .55; } }
@keyframes charge { from { width: 0; } to { width: 100%; } }
@keyframes pull { 45% { transform: perspective(240px) rotateX(-160deg); } }
@keyframes develop { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes scanline { 0% { top: .6rem; opacity: 1; } 85% { opacity: 1; } 100% { top: calc(100% - 2.2rem); opacity: 0; } }
@keyframes stamp { from { scale: 2.2; rotate: -25deg; opacity: 0; } }
@keyframes drop { from { translate: 0 -12rem; opacity: 0; } }
@keyframes unroll { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes shake { 25% { translate: -8px 0; } 75% { translate: 8px 0; } }
@keyframes warp { 0% { opacity: 0; transform: scale(.2); } 50% { opacity: 1; transform: scale(1.3); } 100% { opacity: 0; transform: scale(3); } }
</style>
