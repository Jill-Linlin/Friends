<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { content as C, checkPassword, hintFor, isTodo } from '@/data/cardContent'
import RingEgg from './RingEgg.vue'
import { countdownTo, prefersReducedMotion, useRetrigger, useTimers } from '@/composables/useCardHelpers'

type Scene = 'envelope' | 'letter' | 'exam' | 'result' | 'finale' | 'egg' | 'end'

const reduce = prefersReducedMotion()
const { later } = useTimers()

/* ---------- static data ---------- */
const SCENES: { id: Scene; label: string }[] = [
  { id: 'envelope', label: '1. 封印的魔法信' },
  { id: 'letter', label: '1b. 霍格華茲入學通知' },
  { id: 'exam', label: '2. 入學考試' },
  { id: 'result', label: '3. 成績單' },
  { id: 'finale', label: '4. 入學典禮' },
  { id: 'egg', label: '4b. 發光的彩蛋（戒指）' },
  { id: 'end', label: '5. 下一章（待續）' },
]
const STAR_PTS: [number, number][] = [[18, 30], [42, 16], [66, 34], [82, 62], [50, 78]]
const CRYSTAL_PTS: [number, number][] = [[20, 30], [75, 22], [80, 72], [30, 78]]
const RING_C = 2 * Math.PI * 60

/* ---------- scene routing ---------- */
const scene = ref<Scene>('envelope')
const devOpen = ref(false)

function go(id: Scene) {
  scene.value = id
  if (id === 'envelope') startOwl()
  if (id === 'letter') startLetter()
  if (id === 'result') startResult()
  if (id === 'finale') startFinale()
}
function devJump(id: Scene) {
  resetScene(id)
  if (id === 'result') exam.solved = exam.solved.map(() => true)
  go(id)
  devOpen.value = false
}

/* 1. envelope: the seal only becomes clickable once the owl has dropped the letter */
const envelopeOpen = ref(false)
const owlLanded = ref(false)
function startOwl() {
  owlLanded.value = false
  later(() => { owlLanded.value = true }, reduce ? 0 : 3000)
}
startOwl()
function openEnvelope() {
  envelopeOpen.value = true
  later(() => go('letter'), reduce ? 50 : 1200)
}

/* 1b. acceptance letter on parchment: read → smoulder → burn → exam begins */
const HW = C.hogwarts
const letterSmoke = ref(false)
const letterBurn = ref(false)
const EMBERS = Array.from({ length: 34 }, () => ({
  left: `${Math.random() * 100}%`,
  bottom: `${Math.random() * 70}%`,
  size: `${Math.random() * 3 + 2}px`,
  dur: `${Math.random() * 1.2 + 1.4}s`,
  delay: `${Math.random() * 2.6}s`,
  dx: `${Math.random() * 60 - 30}px`,
}))
function startLetter() {
  letterSmoke.value = false
  letterBurn.value = false
  const t = HW.burnAfterSeconds * 1000
  later(() => { letterSmoke.value = true }, Math.max(t - 2500, 0))
  later(() => { letterBurn.value = true }, t)
  later(() => { resetExam(); go('exam') }, t + (reduce ? 300 : 3400))
}

/* 2. entrance exam: one exam paper, five subjects, marked in red ink */
type QKind = 'password' | 'order' | 'choice' | 'stars' | 'spell'
const QUESTIONS: { kind: QKind; no: string; subject: string; type: string; prompt: string }[] = [
  { kind: 'password', no: '一', subject: '古代魔文研究', type: '填空題', prompt: C.password.question },
  { kind: 'order', no: '二', subject: '魔法史', type: '排序題', prompt: '依照發生的先後順序，依序點選，排出我們高中時期的三段回憶。' },
  { kind: 'choice', no: '三', subject: '奇獸飼育學', type: '選擇題', prompt: C.forest.question },
  { kind: 'stars', no: '四', subject: '天文學', type: '實作題', prompt: '點亮夜空中的五顆星，連成屬於我們的星座。每顆星都藏著一則分開後的訊息。' },
  { kind: 'spell', no: '五', subject: '魔咒學', type: '實作題', prompt: '按住魔杖施展「現形咒」，讓現在的我們顯現出來。' },
]
const POINTS = 20
const CANDIDATE_NO = 'HW-1019'
const MEMORIES = [C.school.firstMeet, C.school.embarrassing, C.school.graduation]
/** memories are shown shuffled; the right answer is 0 → 1 → 2 */
const ORDER_SHOWN = [2, 0, 1]
const GRADES = [{ letter: 'O', name: '傑出' }, { letter: 'E', name: '超乎預期' }, { letter: 'A', name: '合格' }]

const exam = reactive({
  started: false,
  q: 0,
  wrong: QUESTIONS.map(() => 0),
  solved: QUESTIONS.map(() => false),
  msg: '',
  pass: '',
  picked: [] as number[],
  wrongPick: -1,
  lit: new Set<number>(),
  note: '點一顆星星。',
  lineDone: false,
  hold: 0,
})
const cur = computed(() => QUESTIONS[exam.q]!)
const solvedNow = computed(() => exam.solved[exam.q]!)
const isLast = computed(() => exam.q === QUESTIONS.length - 1)
/** full marks on the first try, −5 per wrong attempt, never below 10 */
const scoreOf = (i: number) => (exam.solved[i] ? Math.max(POINTS - exam.wrong[i]! * 5, 10) : 0)
const gradeOf = (i: number) => GRADES[Math.min(exam.wrong[i]!, GRADES.length - 1)]!
const total = computed(() => QUESTIONS.reduce((s, _, i) => s + scoreOf(i), 0))
const { active: ansShaking, fire: shakeAns } = useRetrigger()

function resetExam() {
  Object.assign(exam, { started: false, wrong: QUESTIONS.map(() => 0), solved: QUESTIONS.map(() => false) })
  openQuestion(0)
}
function openQuestion(i: number) {
  cancelAnimationFrame(holdRaf)
  Object.assign(exam, { q: i, msg: '', pass: '', picked: [], wrongPick: -1, note: '點一顆星星。', lineDone: false, hold: 0 })
  exam.lit.clear()
}
function solve() { exam.solved[exam.q] = true; exam.msg = '' }
function markWrong(msg: string) {
  exam.wrong[exam.q]!++
  exam.msg = msg
  shakeAns()
}
function nextQuestion() {
  if (isLast.value) go('result')
  else openQuestion(exam.q + 1)
}

/* 一、填空題 */
function submitPass() {
  const v = exam.pass.trim()
  if (!v) { exam.msg = '請先寫下答案。'; return }
  if (checkPassword(v)) return solve()
  markWrong(hintFor('答案不正確……再想想？', exam.wrong[exam.q]!))
}
/* 二、排序題 */
function pickMemory(m: number) {
  if (solvedNow.value || exam.picked.includes(m) || exam.picked.length >= MEMORIES.length) return
  exam.picked.push(m)
  exam.msg = ''
  if (exam.picked.length < MEMORIES.length) return
  if (exam.picked.every((v, i) => v === i)) return solve()
  markWrong('順序不對，記憶有點錯亂了……再排一次。')
  later(() => { exam.picked = [] }, 800)
}
/* 三、選擇題 */
function pickOption(i: number) {
  if (solvedNow.value) return
  if (i === C.forest.correctIndex) { exam.wrongPick = -1; return solve() }
  exam.wrongPick = i
  markWrong(`教授搖搖頭：${C.forest.wrongRoast}`)
}
/* 四、天文學實作 */
function lightStar(i: number) {
  exam.note = `星星${'一二三四五'[i]}：${C.tower.messages[i]}`
  if (exam.lit.has(i)) return
  exam.lit.add(i)
  if (exam.lit.size === STAR_PTS.length) {
    exam.lineDone = true
    later(solve, reduce ? 0 : 1600)
  }
}
/* 五、魔咒學實作：按住魔杖 */
let holdStart = 0, holdRaf = 0
function holdTick(t: number) {
  exam.hold = Math.min((t - holdStart) / 1600, 1)
  if (exam.hold < 1) holdRaf = requestAnimationFrame(holdTick)
  else solve()
}
function holdDown(e: PointerEvent) {
  e.preventDefault()
  holdStart = performance.now()
  holdRaf = requestAnimationFrame(holdTick)
}
function holdUp() {
  cancelAnimationFrame(holdRaf)
  if (!solvedNow.value) exam.hold = 0
}

