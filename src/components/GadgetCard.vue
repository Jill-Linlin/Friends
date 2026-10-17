<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { content as C, isTodo } from '@/data/cardContent'
import { countdownTo, prefersReducedMotion, useRetrigger, useTimers } from '@/composables/useCardHelpers'
import GadgetArt from './gadget/GadgetArt.vue'
import RingEgg from './RingEgg.vue'

type Scene = 'drawer' | 'door' | 'station' | 'letter' | 'egg' | 'end'
type StationKey = 'timeMachine' | 'memoryBread' | 'konjac' | 'bambooCopter'
type Quiz = { question: string; options: string[]; correctIndex: number; wrongRoast: string }

const G = C.gadget
const reduce = prefersReducedMotion()
const { later, clearAll } = useTimers()

/** the four secret gadgets, one per era, pulled out of the pocket in order */
const STATIONS: { key: StationKey; name: string; era: string; year: string; intro: string }[] = [
  { key: 'timeMachine', name: '時光機', era: G.timeMachine.era, year: G.timeMachine.year, intro: '坐上時光機，回到我們的高中時代！' },
  { key: 'memoryBread', name: '記憶麵包', era: G.memoryBread.era, year: G.memoryBread.year, intro: '把大學的回憶印在吐司上吃下去，就永遠不會忘記！' },
  { key: 'konjac', name: '翻譯蒟蒻', era: G.konjac.era, year: G.konjac.year, intro: '出社會後收到一堆看不懂的訊息？吃下翻譯蒟蒻就看得懂了！' },
  { key: 'bambooCopter', name: '竹蜻蜓', era: G.bambooCopter.era, year: G.bambooCopter.year, intro: '戴上竹蜻蜓，一路飛到「現在」！' },
]
const FIRST_STEP: Record<StationKey, string> = { timeMachine: 'launch', memoryBread: 'print', konjac: 'garbled', bambooCopter: 'fly' }

/* ---------- scene routing ---------- */
const scene = ref<Scene>('drawer')
const st = ref(0)
const station = computed(() => STATIONS[st.value]!)
const got = reactive(STATIONS.map(() => false))
const gotCount = computed(() => got.filter(Boolean).length)
function go(s: Scene) {
  scene.value = s
  if (s === 'drawer') startDrawer()
}

/* ---------- 1. the desk drawer rattles and a 4D pocket floats out ---------- */
const drawer = reactive({ open: false, pocketUp: false, ready: false })
function startDrawer() {
  Object.assign(drawer, { open: false, pocketUp: false, ready: false })
  later(() => { drawer.open = true }, reduce ? 0 : 2200)
  later(() => { drawer.pocketUp = true }, reduce ? 0 : 2600)
  later(() => { drawer.ready = true }, reduce ? 0 : 3500)
}
startDrawer()

/* ---------- 2. anywhere door: enter the coordinate ---------- */
const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK']
const KEY_COLORS = ['#ffd400', '#7fd3ff', '#ff9ec4', '#a5e887']
const code = ref('')
const doorMsg = ref('')
const doorOpen = ref(false)
let doorWrongs = 0
const { active: doorShaking, fire: shakeDoor } = useRetrigger()
const codeDisplay = computed(() => {
  const d = code.value.padEnd(8, '_')
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`
})
function pressKey(k: string) {
  if (k === '⌫') { if (!doorOpen.value) code.value = code.value.slice(0, -1); return }
  if (k === 'OK') return tryDoor()
  if (doorOpen.value || code.value.length >= 8) return
  code.value += k
  doorMsg.value = ''
}
function tryDoor() {
  if (doorOpen.value) return
  if (!code.value) { doorMsg.value = '請先輸入座標。'; return }
  if (G.door.answers.includes(code.value)) {
    doorOpen.value = true
    doorMsg.value = ''
    later(() => openStation(0), reduce ? 50 : 1900)
  } else {
    doorMsg.value = G.door.hints[Math.min(doorWrongs++, G.door.hints.length - 1)]!
    code.value = ''
    shakeDoor()
  }
}

/* ---------- 3. gadget stations: pocket → reveal → play → dorayaki ---------- */
const P = reactive({
  phase: 'pocket' as 'pocket' | 'reveal' | 'play' | 'done',
  step: '',
  hold: 0,
  wrongPick: -1,
  msg: '',
  printed: false,
  bites: 0,
  shown: [] as string[],
  decoding: -1,
  altitude: 0,
})
const { active: quizShaking, fire: shakeQuiz } = useRetrigger()
const { active: boosting, fire: boost } = useRetrigger()

function openStation(i: number) {
  stopLoops()
  st.value = i
  Object.assign(P, {
    phase: 'pocket', step: '', hold: 0, wrongPick: -1, msg: '', printed: false, bites: 0,
    shown: G.konjac.messages.map(garble), decoding: -1, altitude: 0,
  })
  go('station')
}
function pullGadget() {
  P.phase = 'reveal'
  later(() => { P.phase = 'play'; P.step = FIRST_STEP[station.value.key] }, reduce ? 0 : 2100)
}
function collect() {
  got[st.value] = true
  P.phase = 'done'
}
function nextStation() {
  if (st.value < STATIONS.length - 1) openStation(st.value + 1)
  else go('letter')
}

/* quizzes (time machine + memory bread) */
const quiz = computed<Quiz | null>(() =>
  station.value.key === 'timeMachine' ? G.timeMachine.quiz : station.value.key === 'memoryBread' ? G.memoryBread.quiz : null)
function pick(i: number) {
  const q = quiz.value
  if (!q) return
  if (i !== q.correctIndex) {
    P.wrongPick = i
    P.msg = q.wrongRoast
    shakeQuiz()
    return
  }
  P.wrongPick = -1
  P.msg = ''
  if (station.value.key === 'timeMachine') P.step = 'memory'
  else collect()
}

/* 時光機：hold the lever, ride the time tunnel */
let holdStart = 0, holdRaf = 0
function holdTick(t: number) {
  P.hold = Math.min((t - holdStart) / 1400, 1)
  if (P.hold < 1) holdRaf = requestAnimationFrame(holdTick)
  else launch()
}
function holdDown(e: PointerEvent) {
  e.preventDefault()
  holdStart = performance.now()
  holdRaf = requestAnimationFrame(holdTick)
}
function holdUp() {
  cancelAnimationFrame(holdRaf)
  if (P.step === 'launch') P.hold = 0
}
function launch() {
  cancelAnimationFrame(holdRaf)
  P.step = 'tunnel'
  later(() => { P.step = 'quiz' }, reduce ? 0 : 2600)
}
const CLOCKS = Array.from({ length: 7 }, (_, i) => ({
  tx: `${Math.cos(i * 0.9) * 140}px`,
  ty: `${Math.sin(i * 0.9) * 110}px`,
  delay: `${i * .3}s`,
}))

/* 記憶麵包：print → eat (3 bites) → quiz */
function bite() {
  if (P.step !== 'eat' || P.bites >= 3) return
  P.bites++
  if (P.bites === 3) later(() => { P.step = 'quiz' }, reduce ? 0 : 800)
}

/* 翻譯蒟蒻：garbled messages decode one by one */
const GLYPHS = '▲◆●■◇○□△※∮жψξ¤§ゞヾ☆♪'
const glyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!
function garble(t: string) { return [...t].map(ch => (ch.trim() ? glyph() : ch)).join('') }
let decodeTimer = 0
function eatKonjac() {
  P.step = 'decoding'
  later(() => decodeNext(0), reduce ? 0 : 700)
}
function decodeNext(i: number) {
  if (i >= G.konjac.messages.length) { P.decoding = -1; P.step = 'decoded'; return }
  P.decoding = i
  const target = [...G.konjac.messages[i]!]
  let n = 0
  decodeTimer = window.setInterval(() => {
    n++
    P.shown[i] = target.map((ch, j) => (j < n || !ch.trim() ? ch : glyph())).join('')
    if (n >= target.length) {
      clearInterval(decodeTimer)
      later(() => decodeNext(i + 1), reduce ? 0 : 400)
    }
  }, reduce ? 1 : 55)
}

/* 竹蜻蜓：tap to climb to "now" */
const ALTITUDE_LABELS = computed(() => {
  const a = P.altitude
  if (a >= 100) return '抵達「現在」！'
  if (a >= 75) return '快到「現在」了！'
  return `${STATIONS[Math.min(Math.floor(a / 25), 2)]!.era}上空`
})
function flyUp() {
  if (P.step !== 'fly') return
  P.altitude = Math.min(100, P.altitude + (reduce ? 25 : 10))
  boost()
  if (P.altitude >= 100) later(() => { P.step = 'arrived' }, reduce ? 0 : 700)
}

/* ---------- 5. ending: one more gadget, stuck until next year ---------- */
const NG = G.nextGadget
const { days: daysLeft, label: revealLabel } = countdownTo(NG.revealDate)
const POCKET_LINES = ['拉不出來……好像卡住了！', '口袋裡傳來「明年見～」的聲音……', `還要再等 ${daysLeft} 天才拿得出來！`]
const pocketMsg = ref('')
let pocketTaps = 0
const { active: pocketShaking, fire: shakePocket } = useRetrigger()
function tapMystery() {
  pocketMsg.value = POCKET_LINES[Math.min(pocketTaps++, POCKET_LINES.length - 1)]!
  shakePocket()
}

/* ---------- reset / dev jumps ---------- */
function stopLoops() {
  cancelAnimationFrame(holdRaf)
  clearInterval(decodeTimer)
}
function resetDoor() {
  code.value = ''
  doorMsg.value = ''
  doorOpen.value = false
  doorWrongs = 0
}
function restart() {
  clearAll()
  stopLoops()
  got.forEach((_, i) => { got[i] = false })
  resetDoor()
  pocketMsg.value = ''
  pocketTaps = 0
  go('drawer')
}
const devOpen = ref(false)
const DEV: [string, () => void][] = [
  ['1. 抽屜裡的口袋', restart],
  ['2. 任意門', () => { resetDoor(); go('door') }],
  ...STATIONS.map((s, i) => [`　└ 道具 ${i + 1}：${s.name}`, () => openStation(i)] as [string, () => void]),
  ['3. 口袋裡的信', () => { got.forEach((_, i) => { got[i] = true }); go('letter') }],
  ['3b. 發光的彩蛋（戒指）', () => go('egg')],
  ['4. 未完待續', () => go('end')],
]
function devJump(fn: () => void) { devOpen.value = false; fn() }

/* keyboard for the door keypad */
function onKey(e: KeyboardEvent) {
  if (scene.value !== 'door') return
  const el = e.target as HTMLElement
  if (el.matches('input, textarea')) return
  if (/^\d$/.test(e.key)) { e.preventDefault(); pressKey(e.key) }
  else if (e.key === 'Backspace') { e.preventDefault(); pressKey('⌫') }
  else if (e.key === 'Enter' && !el.closest('button, a')) { e.preventDefault(); tryDoor() }
}
onMounted(() => addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  removeEventListener('keydown', onKey)
  stopLoops()
})
</script>

<template>
  <div class="dora-card">
    <div class="clouds" aria-hidden="true"><i v-for="n in 5" :key="n"></i></div>

    <nav class="dev" aria-label="場景目錄（原型測試用）">
      <button :aria-expanded="devOpen" @click="devOpen = !devOpen">SCENES</button>
      <ul v-if="devOpen">
        <li v-for="[t, fn] in DEV" :key="t"><button @click="devJump(fn)">{{ t }}</button></li>
      </ul>
    </nav>

    <main class="wrap">
      <!-- 1. Drawer -->
      <section v-if="scene === 'drawer'" class="scene">
        <p class="bubble">{{ drawer.ready ? '……是一個口袋！' : '書桌抽屜裡傳來奇怪的聲音……' }}</p>
        <div class="desk-stage">
          <div v-if="drawer.open" class="beam" aria-hidden="true"></div>
          <button
            class="float-pocket" :class="{ up: drawer.pocketUp, ready: drawer.ready }" :disabled="!drawer.ready"
            aria-label="打開四次元口袋" @click="resetDoor(); go('door')"
          >
            <GadgetArt kind="pocket" />
            <template v-if="drawer.ready">
              <span class="twinkle t1" aria-hidden="true">✦</span>
              <span class="twinkle t2" aria-hidden="true">✦</span>
              <span class="twinkle t3" aria-hidden="true">✦</span>
            </template>
          </button>
          <div class="desk">
            <div class="desk-top"></div>
            <div class="drawer" :class="drawer.open ? 'open' : 'rattle'"><span class="handle"></span></div>
            <div class="drawer"><span class="handle"></span></div>
          </div>
          <span v-if="!drawer.open" class="sfx" aria-hidden="true">喀噠喀噠！</span>
        </div>
        <div v-if="drawer.ready" class="intro">
          <div class="kicker">FROM THE 22ND CENTURY</div>
          <h1>來自 22 世紀的四次元口袋</h1>
          <p class="to">致　<span :class="{ ph: isTodo(C.friendName) }">{{ C.friendName }}</span></p>
          <p class="hint">點一下口袋，看看裡面有什麼！</p>
        </div>
      </section>

      <!-- 2. Anywhere door -->
      <section v-else-if="scene === 'door'" class="scene">
        <div class="kicker">ANYWHERE DOOR</div>
        <h2 class="title">任意門</h2>
        <p class="bubble"><span :class="{ ph: isTodo(G.door.question) }">{{ G.door.question }}</span></p>
        <div class="door-wrap" :class="{ opened: doorOpen }">
          <div class="doorway" aria-hidden="true"><i v-for="n in 6" :key="n"></i></div>
          <div class="door" :class="{ open: doorOpen, shake: doorShaking }"><span class="knob"></span></div>
          <div class="door-base"></div>
        </div>
        <div class="screen" role="status" :aria-label="`已輸入 ${code || '無'}`">{{ codeDisplay }}</div>
        <div class="keypad">
          <button
            v-for="(k, i) in KEYPAD" :key="k" class="key" :style="{ '--k': KEY_COLORS[i % KEY_COLORS.length] }"
            :aria-label="k === '⌫' ? '刪除' : k === 'OK' ? '確定' : k" @click="pressKey(k)"
          >{{ k }}</button>
        </div>
        <p class="msg" role="status">{{ doorMsg }}</p>
        <p v-if="G.door.prototypeNote" class="note">{{ G.door.prototypeNote }}</p>
      </section>

      <!-- 3. Gadget stations -->
      <section v-else-if="scene === 'station'" class="scene">
        <header class="progress">
          <span class="step-no">道具 {{ st + 1 }} / {{ STATIONS.length }}</span>
          <span class="slots" :aria-label="`已收集 ${gotCount} 個銅鑼燒`">
            <span v-for="(g, i) in got" :key="i" class="slot" :class="{ got: g }"><GadgetArt kind="dorayaki" /></span>
          </span>
        </header>

        <div :key="st" class="panel">
          <div class="era-tag">{{ station.era }}・{{ station.year }}</div>

          <!-- reach into the pocket -->
          <template v-if="P.phase === 'pocket'">
            <p class="bubble">{{ station.intro }}</p>
            <button class="pocket-btn" aria-label="把手伸進口袋，拿出秘密道具" @click="pullGadget"><GadgetArt kind="pocket" /></button>
            <p class="hint">點口袋，拿出秘密道具！</p>
          </template>

          <!-- the gadget pops out -->
          <div v-else-if="P.phase === 'reveal'" class="reveal" role="status" :aria-label="`拿出了${station.name}`">
            <div class="burst" aria-hidden="true"></div>
            <div class="sfx-text">噹噹噹噹～</div>
            <div class="pop-gadget"><GadgetArt :kind="station.key" spin /></div>
            <div class="callout">{{ station.name }}！</div>
          </div>

          <!-- play -->
          <template v-else-if="P.phase === 'play'">
            <h2 class="gadget-name"><span class="mini"><GadgetArt :kind="station.key" spin /></span>{{ station.name }}</h2>

            <!-- 時光機 -->
            <template v-if="station.key === 'timeMachine'">
              <template v-if="P.step === 'launch'">
                <div class="tm-art"><GadgetArt kind="timeMachine" /></div>
                <div class="dest">目的地　<b>{{ G.timeMachine.year }} 年・{{ G.timeMachine.era }}</b></div>
                <button
                  class="hold-btn" @pointerdown="holdDown" @pointerup="holdUp" @pointerleave="holdUp" @pointercancel="holdUp"
                  @keydown.enter.space.prevent="launch"
                >
                  <svg viewBox="0 0 128 128" aria-hidden="true">
                    <circle cx="64" cy="64" r="60" fill="none" stroke="#ffffff55" stroke-width="6" />
                    <circle cx="64" cy="64" r="60" fill="none" stroke="#ffd400" stroke-width="6" stroke-dasharray="377" :stroke-dashoffset="377 * (1 - P.hold)" stroke-linecap="round" />
                  </svg>
                  <span>按住拉桿<br>出發！</span>
                </button>
              </template>
              <div v-else-if="P.step === 'tunnel'" class="tunnel" role="status">
                <div class="swirl" aria-hidden="true"></div>
                <i v-for="(c, i) in CLOCKS" :key="i" class="clock" :style="{ '--tx': c.tx, '--ty': c.ty, animationDelay: c.delay }" aria-hidden="true"></i>
                <div class="tunnel-ride"><GadgetArt kind="timeMachine" /></div>
                <p>時光隧道穿越中……</p>
              </div>
              <template v-else-if="P.step === 'memory'">
                <img v-if="G.timeMachine.photo" class="photo" :src="G.timeMachine.photo" alt="高中時期的照片">
                <div v-else class="photo">【待放：高中時期的照片】</div>
                <p class="bubble"><span :class="{ ph: isTodo(G.timeMachine.memory) }">{{ G.timeMachine.memory }}</span></p>
                <button class="pop-btn" @click="collect">收下銅鑼燒</button>
              </template>
            </template>

            <!-- 記憶麵包 -->
            <template v-else-if="station.key === 'memoryBread'">
              <template v-if="P.step === 'print' || P.step === 'eat'">
                <button
                  class="toast" :class="{ eating: P.step === 'eat' }" :disabled="P.step !== 'eat'"
                  :aria-label="P.step === 'eat' ? '咬一口記憶麵包' : '記憶麵包'" @click="bite"
                >
                  <GadgetArt kind="memoryBread" />
                  <span v-if="P.printed" class="toast-text" :class="{ long: G.memoryBread.memory.length > 40 }">
                    <span :class="{ ph: isTodo(G.memoryBread.memory) }">{{ G.memoryBread.memory }}</span>
                  </span>
                  <i v-for="b in P.bites" :key="b" class="bite" :class="`b${b}`"></i>
                </button>
                <button v-if="!P.printed" class="pop-btn" @click="P.printed = true">把大學的回憶印上去</button>
                <button v-else-if="P.step === 'print'" class="pop-btn blue" @click="P.step = 'eat'">吃掉它！</button>
                <p v-else class="hint">點吐司咬一口！（{{ P.bites }} / 3）</p>
              </template>
            </template>

            <!-- 翻譯蒟蒻 -->
            <template v-else-if="station.key === 'konjac'">
              <div v-if="P.step === 'garbled'" class="konjac-art"><GadgetArt kind="konjac" /></div>
              <p v-else-if="P.step === 'decoding' && P.decoding < 0" class="sfx-text static">咕嚕！</p>
              <ul class="msgs">
                <li
                  v-for="(m, i) in P.shown" :key="i" class="msg-card"
                  :class="{ decoding: P.decoding === i, clear: P.step === 'decoded' || (P.decoding > i) }"
                >
                  <span class="from">訊息 {{ i + 1 }}</span>
                  <span class="text" :class="{ ph: (P.step === 'decoded' || P.decoding > i) && isTodo(G.konjac.messages[i]!) }">{{ m }}</span>
                </li>
              </ul>
              <button v-if="P.step === 'garbled'" class="pop-btn" @click="eatKonjac">吃下翻譯蒟蒻</button>
              <p v-else-if="P.step === 'decoding'" class="hint">翻譯中……</p>
              <button v-else class="pop-btn blue" @click="collect">看懂了！收下銅鑼燒</button>
            </template>

            <!-- 竹蜻蜓 -->
            <template v-else-if="station.key === 'bambooCopter'">
              <template v-if="P.step === 'fly'">
                <div class="sky-view">
                  <div class="cloud-layer" :style="{ backgroundPosition: `0 ${P.altitude * 6}px` }"></div>
                  <div class="ground" :style="{ transform: `translateY(${P.altitude * 3}%)` }"></div>
                  <div class="flyer" :class="{ boost: boosting }"><GadgetArt kind="bambooCopter" spin /></div>
                  <div class="altimeter" aria-hidden="true"><i :style="{ height: `${P.altitude}%` }"></i></div>
                  <span class="passing">{{ ALTITUDE_LABELS }}</span>
                </div>
                <button class="pop-btn blue" @click="flyUp">往上飛！</button>
                <p class="hint">連點按鈕，飛到「現在」！（高度 {{ P.altitude }}%）</p>
              </template>
              <template v-else-if="P.step === 'arrived'">
                <p class="arrive">抵達「現在」！</p>
                <img v-if="G.bambooCopter.photo" class="photo" :src="G.bambooCopter.photo" alt="現在的我們">
                <div v-else class="photo">【待放：你們最近的合照】</div>
                <p class="bubble"><span :class="{ ph: isTodo(G.bambooCopter.message) }">{{ G.bambooCopter.message }}</span></p>
                <button class="pop-btn" @click="collect">收下銅鑼燒</button>
              </template>
            </template>

            <!-- shared quiz -->
            <div v-if="quiz && P.step === 'quiz'" class="quiz" :class="{ shake: quizShaking }">
              <p class="arrive">{{ station.key === 'timeMachine' ? `抵達 ${G.timeMachine.year} 年！先考考妳：` : '記住了嗎？來考考看！' }}</p>
              <p class="q"><span :class="{ ph: isTodo(quiz.question) }">{{ quiz.question }}</span></p>
              <button v-for="(o, i) in quiz.options" :key="i" class="opt" :class="{ wrong: P.wrongPick === i }" @click="pick(i)">
                <b>{{ 'ABCDEFGH'[i] }}</b><span :class="{ ph: isTodo(o) }">{{ o }}</span>
              </button>
              <p class="msg" role="status">{{ P.msg }}</p>
            </div>
          </template>

          <!-- dorayaki reward -->
          <div v-else class="reward">
            <div class="big-dora"><GadgetArt kind="dorayaki" /></div>
            <p class="callout small">獲得銅鑼燒！</p>
            <p class="hint">已收集 {{ gotCount }} / {{ STATIONS.length }} 個</p>
            <button class="pop-btn" @click="nextStation">{{ st < STATIONS.length - 1 ? '拿出下一個道具 →' : '口袋裡好像還有一封信……' }}</button>
          </div>
        </div>
      </section>

      <!-- 4. Letter from the pocket -->
      <section v-else-if="scene === 'letter'" class="scene">
        <div class="kicker">A LETTER FROM THE POCKET</div>
        <h2 class="title">口袋裡掉出一封信</h2>
        <div class="notebook">
          <span class="holes" aria-hidden="true"></span>
          <div class="nb-bell" aria-hidden="true"><GadgetArt kind="bell" /></div>
          <p>親愛的 <span :class="{ ph: isTodo(C.friendName) }">{{ C.friendName }}</span>：</p>
          <p v-for="(line, i) in [C.letter.opening, C.letter.middle, C.letter.closing]" :key="i"><span :class="{ ph: isTodo(line) }">{{ line }}</span></p>
          <p class="sign">—— <span :class="{ ph: isTodo(C.letter.signature) }">{{ C.letter.signature }}</span>，<span :class="{ ph: isTodo(C.letter.date) }">{{ C.letter.date }}</span></p>
        </div>
        <button class="pop-btn" @click="go('egg')">咦？口袋還在發光……</button>
      </section>

      <!-- 4b. Easter egg: the ring -->
      <section v-else-if="scene === 'egg'" class="scene">
        <RingEgg theme="gadget" @done="go('end')" />
      </section>

      <!-- 5. To be continued -->
      <section v-else-if="scene === 'end'" class="scene">
        <div class="kicker">TO BE CONTINUED</div>
        <button class="mystery" :class="{ shake: pocketShaking }" aria-label="口袋裡還有一個道具（現在還拿不出來）" @click="tapMystery">
          <span class="rays" aria-hidden="true"></span>
          <span class="silhouette" aria-hidden="true">?</span>
          <span class="mystery-pocket"><GadgetArt kind="pocket" /></span>
        </button>
        <p class="pocket-msg" role="status">{{ pocketMsg || '（試著點一下口袋）' }}</p>
        <h1>{{ NG.title }}</h1>
        <p class="teaser">{{ NG.teaser }}</p>

        <div class="countdown">
          <div class="kicker">道具解禁倒數</div>
          <div class="days"><b>{{ daysLeft }}</b><span>天</span></div>
          <div class="reveal-date">將於 {{ revealLabel }} 從口袋拿出來</div>
        </div>

        <div class="secret-list" aria-label="下一批秘密道具（尚未揭曉）">
          <div v-for="(s, i) in NG.secretGadgets" :key="i" class="secret">
            <span class="sil" aria-hidden="true">?</span>
            <span class="name" aria-hidden="true">{{ s }}</span>
          </div>
        </div>

        <p class="bubble final"><span :class="{ ph: isTodo(C.finalLine) }">{{ C.finalLine }}</span></p>
        <div class="tbc">未完待續<span>TO BE CONTINUED…</span></div>
        <button class="pop-btn ghost" @click="restart">重新開始冒險</button>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* Layout: a bright comic world — sky-blue backdrop with drifting clouds, white panels with thick ink outlines and offset shadows, one centred column (max 30rem). Single light look by design. */
.dora-card {
  --blue: #0096e0;
  --blue-deep: #0b4f8a;
  --red: #e60012;
  --yellow: #ffd400;
  --ink: #1d1d1f;
  --navy: #1d3557;
  --muted: #4a6a8a;
  --f-round: "Huninn", "PingFang TC", "Microsoft JhengHei", sans-serif;
  color-scheme: light;
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  color: var(--navy);
  font-family: var(--f-round);
  font-size: 16px;
  line-height: 1.7;
  background:
    radial-gradient(circle at 15% 85%, #ffffff66 0 6rem, transparent 6.2rem),
    linear-gradient(#7fd0ff 0%, #c4ebff 55%, #fff6dc 100%);
  background-attachment: fixed;
}
button { font: inherit; color: inherit; cursor: pointer; }
:focus-visible { outline: 3px solid var(--red); outline-offset: 3px; }
h1, h2 { margin: 0; font-weight: 700; text-wrap: balance; letter-spacing: .04em; }
h1 { font-size: clamp(1.5rem, 6.5vw, 2.1rem); color: var(--blue-deep); text-shadow: 0 3px 0 #fff; }
p { margin: 0; }
.ph { color: #c2410c; border-bottom: 2px dashed #fb923c; }

/* drifting clouds */
.clouds { position: fixed; inset: 0; pointer-events: none; overflow: hidden; }
.clouds i { position: absolute; width: 7rem; height: 2.4rem; border-radius: 999px; background: #fff; opacity: .85; animation: drift linear infinite; }
.clouds i::before, .clouds i::after { content: ""; position: absolute; background: #fff; border-radius: 50%; }
.clouds i::before { width: 3rem; height: 3rem; left: 1rem; top: -1.4rem; }
.clouds i::after { width: 3.8rem; height: 3.8rem; left: 2.8rem; top: -2rem; }
.clouds i:nth-child(1) { top: 12%; animation-duration: 70s; animation-delay: -10s; }
.clouds i:nth-child(2) { top: 30%; animation-duration: 90s; animation-delay: -50s; scale: .7; }
.clouds i:nth-child(3) { top: 55%; animation-duration: 80s; animation-delay: -30s; scale: .9; }
.clouds i:nth-child(4) { top: 75%; animation-duration: 100s; animation-delay: -70s; scale: .6; }
.clouds i:nth-child(5) { top: 6%; animation-duration: 120s; animation-delay: -90s; scale: 1.2; }

.wrap { position: relative; z-index: 1; min-height: 100vh; display: flex; justify-content: center; padding: 4.5rem 16px 2.5rem; }
.scene { width: 100%; max-width: 30rem; display: flex; flex-direction: column; align-items: center; gap: 1.1rem; text-align: center; animation: popIn .5s cubic-bezier(.2, 1.3, .4, 1) both; }
.kicker { font-size: .75rem; font-weight: 700; letter-spacing: .3em; color: var(--blue); }
.title { font-size: 1.7rem; color: var(--blue-deep); text-shadow: 0 3px 0 #fff; }
.hint, .note, .teaser { font-size: .9rem; color: var(--muted); }
.note { font-size: .8rem; }
.msg { min-height: 1.5em; font-weight: 700; color: var(--red); }

/* comic bits */
.bubble { position: relative; max-width: 26rem; padding: .7rem 1.1rem; background: #fff; border: 3px solid var(--ink); border-radius: 20px; box-shadow: 0 4px 0 var(--ink); font-size: 1rem; }
.bubble::after { content: ""; position: absolute; left: 50%; bottom: -11px; width: 16px; height: 16px; translate: -50% 0; rotate: 45deg; background: #fff; border-right: 3px solid var(--ink); border-bottom: 3px solid var(--ink); }
.pop-btn { border: 3px solid var(--ink); border-radius: 999px; padding: .65rem 1.4rem; background: var(--yellow); color: var(--ink); font-weight: 700; font-size: 1rem; box-shadow: 0 4px 0 var(--ink); transition: translate .08s, box-shadow .08s; }
.pop-btn:active { translate: 0 3px; box-shadow: 0 1px 0 var(--ink); }
.pop-btn.blue { background: var(--blue); color: #fff; }
.pop-btn.ghost { background: #fff; }
.callout {
  font-size: clamp(2rem, 10vw, 2.8rem); font-weight: 900; letter-spacing: .04em; color: var(--yellow);
  -webkit-text-stroke: 7px var(--blue-deep); paint-order: stroke fill; text-shadow: 0 5px 0 var(--ink);
}
.callout.small { font-size: 1.8rem; -webkit-text-stroke-width: 6px; }

/* 1. drawer */
.desk-stage { position: relative; width: 18rem; height: 19rem; }
.desk { position: absolute; left: 50%; bottom: 0; width: 17rem; translate: -50% 0; }
.desk-top { height: 1.2rem; background: #a0622d; border: 3px solid var(--ink); border-radius: 6px; }
.desk .drawer { position: relative; height: 4.2rem; margin: .35rem .8rem 0; display: grid; place-items: center; background: #d58b48; border: 3px solid var(--ink); border-radius: 6px; transition: transform .4s cubic-bezier(.2, 1.3, .4, 1); }
.drawer .handle { width: 3rem; height: .75rem; border-radius: 999px; background: #6b3d16; border: 2px solid var(--ink); }
.drawer.rattle { animation: rattle .16s linear infinite; }
.drawer.open { transform: translateY(.5rem) scale(1.07); box-shadow: inset 0 .7rem 0 #3a1f0a; }
.beam { position: absolute; left: 50%; bottom: 8.6rem; width: 13rem; height: 11rem; translate: -50% 0; background: linear-gradient(to top, #fff8c2, #fff8c200); clip-path: polygon(32% 100%, 68% 100%, 100% 0, 0 0); animation: fadeIn .6s ease both; }
.float-pocket { position: absolute; left: 50%; bottom: 7.4rem; width: 8.5rem; margin-left: -4.25rem; padding: 0; border: none; background: none; opacity: 0; transform: translateY(4rem) scale(.3); transition: transform 1s cubic-bezier(.2, 1.3, .4, 1), opacity .4s; }
.float-pocket.up { opacity: 1; transform: translateY(-1rem); }
.float-pocket.ready { animation: floaty 2.4s ease-in-out infinite; filter: drop-shadow(0 0 14px #fff8c2); }
.float-pocket:disabled { cursor: default; }
.twinkle { position: absolute; color: var(--yellow); -webkit-text-stroke: 1px var(--ink); font-size: 1.3rem; animation: twinkle 1.4s ease-in-out infinite; }
.twinkle.t1 { left: -10%; top: 10%; } .twinkle.t2 { right: -8%; top: 0; animation-delay: .5s; } .twinkle.t3 { right: 10%; bottom: -10%; animation-delay: 1s; font-size: 1rem; }
.sfx { position: absolute; right: -.5rem; bottom: 9rem; font-size: 1.2rem; font-weight: 900; color: var(--red); -webkit-text-stroke: 4px #fff; paint-order: stroke fill; rotate: 12deg; animation: rattle .2s linear infinite; }
.intro { display: flex; flex-direction: column; align-items: center; gap: .5rem; animation: popIn .5s ease both; }
.to { font-size: 1.3rem; font-weight: 700; color: var(--navy); }

/* 2. anywhere door */
.door-wrap { position: relative; width: 9rem; height: 13.5rem; perspective: 700px; }
.doorway { position: absolute; inset: 0 0 .9rem; overflow: hidden; border: 3px solid var(--ink); border-radius: 4px 4px 0 0; background: linear-gradient(#8fd3ff 0%, #ffffff 58%, #a5e887 59%, #6cc25a 100%); transition: box-shadow .6s; }
.doorway i { position: absolute; width: 6px; height: 6px; border-radius: 50%; background: #fff; box-shadow: 0 0 8px 3px #fff8c2; animation: twinkle 1.6s ease-in-out infinite; }
.doorway i:nth-child(1) { left: 20%; top: 20%; } .doorway i:nth-child(2) { left: 70%; top: 30%; animation-delay: .3s; } .doorway i:nth-child(3) { left: 40%; top: 45%; animation-delay: .6s; }
.doorway i:nth-child(4) { left: 80%; top: 65%; animation-delay: .9s; } .doorway i:nth-child(5) { left: 15%; top: 70%; animation-delay: 1.2s; } .doorway i:nth-child(6) { left: 55%; top: 12%; animation-delay: .45s; }
.door-wrap.opened .doorway { box-shadow: 0 0 50px 10px #fff8c2; }
.door { position: absolute; inset: 0 0 .9rem; background: #f48fb1; border: 3px solid var(--ink); border-radius: 4px 4px 0 0; transform-origin: left center; transition: transform 1.2s cubic-bezier(.6, 0, .3, 1); }
.door::before { content: ""; position: absolute; inset: .7rem; border: 2px solid #e5739a; border-radius: 3px; }
.door.open { transform: rotateY(-110deg); }
.knob { position: absolute; right: .7rem; top: 52%; width: 1rem; height: 1rem; border-radius: 50%; background: #fff3c4; border: 2px solid var(--ink); }
.door-base { position: absolute; left: -1rem; right: -1rem; bottom: 0; height: 1rem; background: #c2185b; border: 3px solid var(--ink); border-radius: 4px; }
.screen { min-width: 13rem; padding: .3rem 1rem; border: 3px solid var(--ink); border-radius: 14px; background: var(--navy); color: #7fffd4; font-size: 1.7rem; font-weight: 700; letter-spacing: .14em; box-shadow: inset 0 3px 0 #0006; font-variant-numeric: tabular-nums; }
.keypad { display: grid; grid-template-columns: repeat(3, 1fr); gap: .6rem; width: 100%; max-width: 15rem; }
.key { height: 3.1rem; border: 3px solid var(--ink); border-radius: 999px; background: var(--k); font-size: 1.3rem; font-weight: 700; box-shadow: 0 4px 0 var(--ink); transition: translate .06s, box-shadow .06s; }
.key:active { translate: 0 3px; box-shadow: 0 1px 0 var(--ink); }

/* 3. stations */
.progress { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: .5rem; padding: .3rem .5rem .3rem 1rem; background: #ffffffd9; border: 3px solid var(--ink); border-radius: 999px; box-shadow: 0 3px 0 var(--ink); }
.step-no { font-weight: 700; color: var(--blue-deep); }
.slots { display: flex; gap: .2rem; }
.slot { width: 2.3rem; filter: grayscale(1); opacity: .3; transition: opacity .3s, filter .3s; }
.slot.got { filter: none; opacity: 1; animation: popIn .5s cubic-bezier(.2, 1.6, .4, 1) both; }
.panel { position: relative; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1.4rem 1.1rem 1.6rem; background: #fff; border: 3px solid var(--ink); border-radius: 24px; box-shadow: 0 6px 0 var(--ink); overflow: hidden; }
.era-tag { padding: .1rem .9rem; border: 3px solid var(--ink); border-radius: 999px; background: var(--blue); color: #fff; font-size: .85rem; font-weight: 700; }
.pocket-btn { width: 9rem; padding: 0; border: none; background: none; animation: wiggle 1.6s ease-in-out infinite; }
.reveal { position: relative; width: 100%; height: 16rem; display: grid; place-items: center; }
.burst { position: absolute; width: 18rem; aspect-ratio: 1; border-radius: 50%; background: repeating-conic-gradient(#fff3a0 0 10deg, #ffffff 10deg 20deg); -webkit-mask: radial-gradient(circle, #000 35%, transparent 70%); mask: radial-gradient(circle, #000 35%, transparent 70%); animation: spin 6s linear infinite, fadeIn .4s ease both; }
.sfx-text { position: absolute; top: 0; font-weight: 900; font-size: 1.1rem; color: var(--blue); animation: popIn .4s ease both; }
.sfx-text.static { position: static; font-size: 1.6rem; color: var(--red); }
.pop-gadget { position: relative; width: 8rem; animation: popOut 1s cubic-bezier(.2, 1.4, .4, 1) both; }
.reveal .callout { position: absolute; bottom: .2rem; animation: calloutIn .5s .7s cubic-bezier(.2, 1.6, .4, 1) both; }
.gadget-name { display: flex; align-items: center; gap: .5rem; font-size: 1.3rem; color: var(--blue-deep); }
.gadget-name .mini { width: 2.6rem; }
.arrive { font-size: 1.25rem; font-weight: 900; color: var(--red); }
.photo { width: 100%; aspect-ratio: 4 / 3; display: grid; place-items: center; object-fit: cover; border: 3px solid var(--ink); border-radius: 14px; background: #e6f6ff; color: var(--muted); rotate: -1.5deg; box-shadow: 0 5px 0 var(--ink); }

/* 時光機 */
.tm-art { width: 13rem; animation: floaty 2.4s ease-in-out infinite; }
.dest { padding: .35rem 1rem; border: 2px dashed var(--blue); border-radius: 12px; background: #e6f6ff; }
.dest b { color: var(--red); }
.hold-btn { position: relative; width: 7.5rem; height: 7.5rem; border-radius: 50%; border: 3px solid var(--ink); background: var(--red); color: #fff; font-weight: 700; line-height: 1.4; box-shadow: 0 5px 0 var(--ink); touch-action: none; user-select: none; -webkit-user-select: none; }
.hold-btn svg { position: absolute; inset: 6px; rotate: -90deg; }
.hold-btn span { position: relative; }
.tunnel { position: relative; width: 100%; height: 15rem; overflow: hidden; border: 3px solid var(--ink); border-radius: 18px; display: grid; place-items: center; }
.swirl { position: absolute; inset: -60%; background: repeating-conic-gradient(#7c4dff 0 15deg, #00b0ff 15deg 30deg, #ff4081 30deg 45deg, #ffd400 45deg 60deg); animation: spin 2.2s linear infinite; }
.tunnel::after { content: ""; position: absolute; inset: 0; background: radial-gradient(circle, #ffffffcc 0 12%, transparent 45%); }
.clock { position: absolute; z-index: 1; width: 2.4rem; height: 2.4rem; border-radius: 50%; background: #fff; border: 3px solid var(--ink); animation: clockFly 2.2s ease-in infinite both; }
.clock::before, .clock::after { content: ""; position: absolute; left: 50%; bottom: 50%; width: 3px; margin-left: -1.5px; background: var(--ink); transform-origin: bottom center; border-radius: 2px; }
.clock::before { height: 38%; animation: spin 1s linear infinite; }
.clock::after { height: 26%; rotate: 90deg; }
.tunnel-ride { position: relative; z-index: 2; width: 9rem; animation: hop .5s ease-in-out infinite alternate; }
.tunnel p { position: absolute; z-index: 2; bottom: .6rem; font-weight: 900; color: #fff; -webkit-text-stroke: 5px var(--ink); paint-order: stroke fill; }

/* 記憶麵包 */
.toast { position: relative; width: min(70vw, 15rem); padding: 0; border: none; background: none; }
.toast:disabled { cursor: default; }
.toast.eating { animation: wiggle 1.4s ease-in-out infinite; }
.toast-text { position: absolute; left: 29%; right: 29%; top: 27%; bottom: 17%; display: grid; place-items: center; overflow: hidden; font-size: .82rem; line-height: 1.45; font-weight: 700; color: #8a4b14; rotate: -3deg; animation: stampIn .5s cubic-bezier(.2, 1.4, .4, 1) both; }
.toast-text.long { font-size: .7rem; }
.toast-text .ph { color: #8a4b14; border-color: #c98a4a; }
.bite { position: absolute; width: 34%; aspect-ratio: 1; border-radius: 50%; background: #fff; animation: biteIn .25s ease-out both; }
.bite.b1 { top: -6%; right: 6%; } .bite.b2 { top: 24%; right: -12%; } .bite.b3 { top: -8%; left: 16%; }

/* shared quiz */
.quiz { width: 100%; display: flex; flex-direction: column; gap: .55rem; }
.quiz .q { font-weight: 700; }
.opt { display: flex; align-items: center; gap: .7rem; padding: .6rem .9rem; text-align: left; background: #fff; border: 3px solid var(--ink); border-radius: 14px; box-shadow: 0 3px 0 var(--ink); }
.opt:hover { background: #fff8cc; }
.opt b { flex: none; width: 1.8rem; height: 1.8rem; display: grid; place-items: center; border-radius: 50%; background: var(--blue); color: #fff; }
.opt.wrong { background: #ffe3e3; }
.opt.wrong b { background: var(--red); }

/* 翻譯蒟蒻 */
.konjac-art { width: 8rem; animation: wiggle 1.8s ease-in-out infinite; }
.msgs { list-style: none; margin: 0; padding: 0; width: 100%; display: flex; flex-direction: column; gap: .55rem; }
.msg-card { display: flex; flex-direction: column; padding: .5rem .85rem; text-align: left; background: #eef2f6; border: 3px solid var(--ink); border-radius: 16px 16px 16px 4px; transition: background .3s; }
.msg-card .from { font-size: .72rem; color: var(--muted); }
.msg-card .text { color: #8a94a3; letter-spacing: .04em; word-break: break-all; }
.msg-card.decoding .text { color: var(--blue); }
.msg-card.clear { background: #fff; }
.msg-card.clear .text { color: var(--navy); }

/* 竹蜻蜓 */
.sky-view { position: relative; width: 100%; height: 16rem; overflow: hidden; border: 3px solid var(--ink); border-radius: 18px; background: linear-gradient(#5ec4ff, #d2f0ff); }
.cloud-layer {
  position: absolute; inset: 0; transition: background-position .4s ease-out;
  background-image:
    radial-gradient(ellipse 34px 15px at 18% 20%, #fff 96%, transparent 100%),
    radial-gradient(ellipse 24px 12px at 25% 16%, #fff 96%, transparent 100%),
    radial-gradient(ellipse 40px 17px at 78% 55%, #fff 96%, transparent 100%),
    radial-gradient(ellipse 26px 12px at 71% 51%, #fff 96%, transparent 100%),
    radial-gradient(ellipse 30px 13px at 42% 88%, #fff 96%, transparent 100%);
  background-size: 100% 200px;
}
.ground { position: absolute; left: -10%; right: -10%; bottom: -8%; height: 32%; border-radius: 50% 50% 0 0; background: #7ccf6a; border-top: 3px solid var(--ink); transition: transform .4s ease-out; }
.flyer { position: absolute; left: 50%; top: 42%; width: 6rem; translate: -50% -50%; animation: bob .6s ease-in-out infinite alternate; }
.flyer.boost { animation: boostUp .3s ease-out, bob .6s .3s ease-in-out infinite alternate; }
.altimeter { position: absolute; right: 10px; top: 10px; bottom: 10px; width: 12px; border: 2px solid var(--ink); border-radius: 999px; background: #ffffffaa; overflow: hidden; }
.altimeter i { position: absolute; left: 0; right: 0; bottom: 0; background: var(--red); transition: height .3s; }
.passing { position: absolute; left: 10px; top: 10px; padding: .05rem .7rem; border: 2px solid var(--ink); border-radius: 999px; background: #fff; font-size: .8rem; font-weight: 700; }

/* reward */
.reward { display: flex; flex-direction: column; align-items: center; gap: .6rem; }
.big-dora { width: 8rem; animation: popOut .8s cubic-bezier(.2, 1.4, .4, 1) both; }
.reward .callout { animation: calloutIn .5s .3s cubic-bezier(.2, 1.6, .4, 1) both; }

/* 4. notebook letter */
.notebook {
  position: relative; width: 100%; max-width: 28rem; text-align: left;
  padding: 1.2rem 1.2rem 1.6rem 3.4rem; line-height: 2rem; rotate: -1deg;
  background:
    linear-gradient(90deg, transparent 2.6rem, #ff8a8a 2.6rem, #ff8a8a calc(2.6rem + 2px), transparent calc(2.6rem + 2px)),
    repeating-linear-gradient(transparent 0 calc(2rem - 1px), #a8d4f5 calc(2rem - 1px) 2rem) 0 1.2rem,
    #fff;
  border: 3px solid var(--ink); border-radius: 6px; box-shadow: 0 6px 0 var(--ink);
  animation: popIn .6s cubic-bezier(.2, 1.3, .4, 1) both;
}
.notebook p { font-size: 1.02rem; color: var(--navy); }
.notebook .sign { text-align: right; }
.holes { position: absolute; left: .75rem; top: 0; bottom: 0; width: .9rem; background: radial-gradient(circle, #c4ebff 0 45%, var(--ink) 46% 56%, transparent 57%) 0 .8rem / .9rem 2.6rem repeat-y; }
.nb-bell { position: absolute; top: -1.6rem; right: -1rem; width: 3.8rem; rotate: 14deg; }

/* 5. to be continued */
.mystery { position: relative; width: 15rem; height: 15rem; padding: 0; border: none; background: none; }
.rays { position: absolute; inset: 0; border-radius: 50%; background: repeating-conic-gradient(#fff6b0 0 9deg, transparent 9deg 18deg); -webkit-mask: radial-gradient(circle, #000 30%, transparent 70%); mask: radial-gradient(circle, #000 30%, transparent 70%); animation: spin 14s linear infinite; }
.silhouette { position: absolute; left: 50%; top: 18%; width: 6rem; height: 7rem; margin-left: -3rem; display: grid; place-items: start center; padding-top: .2rem; line-height: 1.2; border-radius: 18px 18px 8px 8px; background: var(--navy); color: var(--yellow); font-size: 3.4rem; font-weight: 900; box-shadow: 0 0 30px #ffd40088; animation: peek 2.4s ease-in-out infinite; }
.mystery-pocket { position: absolute; left: 50%; bottom: 6%; width: 12rem; margin-left: -6rem; }
.pocket-msg { min-height: 1.7em; margin-top: -.4rem; font-weight: 700; color: var(--blue-deep); }
.countdown { display: flex; flex-direction: column; align-items: center; padding: .8rem 2rem; background: #fff; border: 3px solid var(--ink); border-radius: 20px; box-shadow: 0 5px 0 var(--ink); }
.countdown .days { display: flex; align-items: baseline; gap: .3rem; }
.countdown .days b { font-size: 3.2rem; line-height: 1.15; font-weight: 900; color: var(--red); font-variant-numeric: tabular-nums; }
.countdown .reveal-date { font-size: .9rem; color: var(--muted); }
.secret-list { width: 100%; display: grid; grid-template-columns: repeat(3, 1fr); gap: .6rem; }
.secret { display: flex; flex-direction: column; align-items: center; gap: .4rem; padding: .7rem .4rem; background: #fff; border: 3px solid var(--ink); border-radius: 14px; box-shadow: 0 3px 0 var(--ink); overflow: hidden; }
.secret .sil { width: 2.6rem; height: 2.6rem; display: grid; place-items: center; border-radius: 12px; background: var(--navy); color: var(--yellow); font-weight: 900; font-size: 1.3rem; }
.secret .name { font-size: .8rem; filter: blur(4px); user-select: none; animation: fog 5s ease-in-out infinite; }
.secret:nth-child(2) .name { animation-delay: 1.6s; }
.secret:nth-child(3) .name { animation-delay: 3.2s; }
.bubble.final { font-size: 1.15rem; font-weight: 700; }
.tbc { display: inline-flex; flex-direction: column; align-items: center; padding: .35rem 1.5rem; background: var(--yellow); border: 3px solid var(--ink); rotate: -4deg; box-shadow: 4px 4px 0 var(--ink); font-size: 1.6rem; font-weight: 900; line-height: 1.3; }
.tbc span { font-size: .65rem; letter-spacing: .25em; }

.shake { animation: shake .4s; }

/* scene index (prototype only) */
.dev { position: fixed; top: calc(env(safe-area-inset-top, 0px) + 12px); right: 12px; z-index: 30; }
.dev > button { padding: .25rem .9rem; border: 2px solid var(--ink); border-radius: 999px; background: #fff; font-size: .75rem; font-weight: 700; letter-spacing: .1em; box-shadow: 0 2px 0 var(--ink); }
.dev ul { list-style: none; margin: .5rem 0 0; padding: .4rem; background: #fff; border: 2px solid var(--ink); border-radius: 14px; box-shadow: 0 4px 0 var(--ink); }
.dev li button { width: 100%; text-align: left; background: none; border: none; padding: .3rem .7rem; border-radius: 8px; font-size: .85rem; }
.dev li button:hover { background: #e6f6ff; }

@keyframes drift { from { transform: translateX(-10rem); } to { transform: translateX(110vw); } }
@keyframes popIn { from { opacity: 0; transform: translateY(12px) scale(.96); } to { opacity: 1; transform: none; } }
@keyframes fadeIn { from { opacity: 0; } }
@keyframes rattle { 25% { transform: translate(-2px, 1px) rotate(-1deg); } 75% { transform: translate(2px, -1px) rotate(1deg); } }
@keyframes floaty { 0%, 100% { transform: translateY(-1rem); } 50% { transform: translateY(-1.7rem) rotate(-3deg); } }
@keyframes twinkle { 0%, 100% { opacity: .3; scale: .7; } 50% { opacity: 1; scale: 1.15; } }
@keyframes wiggle { 0%, 100% { rotate: 0deg; } 25% { rotate: -5deg; } 75% { rotate: 5deg; } }
@keyframes spin { to { rotate: 360deg; } }
@keyframes popOut { 0% { transform: translateY(5rem) scale(.2) rotate(-30deg); opacity: 0; } 60% { transform: translateY(-.6rem) scale(1.12) rotate(6deg); opacity: 1; } 100% { transform: none; } }
@keyframes calloutIn { from { transform: scale(0) rotate(-12deg); opacity: 0; } }
@keyframes stampIn { from { scale: 1.8; opacity: 0; } }
@keyframes biteIn { from { scale: 0; } }
@keyframes hop { to { translate: 0 -8px; } }
@keyframes bob { from { translate: -50% -50%; } to { translate: -50% calc(-50% - 8px); } }
@keyframes boostUp { from { translate: -50% calc(-50% + 14px); } }
@keyframes clockFly { 0% { transform: translate(0, 0) scale(.2); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) scale(1.4); opacity: 0; } }
@keyframes peek { 0%, 100% { translate: 0 0; } 50% { translate: 0 -12px; } }
@keyframes fog { 50% { filter: blur(3px); opacity: .7; } }
@keyframes shake { 25% { translate: -8px 0; } 75% { translate: 8px 0; } }
</style>