/* 3. report card: a short "marking" pause, then grades + admission stamp */
const grading = ref(false)
function startResult() {
  grading.value = true
  later(() => { grading.value = false }, reduce ? 0 : 2400)
}
function devQuestion(i: number) {
  devOpen.value = false
  exam.started = true
  openQuestion(i)
  go('exam')
}

/* 4. finale */
const letterOpen = ref(false)
const lineDrawn = ref(false)
function startFinale() {
  lineDrawn.value = false
  later(() => { lineDrawn.value = true }, reduce ? 0 : 1800)
}

/* 5. end: a sealed book for next year — it sparks when tapped but will not open yet */
const NC = C.nextChapter
const { days: daysLeft, label: revealLabel } = countdownTo(NC.revealDate)
const SEAL_LINES = ['封印紋絲不動……', '書裡傳來輕輕翻頁的聲音……', `還不是時候。再等 ${daysLeft} 天吧。`]
const sealMsg = ref('')
let sealTaps = 0
const { active: bookShaking, fire: shakeBook } = useRetrigger()
function tapBook(e: MouseEvent) {
  sealMsg.value = SEAL_LINES[Math.min(sealTaps++, SEAL_LINES.length - 1)]!
  shakeBook()
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  burst(r.left + r.width / 2, r.top + r.height / 2)
}

function resetScene(id: Scene) {
  if (id === 'envelope') envelopeOpen.value = false
  if (id === 'exam') resetExam()
  if (id === 'finale') letterOpen.value = false
}
function restart() {
  ;(['envelope', 'exam', 'finale'] as Scene[]).forEach(resetScene)
  sealMsg.value = ''
  sealTaps = 0
  go('envelope')
}

/* ---------- sky + fireworks (canvas) ---------- */
const sky = ref<HTMLCanvasElement>()
type Star = { x: number; y: number; r: number; p: number }
type Spark = { x: number; y: number; vx: number; vy: number; life: number; c: string }
let cx: CanvasRenderingContext2D, W = 0, H = 0, raf = 0
let stars: Star[] = [], sparks: Spark[] = [], shoot: { x: number; y: number; l: number } | null = null

function size() {
  const cv = sky.value!, d = devicePixelRatio || 1
  W = innerWidth; H = innerHeight
  cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0)
  stars = Array.from({ length: Math.round(W * H / 3500) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + .2, p: Math.random() * 6.28 }))
}
function dot(x: number, y: number, r: number) { cx.beginPath(); cx.arc(x, y, r, 0, 6.28); cx.fill() }
function burst(x: number, y: number) {
  const hue = ['#e3c27c', '#9ad8ff', '#f2e7c9', '#ffb4c8'][Math.floor(Math.random() * 4)]!
  for (let i = 0; i < 70; i++) {
    const a = Math.random() * 6.28, v = Math.random() * 3.2 + 1
    sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c: hue })
  }
}
function frame(t: number) {
  cx.globalAlpha = 1; cx.fillStyle = '#0a0d22'; cx.fillRect(0, 0, W, H)
  cx.fillStyle = '#f2e7c9'
  for (const s of stars) {
    cx.globalAlpha = reduce ? .7 : .35 + .65 * Math.abs(Math.sin(t / 1400 + s.p))
    dot(s.x, s.y, s.r)
  }
  if (!reduce) {
    if (!shoot && Math.random() < .004) shoot = { x: Math.random() * W, y: Math.random() * H * .4, l: 1 }
    if (shoot) {
      cx.globalAlpha = shoot.l; cx.strokeStyle = '#f2e7c9'; cx.lineWidth = 1.2
      cx.beginPath(); cx.moveTo(shoot.x, shoot.y); cx.lineTo(shoot.x - 60, shoot.y - 25); cx.stroke()
      shoot.x += 9; shoot.y += 4; shoot.l -= .02; if (shoot.l <= 0) shoot = null
    }
    for (const p of sparks) {
      p.x += p.vx; p.y += p.vy; p.vy += .04; p.vx *= .985; p.life -= .012
      cx.globalAlpha = Math.max(p.life, 0); cx.fillStyle = p.c
      dot(p.x, p.y, 1.8)
    }
    sparks = sparks.filter(p => p.life > 0)
  }
  cx.globalAlpha = 1
  raf = requestAnimationFrame(frame)
}

onMounted(() => {
  cx = sky.value!.getContext('2d')!
  size()
  addEventListener('resize', size)
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => {
  removeEventListener('resize', size)
  cancelAnimationFrame(raf)
  cancelAnimationFrame(holdRaf)
})
</script>

<template>
  <div class="star-card">
    <canvas ref="sky" class="sky" aria-hidden="true"></canvas>

    <nav class="dev" aria-label="場景目錄（原型測試用）">
      <button :aria-expanded="devOpen" @click="devOpen = !devOpen">SCENES</button>
      <ul v-if="devOpen">
        <li v-for="s in SCENES" :key="s.id"><button @click="devJump(s.id)">{{ s.label }}</button></li>
        <li v-for="(q, i) in QUESTIONS" :key="q.kind"><button @click="devQuestion(i)">　└ 第 {{ i + 1 }} 題 {{ q.subject }}</button></li>
      </ul>
    </nav>

    <main>
      <!-- 1. Envelope -->
      <section v-if="scene === 'envelope'" class="scene">
        <div class="col">
          <!-- owl flies in with the letter in its beak, drops it, then hovers until the seal is broken -->
          <svg class="owl" :class="{ leave: envelopeOpen }" viewBox="0 0 200 150" aria-hidden="true">
            <g class="wing l">
              <path d="M80 70 C52 48 22 50 6 64 C24 69 40 80 52 92 C62 99 73 97 82 88 Z" fill="#f4f2ec" stroke="#6e6a62" stroke-width="2.5" stroke-linejoin="round" />
              <path d="M20 64 C34 68 46 76 56 86 M34 58 C46 64 56 72 64 82" fill="none" stroke="#c9c4b8" stroke-width="1.5" stroke-linecap="round" />
              <path d="M26 62 h3 M40 66 h3 M50 74 h3 M58 82 h3 M46 60 h2.5 M62 70 h2.5" stroke="#8d887d" stroke-width="2" stroke-linecap="round" />
            </g>
            <g class="wing r">
              <path d="M120 70 C148 48 178 50 194 64 C176 69 160 80 148 92 C138 99 127 97 118 88 Z" fill="#f4f2ec" stroke="#6e6a62" stroke-width="2.5" stroke-linejoin="round" />
              <path d="M180 64 C166 68 154 76 144 86 M166 58 C154 64 144 72 136 82" fill="none" stroke="#c9c4b8" stroke-width="1.5" stroke-linecap="round" />
              <path d="M171 62 h3 M157 66 h3 M147 74 h3 M139 82 h3 M151.5 60 h2.5 M135.5 70 h2.5" stroke="#8d887d" stroke-width="2" stroke-linecap="round" />
            </g>
            <path d="M93 118 l-2 6 M97 119 v6 M103 119 v6 M107 118 l2 6" stroke="#4a4740" stroke-width="2" stroke-linecap="round" />
            <ellipse cx="100" cy="88" rx="26" ry="32" fill="#fbfaf6" stroke="#6e6a62" stroke-width="2.5" />
            <ellipse cx="100" cy="97" rx="16" ry="21" fill="#ffffff" />
            <path d="M92 90 h2.5 M105 90 h2.5 M98.5 98 h2.5 M90 106 h2.5 M107 106 h2.5 M84 98 h2 M114 98 h2" stroke="#a9a498" stroke-width="1.8" stroke-linecap="round" />
            <ellipse cx="100" cy="52" rx="27" ry="24" fill="#fbfaf6" stroke="#6e6a62" stroke-width="2.5" />
            <path d="M84 34 h2 M98 31 h2 M112 34 h2" stroke="#b5b0a4" stroke-width="1.6" stroke-linecap="round" />
            <circle cx="89" cy="53" r="12" fill="#efece4" />
            <circle cx="111" cy="53" r="12" fill="#efece4" />
            <g class="eyes">
              <circle cx="89" cy="52" r="8" fill="#ffc93a" stroke="#6e6a62" stroke-width="1.5" />
              <circle cx="111" cy="52" r="8" fill="#ffc93a" stroke="#6e6a62" stroke-width="1.5" />
              <circle cx="89" cy="52" r="4.2" fill="#1b1206" />
              <circle cx="111" cy="52" r="4.2" fill="#1b1206" />
              <circle cx="90.6" cy="50.4" r="1.5" fill="#fff" />
              <circle cx="112.6" cy="50.4" r="1.5" fill="#fff" />
            </g>
            <g class="held" transform="rotate(-8 100 72)">
              <rect x="85" y="62" width="30" height="20" rx="2" fill="#f2e7c9" stroke="#8f7a4c" stroke-width="1.5" />
              <path d="M85 62 L100 73 L115 62" fill="none" stroke="#c9b48a" stroke-width="1.2" />
              <circle cx="100" cy="73" r="3.4" fill="#8d2331" />
            </g>
            <path d="M95.5 58 L104.5 58 L100 68 Z" fill="#3a3833" stroke="#1f1e1b" stroke-width="1.5" stroke-linejoin="round" />
          </svg>

          <div class="drop">
            <div class="envelope" :class="{ open: envelopeOpen }">
              <div class="flap"></div>
              <button class="seal" :disabled="!owlLanded" aria-label="點擊蠟封，打開霍格華茲的信" @click="openEnvelope">H</button>
            </div>
          </div>

          <div class="notice">
            <div class="eyebrow">Owl Post · Hogwarts</div>
            <h1>一封來自霍格華茲的通知</h1>
            <p class="to">致　<span :class="{ ph: isTodo(C.friendName) }">{{ C.friendName }}</span></p>
            <p>點一下蠟封，打開信件。</p>
          </div>
        </div>
      </section>

      <!-- 1b. Acceptance letter -->
      <section v-else-if="scene === 'letter'" class="scene tall">
        <div class="col">
          <div class="letter-stage">
            <article class="parchment" :class="{ burning: letterBurn }">
              <svg class="crest" viewBox="0 0 120 150" role="img" aria-label="霍格華茲校徽">
                <defs>
                  <clipPath id="hw-shield"><path d="M20 16 H100 V68 C100 98 82 116 60 128 C38 116 20 98 20 68 Z" /></clipPath>
                </defs>
                <g clip-path="url(#hw-shield)">
                  <rect x="20" y="16" width="40" height="56" fill="#7f1d1d" />
                  <rect x="60" y="16" width="40" height="56" fill="#1f4d2b" />
                  <rect x="20" y="72" width="40" height="56" fill="#c99a1e" />
                  <rect x="60" y="72" width="40" height="56" fill="#1e3566" />
                </g>
                <path d="M60 16 V128 M20 72 H100" stroke="#e3c27c" stroke-width="3" />
                <g class="crest-initial">
                  <text x="40" y="52">G</text><text x="80" y="52">S</text>
                  <text x="40" y="100">H</text><text x="80" y="100">R</text>
                </g>
                <path d="M20 16 H100 V68 C100 98 82 116 60 128 C38 116 20 98 20 68 Z" fill="none" stroke="#b8902f" stroke-width="3.5" stroke-linejoin="round" />
                <path d="M48 58 H72 V76 C72 84 66 89 60 92 C54 89 48 84 48 76 Z" fill="#2a1f0a" stroke="#e3c27c" stroke-width="2" />
                <text x="60" y="83" class="crest-h">H</text>
                <path d="M6 126 Q60 146 114 126 L110 138 Q60 158 10 138 Z" fill="#efe2c2" stroke="#8f7a4c" stroke-width="1.5" />
                <text x="60" y="141" class="crest-motto">DRACO DORMIENS NUNQUAM TITILLANDUS</text>
              </svg>
              <h2 class="hw-title">{{ HW.school }}</h2>
              <div class="hw-latin">{{ HW.schoolLatin }}</div>
              <div class="hw-head">{{ HW.headmaster }}</div>
              <div class="hw-rule" aria-hidden="true">— ❦ —</div>
              <p class="hw-greet">{{ HW.greeting }}</p>
              <p v-for="(para, i) in HW.body" :key="i" class="hw-body">{{ para }}</p>
              <p class="hw-sign">{{ HW.closingTitle }}<br><span class="sig">{{ HW.signature }}</span></p>
            </article>
            <div v-if="letterSmoke" class="smoke" aria-hidden="true"><i v-for="n in 7" :key="n"></i></div>
            <div v-if="letterBurn" class="embers" aria-hidden="true">
              <i
                v-for="(e, i) in EMBERS" :key="i"
                :style="{ left: e.left, bottom: e.bottom, width: e.size, height: e.size, animationDuration: e.dur, animationDelay: e.delay, '--dx': e.dx }"
              ></i>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Entrance exam -->
      <section v-else-if="scene === 'exam'" class="scene tall">
        <div class="col">
          <!-- exam hall: candidate card + rules -->
          <article v-if="!exam.started" class="parchment exam-paper">
            <div class="hw-latin center">Hogwarts Entrance Examination</div>
            <h2 class="hw-title center">霍格華茲入學考試</h2>
            <dl class="candidate">
              <div><dt>考生</dt><dd>{{ C.friendName }}</dd></div>
              <div><dt>准考證號</dt><dd>{{ CANDIDATE_NO }}</dd></div>
              <div><dt>考場</dt><dd>霍格華茲大廳</dd></div>
            </dl>
            <div class="rules">
              <h3>考生須知</h3>
              <ol>
                <li>本試卷共 {{ QUESTIONS.length }} 題，每題 {{ POINTS }} 分，滿分 100 分。</li>
                <li>請以羽毛筆作答（點選畫面即可）。答錯可以重答，但會被教授扣分。</li>
                <li>本考試不限時間，但妳的貓頭鷹正在窗外等候。</li>
                <li>嚴禁使用「速速前」召喚答案，違者以零分計算。</li>
              </ol>
            </div>
            <button class="ink-btn" @click="exam.started = true">翻開試卷，開始作答</button>
          </article>

          <!-- exam paper -->
          <article v-else class="parchment exam-paper">
            <header class="paper-head">
              <div>
                <div class="hw-latin">Entrance Examination</div>
                <div class="paper-title">入學考試　試題卷</div>
              </div>
              <svg class="hourglass" viewBox="0 0 40 60" aria-hidden="true">
                <path d="M11 6 C11 22 20 26 20 30 C20 34 11 38 11 54 H29 C29 38 20 34 20 30 C20 26 29 22 29 6 Z" fill="#fff8e6aa" stroke="#5a3a18" stroke-width="1.5" />
                <path class="sand-top" d="M13 11 H27 C27 19 21 24 20 28 C19 24 13 19 13 11 Z" fill="#d9a441" />
                <path class="sand-bot" d="M12.5 53 H27.5 C27.5 46 22 43.5 20 43.5 C18 43.5 12.5 46 12.5 53 Z" fill="#d9a441" />
                <line class="stream" x1="20" y1="29" x2="20" y2="52" stroke="#d9a441" stroke-width="1" />
                <path d="M7 4 H33 M7 56 H33" stroke="#5a3a18" stroke-width="3.5" stroke-linecap="round" />
              </svg>
            </header>
            <div class="paper-meta"><span>考生：{{ C.friendName }}</span><span>准考證號：{{ CANDIDATE_NO }}</span></div>
            <ol class="qnav" aria-label="作答進度">
              <li
                v-for="(q, i) in QUESTIONS" :key="i" :class="{ cur: i === exam.q, done: exam.solved[i] }"
                :aria-label="`第 ${i + 1} 題${exam.solved[i] ? '（已作答）' : ''}`"
              >{{ exam.solved[i] && i !== exam.q ? '✓' : i + 1 }}</li>
            </ol>

            <div :key="exam.q" class="question" :class="{ shake: ansShaking }">
              <h3 class="q-title">{{ cur.no }}、{{ cur.subject }}<small>（{{ cur.type }}・{{ POINTS }} 分）</small></h3>
              <p class="q-prompt"><span :class="{ ph: isTodo(cur.prompt) }">{{ cur.prompt }}</span></p>

              <!-- 一、填空題 -->
              <form v-if="cur.kind === 'password'" class="answer-line" novalidate @submit.prevent="submitPass">
                <label for="examPass">答：</label>
                <input id="examPass" v-model="exam.pass" :disabled="solvedNow" autocomplete="off" :placeholder="C.password.inputPlaceholder" @input="exam.msg = ''">
                <button v-if="!solvedNow" class="ink-btn small">作答</button>
              </form>

              <!-- 二、排序題 -->
              <template v-else-if="cur.kind === 'order'">
                <ul class="answers">
                  <li v-for="m in ORDER_SHOWN" :key="m">
                    <button class="answer" :class="{ picked: exam.picked.includes(m) }" :disabled="solvedNow" @click="pickMemory(m)">
                      <span class="bubble">{{ exam.picked.includes(m) ? exam.picked.indexOf(m) + 1 : '' }}</span>
                      <span :class="{ ph: isTodo(MEMORIES[m]!) }">{{ MEMORIES[m] }}</span>
                    </button>
                  </li>
                </ul>
                <button v-if="exam.picked.length && !solvedNow" class="ink-btn ghost small" @click="exam.picked = []">擦掉重排</button>
              </template>

              <!-- 三、選擇題 -->
              <template v-else-if="cur.kind === 'choice'">
                <ul class="answers">
                  <li v-for="(o, i) in C.forest.options" :key="i">
                    <button
                      class="answer" :class="{ wrong: exam.wrongPick === i, right: solvedNow && i === C.forest.correctIndex }"
                      :disabled="solvedNow" @click="pickOption(i)"
                    >
                      <span class="bubble">{{ 'ABCDEFGH'[i] }}</span><span>{{ o }}</span>
                    </button>
                  </li>
                </ul>
                <p v-if="solvedNow" class="reveal"><span :class="{ ph: isTodo(C.forest.story) }">{{ C.forest.story }}</span></p>
              </template>

              <!-- 四、天文學實作 -->
              <template v-else-if="cur.kind === 'stars'">
                <div class="sky-box">
                  <svg viewBox="0 0 100 100" aria-hidden="true">
                    <polyline
                      :points="STAR_PTS.map(p => p.join(',')).join(' ')" fill="none" stroke="#e3c27c" stroke-width=".5"
                      stroke-dasharray="160" :stroke-dashoffset="exam.lineDone ? 0 : 160" style="transition: stroke-dashoffset 1.6s"
                    />
                  </svg>
                  <button
                    v-for="([x, y], i) in STAR_PTS" :key="i" class="star" :class="{ lit: exam.lit.has(i) }"
                    :style="{ left: x + '%', top: y + '%' }" :aria-label="`第 ${i + 1} 顆星`" @click="lightStar(i)"
                  >✦</button>
                </div>
                <p class="reveal">{{ exam.note }}</p>
              </template>

              <!-- 五、魔咒學實作 -->
              <template v-else-if="cur.kind === 'spell'">
                <template v-if="solvedNow">
                  <img v-if="C.spring.photo" class="photo" :src="C.spring.photo" alt="我們的合照">
                  <div v-else class="photo">【待放：你們最近的合照】</div>
                  <p class="reveal"><span :class="{ ph: isTodo(C.spring.message) }">{{ C.spring.message }}</span></p>
                </template>
                <template v-else>
                  <button
                    class="hold" @pointerdown="holdDown" @pointerup="holdUp" @pointerleave="holdUp" @pointercancel="holdUp"
                    @keydown.enter.space.prevent="solve"
                  >
                    <svg viewBox="0 0 128 128" aria-hidden="true">
                      <circle cx="64" cy="64" r="60" fill="none" stroke="#1f2656" stroke-width="4" />
                      <circle cx="64" cy="64" r="60" fill="none" stroke="#9ad8ff" stroke-width="4" :stroke-dasharray="RING_C" :stroke-dashoffset="RING_C * (1 - exam.hold)" stroke-linecap="round" />
                    </svg>
                    <span style="position: relative">按住魔杖<br>施咒</span>
                  </button>
                  <p class="q-hint">按住不放，直到光環繞滿一圈。</p>
                </template>
              </template>

              <p class="red-ink" role="status">{{ exam.msg }}</p>
              <div v-if="solvedNow" class="mark" aria-label="答對">
                <span class="tick">✓</span><span class="pts">+{{ scoreOf(exam.q) }}</span>
              </div>
            </div>

            <footer class="paper-foot">
              <span>第 {{ exam.q + 1 }} 題／共 {{ QUESTIONS.length }} 題</span>
              <button v-if="solvedNow" class="ink-btn" @click="nextQuestion">{{ isLast ? '交卷' : '下一題 →' }}</button>
            </footer>
          </article>
        </div>
      </section>

      <!-- 3. Report card -->
      <section v-else-if="scene === 'result'" class="scene tall">
        <div class="col">
          <article class="parchment exam-paper">
            <div class="hw-latin center">Examination Results</div>
            <h2 class="hw-title center">入學考試成績單</h2>
            <div class="paper-meta"><span>考生：{{ C.friendName }}</span><span>准考證號：{{ CANDIDATE_NO }}</span></div>

            <div v-if="grading" class="grading" role="status">
              <svg class="quill" viewBox="0 0 60 60" aria-hidden="true">
                <path d="M50 4 C30 8 16 22 10 46 C24 40 40 26 50 4 Z" fill="#f6ecd2" stroke="#5a3a18" stroke-width="1.5" />
                <path d="M50 4 C38 18 24 32 10 46 L6 56" fill="none" stroke="#5a3a18" stroke-width="1.5" stroke-linecap="round" />
              </svg>
              <span>教授閱卷中……</span>
            </div>

            <template v-else>
              <table class="report">
                <thead><tr><th>科目</th><th>題型</th><th>評等</th><th class="num">得分</th></tr></thead>
                <tbody>
                  <tr v-for="(q, i) in QUESTIONS" :key="i" :style="{ animationDelay: `${i * .15}s` }">
                    <td>{{ q.subject }}</td>
                    <td>{{ q.type }}</td>
                    <td><b class="grade">{{ gradeOf(i).letter }}</b> {{ gradeOf(i).name }}</td>
                    <td class="num">{{ scoreOf(i) }}</td>
                  </tr>
                </tbody>
              </table>
              <div class="total">總分　<b>{{ total }}</b> / 100</div>
              <p class="legend">評等：O 傑出・E 超乎預期・A 合格</p>
              <div class="admit-stamp" aria-label="錄取">錄取<small>ADMITTED</small></div>
              <p class="hw-body">恭喜妳通過入學考試。霍格華茲的大門已經為妳打開，入學典禮即將開始。</p>
              <button class="ink-btn" @click="go('finale')">前往入學典禮</button>
            </template>
          </article>
        </div>
      </section>

      <!-- 4. Finale -->
      <section v-else-if="scene === 'finale'" class="scene">
        <div class="col">
          <div class="eyebrow">Welcome to Hogwarts</div>
          <h2>入學典禮：星光為妳升起</h2>
          <div class="constellation">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <polyline
                points="20,30 75,22 80,72 30,78 20,30" fill="none" stroke="#e3c27c" stroke-width=".4"
                stroke-dasharray="200" :style="{ strokeDashoffset: lineDrawn ? 0 : 200, transition: lineDrawn ? 'stroke-dashoffset 2s' : 'none' }"
              />
            </svg>
            <div
              v-for="([x, y], i) in CRYSTAL_PTS" :key="i" class="crystal"
              :style="{ left: x + '%', top: y + '%', animationDelay: i * .3 + 's' }"
            ></div>
          </div>
          <button v-if="!letterOpen" class="btn" @click="letterOpen = true">展開祝福信</button>
          <template v-else>
            <div class="letter">
              <p>親愛的 <span :class="{ ph: isTodo(C.friendName) }">{{ C.friendName }}</span>：</p>
              <p v-for="(line, i) in [C.letter.opening, C.letter.middle, C.letter.closing]" :key="i"><span :class="{ ph: isTodo(line) }">{{ line }}</span></p>
              <p class="sign">
                —— <span :class="{ ph: isTodo(C.letter.signature) }">{{ C.letter.signature }}</span>，<span :class="{ ph: isTodo(C.letter.date) }">{{ C.letter.date }}</span>
              </p>
            </div>
            <button class="btn" @click="go('egg')">咦？好像有什麼在發光……</button>
          </template>
        </div>
      </section>

      <!-- 4b. Easter egg: the ring -->
      <section v-else-if="scene === 'egg'" class="scene tall">
        <div class="col"><RingEgg theme="magic" @done="go('end')" /></div>
      </section>

      <!-- 5. End -->
      <section v-else-if="scene === 'end'" class="scene tall">
        <div class="col">
          <div class="eyebrow">To be continued</div>

          <button class="tome" :class="{ shake: bookShaking }" aria-label="封印中的第二學年魔法書（還打不開）" @click="tapBook">
            <svg viewBox="0 0 240 260" aria-hidden="true">
              <defs>
                <linearGradient id="tome-leather" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#4a2a63" /><stop offset="1" stop-color="#1c0f2a" />
                </linearGradient>
              </defs>
              <!-- rune rings -->
              <g class="ring r1">
                <circle cx="120" cy="130" r="112" fill="none" stroke="#e3c27c" stroke-opacity=".5" stroke-width="1" stroke-dasharray="2 7" />
                <path v-for="a in 12" :key="a" :transform="`rotate(${a * 30} 120 130)`" d="M120 14 l3 5 -3 5 -3 -5z" fill="#e3c27c" fill-opacity=".7" />
              </g>
              <g class="ring r2">
                <circle cx="120" cy="130" r="98" fill="none" stroke="#9ad8ff" stroke-opacity=".35" stroke-width="1" stroke-dasharray="14 6 2 6" />
              </g>
              <!-- book -->
              <rect x="66" y="42" width="116" height="172" rx="4" fill="#e8dcc0" />
              <path d="M170 48 V206 M174 50 V204 M178 52 V202" stroke="#c9b48a" stroke-width="1" />
              <rect x="56" y="36" width="116" height="176" rx="6" fill="url(#tome-leather)" stroke="#e3c27c" stroke-width="2" />
              <rect x="56" y="36" width="14" height="176" rx="4" fill="#160a22" />
              <path d="M74 44 h14 M74 44 v14 M164 44 h-14 M164 44 v14 M74 204 h14 M74 204 v-14 M164 204 h-14 M164 204 v-14" stroke="#e3c27c" stroke-width="2.5" stroke-linecap="round" />
              <text x="117" y="86" class="tome-numeral">II</text>
              <text x="117" y="104" class="tome-sub">SECOND YEAR</text>
              <!-- crossed sealing straps -->
              <path d="M58 132 L170 178 L170 190 L58 144 Z" fill="#2a1a10" stroke="#e3c27c" stroke-width="1.5" />
              <path d="M58 178 L170 132 L170 144 L58 190 Z" fill="#2a1a10" stroke="#e3c27c" stroke-width="1.5" />
              <!-- wax seal -->
              <circle cx="114" cy="161" r="17" fill="#8d2331" stroke="#5e1420" stroke-width="2" />
              <circle cx="114" cy="161" r="12" fill="none" stroke="#c4434f" stroke-width="1" stroke-dasharray="2 2" />
              <text x="114" y="168" class="tome-seal">?</text>
            </svg>
          </button>
          <p class="seal-msg" role="status">{{ sealMsg || '（輕輕點一下封印）' }}</p>

          <h1>{{ NC.title }}</h1>
          <p>{{ NC.teaser }}</p>

          <div class="countdown">
            <div class="eyebrow">封印解除倒數</div>
            <div class="days"><b>{{ daysLeft }}</b><span>天</span></div>
            <div class="reveal-date">將於 {{ revealLabel }} 揭曉</div>
          </div>

          <div class="secret-toc" aria-label="第二學年目錄（尚未揭曉）">
            <div class="eyebrow">第二學年・目錄</div>
            <ol><li v-for="(s, i) in NC.secretContents" :key="i"><span aria-hidden="true">{{ s }}</span></li></ol>
          </div>

          <p class="final-line"><span :class="{ ph: isTodo(C.finalLine) }">{{ C.finalLine }}</span></p>
          <button class="btn ghost" @click="restart">重新開始旅程</button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* Layout: one full-screen scene at a time over a live starfield; mobile-first, centered column max 30rem. Deliberately single dark theme (night sky). */
.star-card {
  --night: #0a0d22;
  --ink: #151a3e;
  --ink-2: #1f2656;
  --gold: #e3c27c;
  --gold-dim: #8f7a4c;
  --parchment: #f2e7c9;
  --parch-ink: #3a2c17;
  --paper: #f2e7c9;
  --mist: #aab1d8;
  --crystal: #9ad8ff;
  --danger: #ff9b9b;
  --f-display: "Noto Serif TC", "Songti TC", serif;
  --f-latin: "Cinzel", "Times New Roman", serif;
  --f-hand: "LXGW WenKai TC", "Kaiti TC", "KaiTi", serif;
  color-scheme: dark;
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: var(--night);
  color: var(--parchment);
  font-family: var(--f-display);
  font-size: 16px;
  line-height: 1.7;
}
.sky { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
main { position: relative; height: 100%; padding-inline: 16px; }
.scene {
  position: absolute; inset: 0; padding: 4.5rem 16px 2rem;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1.25rem; text-align: center; overflow-y: auto; overflow-x: hidden;
  animation: fadeIn .8s ease both;
}
.col { width: 100%; max-width: 30rem; display: flex; flex-direction: column; align-items: center; gap: 1.25rem; }
.eyebrow { font-family: var(--f-latin); font-size: .75rem; letter-spacing: .3em; color: var(--gold); text-transform: uppercase; }
h1, h2 { font-weight: 700; text-wrap: balance; margin: 0; letter-spacing: .06em; }
h1 { font-size: clamp(1.75rem, 7vw, 2.4rem); }
h2 { font-size: 1.5rem; }
p { margin: 0; color: var(--mist); max-width: 26rem; }
.ph { color: var(--gold); border-bottom: 1px dashed var(--gold-dim); }
button { font: inherit; cursor: pointer; }
.btn {
  border: 1px solid var(--gold); background: transparent; color: var(--gold);
  padding: .6rem 1.6rem; border-radius: 999px; letter-spacing: .12em;
  transition: background .3s, color .3s;
}
.btn:hover, .btn:focus-visible { background: var(--gold); color: var(--night); }
.btn.ghost { border-color: transparent; color: var(--mist); font-size: .9rem; }
.btn.ghost:hover { background: transparent; color: var(--gold); }
:focus-visible { outline: 2px solid var(--crystal); outline-offset: 3px; }

/* Envelope */
.envelope { position: relative; width: min(78vw, 20rem); aspect-ratio: 3 / 2; background: var(--paper); border-radius: 6px; animation: float 4s ease-in-out infinite; }
.envelope::before { content: ""; position: absolute; inset: 0; background: linear-gradient(to bottom right, transparent 49.5%, #d8c9a2 50%, transparent 50.5%), linear-gradient(to bottom left, transparent 49.5%, #d8c9a2 50%, transparent 50.5%); border-radius: 6px; }
.flap { position: absolute; left: 0; right: 0; top: 0; height: 55%; background: #e6d8b2; clip-path: polygon(0 0, 100% 0, 50% 100%); transform-origin: top; transition: transform .9s ease; }
.seal { position: absolute; left: 50%; top: 55%; width: 4.2rem; height: 4.2rem; translate: -50% -50%; border-radius: 50%; border: none; background: #8d2331; color: var(--gold); font-family: var(--f-latin); font-size: 1.6rem; box-shadow: 0 0 0 4px #6d1a25, 0 0 24px #e3c27c55; animation: pulse 2s ease-in-out infinite; }
.envelope.open .flap { transform: rotateX(180deg); }
.envelope.open .seal { animation: crack .6s forwards; }
.seal:disabled { cursor: default; }

/* Owl post: fly in (2.2s) → release the letter → hover; the envelope falls from the beak */
.owl { width: min(52vw, 13rem); margin-bottom: -1.5rem; animation: owlIn 2.2s cubic-bezier(.25, .8, .35, 1) both, hover 3s ease-in-out 2.2s infinite; }
.owl.leave { animation: owlOut 1s ease-in forwards; }
.owl .wing { transform-box: view-box; animation: flapL .32s ease-in-out infinite alternate; }
.owl .wing.l { transform-origin: 80px 72px; }
.owl .wing.r { transform-origin: 120px 72px; animation-name: flapR; }
.owl .eyes { transform-box: fill-box; transform-origin: center; animation: blink 4.5s 3s infinite; }
.owl .held { animation: release .15s 2.1s forwards; }
.drop { animation: letterDrop .9s cubic-bezier(.3, 1.2, .5, 1) 2.1s both; }
.notice { display: flex; flex-direction: column; align-items: center; gap: .6rem; animation: fadeIn .9s ease 2.8s both; }
.notice .to { font-family: var(--f-hand); font-size: 1.35rem; color: var(--parchment); letter-spacing: .08em; }

/* Acceptance letter on parchment, then it burns from the bottom up */
@property --burn { syntax: '<percentage>'; inherits: true; initial-value: -8%; }
.scene.tall { justify-content: flex-start; }
.letter-stage { position: relative; width: 100%; max-width: 30rem; filter: drop-shadow(0 14px 26px #000c); }
.parchment {
  --burn: -8%;
  position: relative; display: flex; flex-direction: column; align-items: center; gap: .55rem;
  padding: 2rem 1.6rem 2.2rem; color: #3b2410; text-align: center;
  background:
    radial-gradient(circle at 18% 22%, #b07a3a1f 0 3rem, transparent 3.3rem),
    radial-gradient(circle at 82% 74%, #9a6a2a1a 0 4rem, transparent 4.4rem),
    repeating-linear-gradient(0deg, #00000006 0 1px, transparent 1px 4px),
    radial-gradient(ellipse at 50% 45%, #f6e7c1 0%, #ecd6a4 55%, #d2ad6c 88%, #b88a4a 100%);
  clip-path: polygon(0% 1%, 8% 0%, 20% .8%, 34% 0%, 50% .6%, 66% 0%, 80% .9%, 92% 0%, 100% 1.2%, 99.4% 15%, 100% 32%, 99.2% 50%, 100% 68%, 99.5% 85%, 100% 99%, 90% 100%, 76% 99.2%, 60% 100%, 45% 99.3%, 30% 100%, 15% 99.1%, 0% 100%, .6% 84%, 0% 66%, .8% 48%, 0% 30%, .5% 14%);
  -webkit-mask:
    radial-gradient(ellipse at 22% 108%, transparent var(--burn), #000 calc(var(--burn) + 1%)),
    radial-gradient(ellipse at 84% 104%, transparent calc(var(--burn) - 9%), #000 calc(var(--burn) - 8%));
  -webkit-mask-composite: source-in;
  mask:
    radial-gradient(ellipse at 22% 108%, transparent var(--burn), #000 calc(var(--burn) + 1%)),
    radial-gradient(ellipse at 84% 104%, transparent calc(var(--burn) - 9%), #000 calc(var(--burn) - 8%));
  mask-composite: intersect;
  transform-origin: top center;
  animation: unfold 1s cubic-bezier(.2, .8, .3, 1) both;
}
.parchment::after { /* glowing, charred burn front */
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(ellipse at 22% 108%, transparent var(--burn), #fff1b8 calc(var(--burn) + .6%), #ff8a1e calc(var(--burn) + 2%), #5a2208 calc(var(--burn) + 5%), #3a1a0800 calc(var(--burn) + 13%)),
    radial-gradient(ellipse at 84% 104%, transparent calc(var(--burn) - 9%), #fff1b8 calc(var(--burn) - 8.4%), #ff8a1e calc(var(--burn) - 7%), #5a2208 calc(var(--burn) - 4%), #3a1a0800 calc(var(--burn) + 4%));
  opacity: 0;
}
.parchment.burning { animation: burn 3.2s ease-in forwards; }
.parchment.burning::after { opacity: 1; }
.crest { width: 5.6rem; margin-bottom: .2rem; filter: drop-shadow(0 2px 2px #0004); }
.crest-initial text { font-family: var(--f-latin); font-size: 15px; font-weight: 700; fill: #f2e7c9; text-anchor: middle; opacity: .85; }
.crest-h { font-family: var(--f-latin); font-size: 20px; font-weight: 700; fill: #e3c27c; text-anchor: middle; }
.crest-motto { font-family: var(--f-latin); font-size: 4.6px; letter-spacing: .3px; fill: #5a431a; text-anchor: middle; }
.hw-title { font-size: clamp(1.2rem, 5vw, 1.45rem); letter-spacing: .12em; color: #2e1a08; }
.hw-latin { font-family: var(--f-latin); font-size: .62rem; letter-spacing: .22em; text-transform: uppercase; color: #6b4a22; }
.hw-head { font-size: .9rem; color: #5a3a18; margin-top: .3rem; }
.hw-rule { color: #8a6232; letter-spacing: .4em; }
.parchment p { color: #3b2410; max-width: none; font-family: var(--f-hand); font-size: 1.05rem; line-height: 1.95; }
.hw-greet { align-self: flex-start; margin-top: .2rem !important; }
.hw-body { text-align: left; text-indent: 2em; }
.hw-sign { align-self: flex-end; text-align: right; margin-top: .6rem !important; }
.hw-sign .sig { display: inline-block; font-size: 1.3rem; rotate: -3deg; color: #2a1606; }
.smoke { position: absolute; inset: 0; pointer-events: none; }
.smoke i { position: absolute; bottom: 4%; width: 3.5rem; height: 3.5rem; border-radius: 50%; background: #d8cfc055; filter: blur(12px); animation: smoke 2.6s ease-out infinite; }
.smoke i:nth-child(1) { left: 8%; } .smoke i:nth-child(2) { left: 22%; animation-delay: .4s; } .smoke i:nth-child(3) { left: 38%; animation-delay: .9s; }
.smoke i:nth-child(4) { left: 54%; animation-delay: .2s; } .smoke i:nth-child(5) { left: 68%; animation-delay: 1.2s; } .smoke i:nth-child(6) { left: 80%; animation-delay: .7s; } .smoke i:nth-child(7) { left: 30%; animation-delay: 1.6s; }
.embers { position: absolute; inset: 0; pointer-events: none; }
.embers i { position: absolute; border-radius: 50%; background: #ffb347; box-shadow: 0 0 6px 2px #ff7a1a; opacity: 0; animation: ember linear both; }

.msg { min-height: 1.7em; font-size: .95rem; color: var(--danger); }
.shake { animation: shake .4s; }


/* Location games */
.letter .ph { color: #8a5a1a; border-color: #b08a50; }
.row { display: flex; gap: .75rem; flex-wrap: wrap; justify-content: center; }
.sky-box { position: relative; width: 100%; aspect-ratio: 1; }
.sky-box svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.star { position: absolute; translate: -50% -50%; width: 2.75rem; height: 2.75rem; border: none; background: none; color: var(--mist); font-size: 1.6rem; transition: color .4s, text-shadow .4s; }
.star.lit { color: var(--gold); text-shadow: 0 0 14px var(--gold); }
.note { font-family: var(--f-hand); color: var(--parchment); min-height: 3.4em; }
.hold { position: relative; width: 8rem; height: 8rem; border-radius: 50%; border: none; background: var(--night); color: var(--crystal); touch-action: none; user-select: none; -webkit-user-select: none; }
.hold svg { position: absolute; inset: 0; rotate: -90deg; }
.photo { width: 100%; aspect-ratio: 4 / 3; border: 1px dashed var(--gold-dim); border-radius: 8px; display: grid; place-items: center; color: var(--gold-dim); font-size: .9rem; object-fit: cover; }
.crystal { width: 2.2rem; height: 3.2rem; background: var(--crystal); clip-path: polygon(50% 0, 100% 35%, 50% 100%, 0 35%); filter: drop-shadow(0 0 10px var(--crystal)); animation: float 2.5s ease-in-out infinite; }

/* Finale */
.constellation { position: relative; width: 100%; max-width: 22rem; aspect-ratio: 1; }
.constellation svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.constellation .crystal { position: absolute; translate: -50% -50%; animation: rise 1.6s ease both; }
.letter { background: var(--paper); color: var(--parch-ink); font-family: var(--f-hand); text-align: left; padding: 1.75rem 1.5rem; border-radius: 4px; width: 100%; max-width: 28rem; display: flex; flex-direction: column; gap: .9rem; animation: unroll 1s ease both; font-size: 1.05rem; }
.letter p { color: var(--parch-ink); max-width: none; }
.letter .sign { text-align: right; }
/* Ending: the sealed second-year tome */
.tome { width: min(76vw, 17rem); border: none; background: none; padding: 0; filter: drop-shadow(0 0 18px #9b6bff55); animation: float 4s ease-in-out infinite, glow 3s ease-in-out infinite; }
.tome.shake { animation: shake .4s, glow 3s ease-in-out infinite; }
.tome svg { width: 100%; display: block; }
.tome .ring { transform-box: view-box; transform-origin: 120px 130px; }
.tome .r1 { animation: spin 40s linear infinite; }
.tome .r2 { animation: spin 26s linear infinite reverse; }
.tome-numeral { font-family: var(--f-latin); font-size: 34px; font-weight: 700; fill: #e3c27c; text-anchor: middle; }
.tome-sub { font-family: var(--f-latin); font-size: 7px; letter-spacing: 3px; fill: #c9a86a; text-anchor: middle; }
.tome-seal { font-family: var(--f-latin); font-size: 20px; font-weight: 700; fill: #f2c9a0; text-anchor: middle; }
.seal-msg { min-height: 1.7em; margin-top: -.6rem; font-family: var(--f-hand); color: var(--gold); font-size: .95rem; }
.countdown { display: flex; flex-direction: column; align-items: center; gap: .2rem; padding: 1rem 2rem; border: 1px solid var(--gold-dim); border-radius: 14px; background: #151a3ecc; }
.countdown .days { display: flex; align-items: baseline; gap: .4rem; color: var(--gold); }
.countdown .days b { font-family: var(--f-latin); font-size: 3.2rem; line-height: 1.1; text-shadow: 0 0 20px #e3c27c88; font-variant-numeric: tabular-nums; }
.countdown .reveal-date { font-size: .9rem; color: var(--mist); }
.secret-toc { width: 100%; max-width: 22rem; display: flex; flex-direction: column; gap: .5rem; }
.secret-toc ol { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .45rem; }
.secret-toc li { padding: .45rem .9rem; border-radius: 8px; background: #1f265680; border: 1px dashed #8f7a4c88; overflow: hidden; }
.secret-toc li span { display: block; font-family: var(--f-hand); color: var(--parchment); filter: blur(5px); user-select: none; animation: fog 5s ease-in-out infinite; }
.secret-toc li:nth-child(2) span { animation-delay: 1.6s; }
.secret-toc li:nth-child(3) span { animation-delay: 3.2s; }
.final-line { font-family: var(--f-hand); font-size: 1.25rem; color: var(--parchment); }

/* Entrance exam: parchment exam paper, blue-black answers, red-ink marking */
.exam-paper { align-items: stretch; text-align: left; gap: .9rem; --ink-blue: #1f2f6b; --ink-red: #a31d1d; }
.exam-paper .center { text-align: center; }
.exam-paper .ph { color: #8a5a1a; border-color: #b08a50; }
.exam-paper h3 { margin: 0; }
.ink-btn {
  align-self: center; border: none; border-radius: 6px; padding: .6rem 1.3rem;
  background: #4a2a12; color: #f6e7c1; letter-spacing: .1em; box-shadow: 0 3px 0 #2a1606;
  transition: translate .08s, box-shadow .08s;
}
.ink-btn:active { translate: 0 2px; box-shadow: 0 1px 0 #2a1606; }
.ink-btn.small { padding: .35rem .9rem; font-size: .9rem; }
.ink-btn.ghost { background: transparent; color: #4a2a12; border: 1px solid #8a6232; box-shadow: none; }
.candidate { display: grid; grid-template-columns: repeat(3, 1fr); gap: .6rem; margin: 0; }
.candidate div { border-bottom: 1px dashed #8a6232; padding-bottom: .2rem; }
.candidate dt { font-size: .75rem; color: #6b4a22; }
.candidate dd { margin: 0; font-family: var(--f-hand); font-size: 1.1rem; color: var(--ink-blue); }
.rules { border: 1px solid #8a623266; border-radius: 6px; padding: .8rem 1rem; background: #fff8e633; }
.rules h3 { font-size: 1rem; letter-spacing: .3em; text-align: center; color: #2e1a08; margin-bottom: .3rem; }
.rules ol { margin: 0; padding-left: 1.3rem; }
.rules li { font-family: var(--f-hand); font-size: .98rem; line-height: 1.8; color: #3b2410; }
.paper-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.paper-title { font-size: 1.2rem; font-weight: 700; letter-spacing: .15em; color: #2e1a08; }
.hourglass { width: 1.9rem; flex: none; }
.hourglass .sand-top { transform-box: fill-box; transform-origin: 50% 100%; animation: sandTop 9s linear infinite; }
.hourglass .sand-bot { transform-box: fill-box; transform-origin: 50% 100%; animation: sandBot 9s linear infinite; }
.hourglass .stream { animation: stream .4s steps(2) infinite; }
.paper-meta { display: flex; justify-content: space-between; flex-wrap: wrap; gap: .3rem 1rem; font-size: .85rem; color: #6b4a22; border-bottom: 1px solid #8a623266; padding-bottom: .4rem; }
.qnav { list-style: none; display: flex; justify-content: center; gap: .45rem; margin: 0; padding: 0; }
.qnav li { width: 1.9rem; height: 1.9rem; border-radius: 50%; border: 1.5px solid #8a6232; display: grid; place-items: center; font-size: .8rem; color: #6b4a22; }
.qnav li.done { border-color: var(--ink-red); color: var(--ink-red); }
.qnav li.cur { background: #4a2a12; border-color: #4a2a12; color: #f6e7c1; }
.question { position: relative; display: flex; flex-direction: column; gap: .8rem; animation: fadeIn .6s ease both; }
.q-title { font-size: 1.1rem; color: #2e1a08; padding-right: 4.5rem; }
.q-title small { font-size: .8rem; font-weight: 400; color: #6b4a22; }
.exam-paper .q-prompt, .exam-paper .reveal, .exam-paper .q-hint { font-family: var(--f-hand); font-size: 1.05rem; color: #3b2410; line-height: 1.8; }
.exam-paper .q-hint { text-align: center; font-size: .95rem; color: #6b4a22; }
.exam-paper .reveal { background: #fff8e655; border-left: 3px solid var(--ink-red); padding: .5rem .8rem; border-radius: 0 6px 6px 0; min-height: 2.6em; }
.answer-line { display: flex; align-items: center; gap: .5rem; }
.answer-line label { font-family: var(--f-hand); font-size: 1.15rem; color: #2e1a08; }
.answer-line input { flex: 1; min-width: 0; background: transparent; border: none; border-bottom: 2px solid #5a3a18; padding: .2rem .3rem; font-family: var(--f-hand); font-size: 1.2rem; color: var(--ink-blue); outline: none; }
.answer-line input::placeholder { color: #8a6a4299; }
.answer-line input:focus { border-bottom-color: var(--ink-blue); }
.answers { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .5rem; }
.answer { width: 100%; display: flex; align-items: center; gap: .75rem; text-align: left; padding: .6rem .8rem; border-radius: 8px; border: 1px solid #8a623266; background: #fff8e655; font-family: var(--f-hand); font-size: 1rem; color: #3b2410; transition: border-color .2s, background .2s; }
.answer:not(:disabled):hover { border-color: #5a3a18; background: #fff8e699; }
.answer:disabled { cursor: default; }
.answer .bubble { flex: none; width: 1.8rem; height: 1.8rem; border-radius: 50%; border: 1.5px dashed #8a6232; display: grid; place-items: center; font-family: var(--f-latin); font-weight: 700; color: var(--ink-blue); }
.answer.picked { border-color: var(--ink-blue); }
.answer.picked .bubble, .answer.right .bubble { border-style: solid; border-color: var(--ink-blue); background: var(--ink-blue); color: #fff; }
.answer.right { border-color: var(--ink-blue); }
.answer.wrong { text-decoration: line-through var(--ink-red) 2px; }
.answer.wrong .bubble { border: 1.5px solid var(--ink-red); color: var(--ink-red); }
.red-ink { min-height: 1.5em; font-family: var(--f-hand); color: var(--ink-red); font-size: 1rem; }
.mark { position: absolute; top: -.6rem; right: 0; display: flex; align-items: baseline; gap: .15rem; color: var(--ink-red); font-family: var(--f-hand); rotate: -10deg; animation: markIn .5s cubic-bezier(.2, 1.4, .4, 1) both; }
.mark .tick { font-size: 2.6rem; line-height: 1; }
.mark .pts { font-size: 1.4rem; }
.exam-paper .sky-box { border-radius: 10px; background: radial-gradient(circle at 50% 40%, #1f2656, #0a0d22 75%); box-shadow: inset 0 0 0 2px #5a3a18; }
.exam-paper .hold { align-self: center; color: #f2e7c9; line-height: 1.5; }
.exam-paper .photo { border-color: #8a6232; color: #6b4a22; background: #fff8e655; }
.paper-foot { display: flex; justify-content: space-between; align-items: center; gap: 1rem; border-top: 1px solid #8a623266; padding-top: .7rem; font-size: .85rem; color: #6b4a22; min-height: 3.2rem; }
.paper-foot .ink-btn { align-self: auto; }

/* report card */
.grading { display: flex; flex-direction: column; align-items: center; gap: .6rem; padding: 2.5rem 0; font-family: var(--f-hand); color: #3b2410; }
.quill { width: 3.2rem; animation: write .5s ease-in-out infinite alternate; }
.report { width: 100%; border-collapse: collapse; }
.report th { font-size: .78rem; font-weight: 400; color: #6b4a22; text-align: left; padding: .3rem; border-bottom: 1.5px solid #5a3a18; }
.report td { padding: .5rem .3rem; border-bottom: 1px solid #8a623244; font-family: var(--f-hand); color: #3b2410; }
.report tbody tr { animation: fadeIn .5s ease both; }
.report .num { text-align: right; }
.report td.num { font-size: 1.15rem; color: var(--ink-red); }
.report .grade { font-family: var(--f-latin); font-size: 1.15rem; color: var(--ink-red); }
.total { text-align: right; font-family: var(--f-hand); font-size: 1.1rem; color: #3b2410; }
.total b { font-size: 2.3rem; color: var(--ink-red); border-bottom: 4px double var(--ink-red); line-height: 1.1; }
.exam-paper .legend { font-size: .8rem; color: #6b4a22; text-align: right; font-family: var(--f-display); }
.admit-stamp {
  align-self: center; width: 8rem; height: 8rem; border-radius: 50%; border: 6px double #b3261e;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #b3261e; font-size: 2rem; font-weight: 700; letter-spacing: .3em; text-indent: .3em;
  rotate: -12deg; opacity: .85; mix-blend-mode: multiply;
  animation: stampIn .6s cubic-bezier(.2, 1.4, .4, 1) .9s both;
}
.admit-stamp small { font-family: var(--f-latin); font-size: .62rem; letter-spacing: .25em; text-indent: .25em; }
@media (max-width: 420px) { .candidate { grid-template-columns: 1fr 1fr; } .candidate div:last-child { grid-column: 1 / -1; } }

/* Scene index (prototype only) */
.dev { position: fixed; top: calc(env(safe-area-inset-top, 0px) + 12px); right: 12px; z-index: 10; font-family: var(--f-latin); }
.dev > button { background: var(--ink); border: 1px solid var(--gold-dim); color: var(--gold); border-radius: 999px; padding: .3rem .9rem; font-size: .75rem; letter-spacing: .15em; }
.dev ul { list-style: none; margin: .5rem 0 0; padding: .4rem; background: var(--ink); border: 1px solid var(--gold-dim); border-radius: 10px; font-family: var(--f-display); }
.dev li button { background: none; border: none; color: var(--parchment); padding: .35rem .7rem; width: 100%; text-align: left; font-size: .85rem; border-radius: 6px; }
.dev li button:hover { background: var(--ink-2); }

@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes float { 50% { transform: translateY(-8px); } }
@keyframes pulse { 50% { box-shadow: 0 0 0 4px #6d1a25, 0 0 40px #e3c27caa; } }
@keyframes crack { to { scale: 1.6; opacity: 0; } }
@keyframes spin { to { rotate: 360deg; } }
@keyframes zoom { to { scale: 6; opacity: 0; } }
@keyframes shake { 25% { translate: -8px 0; } 75% { translate: 8px 0; } }
@keyframes flip { from { transform: rotateY(70deg); opacity: .3; } }
@keyframes rise { from { opacity: 0; top: 110%; } }
@keyframes glow { 50% { filter: drop-shadow(0 0 34px #9b6bffaa); } }
@keyframes fog { 50% { filter: blur(3.5px); opacity: .75; } }
@keyframes unfold { from { transform: translateY(24px) scaleY(.15); opacity: 0; } }
@keyframes burn { to { --burn: 118%; } }
@keyframes smoke { from { transform: translateY(0) scale(.6); opacity: 0; } 30% { opacity: 1; } to { transform: translateY(-9rem) scale(1.8); opacity: 0; } }
@keyframes ember { 0% { opacity: 0; transform: none; } 15% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--dx), -10rem); } }
@keyframes owlIn {
  0% { transform: translate(-75vw, -35vh) rotate(-18deg) scale(.45); opacity: 0; }
  10% { opacity: 1; }
  55% { transform: translate(-16vw, 5vh) rotate(8deg) scale(.8); }
  100% { transform: none; }
}
@keyframes owlOut { to { transform: translate(70vw, -45vh) rotate(16deg) scale(.5); opacity: 0; } }
@keyframes hover { 50% { transform: translateY(-10px); } }
@keyframes flapL { from { rotate: -32deg; } to { rotate: 18deg; } }
@keyframes flapR { from { rotate: 32deg; } to { rotate: -18deg; } }
@keyframes blink { 0%, 94%, 100% { transform: scaleY(1); } 97% { transform: scaleY(.1); } }
@keyframes release { to { opacity: 0; } }
@keyframes letterDrop {
  0% { transform: translateY(-9rem) scale(.22) rotate(-10deg); opacity: 0; }
  15% { opacity: 1; }
  70% { transform: translateY(.6rem) scale(1.02) rotate(3deg); }
  100% { transform: none; }
}
@keyframes unroll { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0 0 0 0); } }
</style>
