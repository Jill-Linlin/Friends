<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { content as C, checkPassword, hintFor, isTodo } from '@/data/cardContent'
import { prefersReducedMotion, saveReply, useRetrigger, useTimers } from '@/composables/useCardHelpers'

type Scene = 'envelope' | 'portal' | 'map' | 'loc' | 'finale' | 'end'
type LocKey = 'school' | 'forest' | 'tower' | 'spring'

const reduce = prefersReducedMotion()
const { later } = useTimers()

/* ---------- static data ---------- */
const SCENES: { id: Scene; label: string }[] = [
  { id: 'envelope', label: '1. 封印的魔法信' },
  { id: 'portal', label: '2. 通關密語傳送門' },
  { id: 'map', label: '3. 友誼世界地圖' },
  { id: 'finale', label: '4. 許願星空' },
  { id: 'end', label: '5. 煙火與回信' },
]
const LOCS: Record<LocKey, { n: string; num: string; title: string; sub: string; intro: string; pos: [number, number] }> = {
  school: { n: 'Chapter I', num: 'I', title: '高中學院', sub: '初遇的地方', intro: '翻開魔法書，回到我們初遇的那年。', pos: [28, 18] },
  forest: { n: 'Chapter II', num: 'II', title: '冒險森林', sub: '一起闖的事', intro: '森林守衛要考考你：還記得那次冒險嗎？', pos: [72, 38] },
  tower: { n: 'Chapter III', num: 'III', title: '遠方信塔', sub: '分開後的聯繫', intro: '就算分隔兩地，星星也替我們傳話。點亮每一顆星。', pos: [28, 64] },
  spring: { n: 'Chapter IV', num: 'IV', title: '此刻之泉', sub: '現在的我們', intro: '按住泉水許願，看看現在的我們。', pos: [72, 84] },
}
const LOC_KEYS = Object.keys(LOCS) as LocKey[]
const BOOK_PAGES = [C.school.firstMeet, C.school.embarrassing, C.school.graduation]
const STAR_PTS: [number, number][] = [[18, 30], [42, 16], [66, 34], [82, 62], [50, 78]]
const CRYSTAL_PTS: [number, number][] = [[20, 30], [75, 22], [80, 72], [30, 78]]
const RING_C = 2 * Math.PI * 60

/* ---------- scene routing ---------- */
const scene = ref<Scene>('envelope')
const done = reactive(new Set<LocKey>())
const devOpen = ref(false)

function go(id: Scene) {
  scene.value = id
  if (id === 'finale') startFinale()
}
function devJump(id: Scene) {
  resetScene(id)
  go(id)
  devOpen.value = false
}

/* 1. envelope */
const envelopeOpen = ref(false)
function openEnvelope() {
  envelopeOpen.value = true
  later(() => go('portal'), reduce ? 50 : 1200)
}

/* 2. portal */
const passInput = ref('')
const passMsg = ref('')
const portalGo = ref(false)
let tries = 0
const { active: formShaking, fire: shakeForm } = useRetrigger()
function submitPass() {
  const v = passInput.value.trim()
  if (!v) { passMsg.value = '先輸入通關密語。'; return }
  if (checkPassword(v)) {
    passMsg.value = ''
    portalGo.value = true
    later(() => go('map'), reduce ? 50 : 1300)
  } else {
    passMsg.value = hintFor('魔法陣毫無反應……再想想？', tries++)
    shakeForm()
  }
}

/* locations */
const curLoc = ref<LocKey>('school')
const loc = computed(() => LOCS[curLoc.value])
const game = reactive({
  rewarded: false,
  page: 0,
  quizRight: false,
  quizMsg: '',
  wrongIdx: -1,
  lit: new Set<number>(),
  note: '點一顆星星。',
  lineDone: false,
  starsBtn: false,
  hold: 0,
  springDone: false,
})
const { active: optShaking, fire: shakeOpt } = useRetrigger()

function openLoc(k: LocKey) {
  curLoc.value = k
  Object.assign(game, { rewarded: false, page: 0, quizRight: false, quizMsg: '', wrongIdx: -1, note: '點一顆星星。', lineDone: false, starsBtn: false, hold: 0, springDone: false })
  game.lit.clear()
  go('loc')
}
function reward() {
  done.add(curLoc.value)
  game.rewarded = true
}

function nextPage() {
  if (game.page < BOOK_PAGES.length - 1) game.page++
  else reward()
}
function pickOption(i: number) {
  if (i === C.forest.correctIndex) { game.quizRight = true; return }
  game.quizMsg = `森林守衛搖搖頭：${C.forest.wrongRoast}`
  game.wrongIdx = i
  shakeOpt()
}
function lightStar(i: number) {
  game.note = `星星${'一二三四五'[i]}：${C.tower.messages[i]}`
  if (game.lit.has(i)) return
  game.lit.add(i)
  if (game.lit.size === STAR_PTS.length) {
    game.lineDone = true
    later(() => { game.starsBtn = true }, reduce ? 0 : 1600)
  }
}

/* spring: press & hold */
let holdStart = 0, holdRaf = 0
function holdTick(t: number) {
  game.hold = Math.min((t - holdStart) / 1600, 1)
  if (game.hold < 1) holdRaf = requestAnimationFrame(holdTick)
  else game.springDone = true
}
function holdDown(e: PointerEvent) {
  e.preventDefault()
  holdStart = performance.now()
  holdRaf = requestAnimationFrame(holdTick)
}
function holdUp() {
  cancelAnimationFrame(holdRaf)
  if (!game.springDone) game.hold = 0
}

/* 4. finale */
const letterOpen = ref(false)
const lineDrawn = ref(false)
function startFinale() {
  lineDrawn.value = false
  later(() => { lineDrawn.value = true }, reduce ? 0 : 1800)
}

/* 5. end */
const reply = ref('')
const replyMsg = ref('')
const replyOk = ref(false)
function sendReply() {
  const v = reply.value.trim()
  if (!v) { replyOk.value = false; replyMsg.value = '先寫一句話再送出。'; return }
  saveReply('star-academy-reply', v)
  replyOk.value = true
  replyMsg.value = '回信已交給貓頭鷹。（原型：目前只存在這台裝置上）'
  burst(W / 2, H / 3)
}

function resetScene(id: Scene) {
  if (id === 'envelope') envelopeOpen.value = false
  if (id === 'portal') { portalGo.value = false; passMsg.value = '' }
  if (id === 'finale') letterOpen.value = false
}
function restart() {
  done.clear()
  ;(['envelope', 'portal', 'finale'] as Scene[]).forEach(resetScene)
  passInput.value = ''
  reply.value = ''
  replyMsg.value = ''
  go('envelope')
}

/* ---------- sky + fireworks (canvas) ---------- */
const sky = ref<HTMLCanvasElement>()
type Star = { x: number; y: number; r: number; p: number }
type Spark = { x: number; y: number; vx: number; vy: number; life: number; c: string }
let cx: CanvasRenderingContext2D, W = 0, H = 0, raf = 0, fwTimer = 0
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
    if (scene.value === 'end' && t - fwTimer > 700) { fwTimer = t; burst(W * (.2 + Math.random() * .6), H * (.15 + Math.random() * .35)) }
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
        <li v-for="k in LOC_KEYS" :key="k"><button @click="openLoc(k); devOpen = false">　└ {{ LOCS[k].title }}</button></li>
      </ul>
    </nav>

    <main>
      <!-- 1. Envelope -->
      <section v-if="scene === 'envelope'" class="scene">
        <div class="col">
          <div class="eyebrow">An owl has arrived</div>
          <h1>給 <span :class="{ ph: isTodo(C.friendName) }">{{ C.friendName }}</span> 的一封信</h1>
          <div class="envelope" :class="{ open: envelopeOpen }">
            <div class="flap"></div>
            <button class="seal" aria-label="點擊封印，打開信件" @click="openEnvelope">S</button>
          </div>
          <p>點一下蠟封，打開來自星夜魔法學院的信。</p>
        </div>
      </section>

      <!-- 2. Portal -->
      <section v-else-if="scene === 'portal'" class="scene">
        <div class="col">
          <div class="eyebrow">The gate of passwords</div>
          <h2>傳送門只為真正的老朋友開啟</h2>
          <div class="portal" :class="{ go: portalGo }">
            <svg viewBox="0 0 200 200" aria-hidden="true">
              <circle cx="100" cy="100" r="92" fill="none" stroke="#e3c27c" stroke-width="1" />
              <circle cx="100" cy="100" r="78" fill="none" stroke="#e3c27c" stroke-width=".6" stroke-dasharray="3 6" />
              <polygon points="100,22 168,140 32,140" fill="none" stroke="#9ad8ff" stroke-width=".8" />
              <polygon points="100,178 32,60 168,60" fill="none" stroke="#9ad8ff" stroke-width=".8" />
              <circle cx="100" cy="100" r="34" fill="none" stroke="#e3c27c" stroke-width=".8" />
              <text x="100" y="12" fill="#e3c27c" font-size="9" text-anchor="middle" font-family="Cinzel">AMICITIA · AETERNA</text>
            </svg>
          </div>
          <p>問題：<span :class="{ ph: isTodo(C.password.question) }">{{ C.password.question }}</span></p>
          <form class="pass" :class="{ shake: formShaking }" novalidate @submit.prevent="submitPass">
            <label for="passInput" class="eyebrow" style="flex-basis: 100%">輸入通關密語</label>
            <input id="passInput" v-model="passInput" autocomplete="off" :placeholder="C.password.inputPlaceholder" @input="passMsg = ''">
            <button class="btn" type="submit">開啟</button>
          </form>
          <div class="msg" role="status">{{ passMsg }}</div>
        </div>
      </section>

      <!-- 3. Map -->
      <section v-else-if="scene === 'map'" class="scene">
        <div class="col">
          <div class="eyebrow">Map of our realm</div>
          <h2>選一個地方開始旅程</h2>
          <div class="map">
            <svg class="trail" viewBox="0 0 100 125" preserveAspectRatio="none" aria-hidden="true">
              <path d="M28 22 C 50 30, 70 30, 72 48 S 30 62, 28 80 S 60 100, 72 104" fill="none" stroke="#8f7a4c" stroke-width=".5" stroke-dasharray="1.5 2" />
            </svg>
            <button
              v-for="k in LOC_KEYS" :key="k" class="loc" :class="{ done: done.has(k) }"
              :style="{ left: LOCS[k].pos[0] + '%', top: LOCS[k].pos[1] + '%' }" @click="openLoc(k)"
            >
              <div class="gem"><span>{{ LOCS[k].num }}</span></div>
              <span class="name">{{ LOCS[k].title }}</span>
              <span class="sub">{{ LOCS[k].sub }}</span>
            </button>
          </div>
          <div class="tally">CRYSTALS {{ done.size }} / 4</div>
          <button v-if="done.size >= 4" class="btn" @click="go('finale')">前往許願星空</button>
        </div>
      </section>

      <!-- Location (shared) -->
      <section v-else-if="scene === 'loc'" class="scene">
        <div class="col">
          <div class="eyebrow">{{ loc.n }}</div>
          <h2>{{ loc.title }}</h2>
          <p>{{ loc.intro }}</p>
          <div class="stage">
            <!-- reward -->
            <div v-if="game.rewarded" class="reward">
              <div class="crystal" aria-hidden="true"></div>
              <div>獲得記憶水晶 {{ done.size }} / 4</div>
              <button class="btn" @click="go('map')">{{ done.size < 4 ? '回到地圖' : '水晶集滿了，回到地圖' }}</button>
            </div>

            <!-- I. magic book -->
            <template v-else-if="curLoc === 'school'">
              <div :key="game.page" class="page">
                <div>
                  <span :class="{ ph: isTodo(BOOK_PAGES[game.page]!) }">{{ BOOK_PAGES[game.page] }}</span>
                  <div style="margin-top: .6rem; font-size: .8rem; opacity: .6">{{ game.page + 1 }} / {{ BOOK_PAGES.length }}</div>
                </div>
              </div>
              <div class="row">
                <button v-if="game.page > 0" class="btn ghost" @click="game.page--">上一頁</button>
                <button class="btn" @click="nextPage">{{ game.page === BOOK_PAGES.length - 1 ? '闔上魔法書' : '下一頁' }}</button>
              </div>
            </template>

            <!-- II. quiz -->
            <template v-else-if="curLoc === 'forest'">
              <template v-if="game.quizRight">
                <div class="note"><span :class="{ ph: isTodo(C.forest.story) }">{{ C.forest.story }}</span></div>
                <button class="btn" @click="reward">收下水晶</button>
              </template>
              <template v-else>
                <div><span :class="{ ph: isTodo(C.forest.question) }">{{ C.forest.question }}</span></div>
                <div class="opts">
                  <button
                    v-for="(o, i) in C.forest.options" :key="i" class="opt"
                    :class="{ shake: optShaking && game.wrongIdx === i }" @click="pickOption(i)"
                  >{{ o }}</button>
                </div>
                <div class="msg">{{ game.quizMsg }}</div>
              </template>
            </template>

            <!-- III. constellation -->
            <template v-else-if="curLoc === 'tower'">
              <div class="sky-box">
                <svg viewBox="0 0 100 100" aria-hidden="true">
                  <polyline
                    :points="STAR_PTS.map(p => p.join(',')).join(' ')" fill="none" stroke="#e3c27c" stroke-width=".5"
                    stroke-dasharray="160" :stroke-dashoffset="game.lineDone ? 0 : 160" style="transition: stroke-dashoffset 1.6s"
                  />
                </svg>
                <button
                  v-for="([x, y], i) in STAR_PTS" :key="i" class="star" :class="{ lit: game.lit.has(i) }"
                  :style="{ left: x + '%', top: y + '%' }" :aria-label="`第 ${i + 1} 顆星`" @click="lightStar(i)"
                >✦</button>
              </div>
              <div class="note">{{ game.note }}</div>
              <button v-if="game.starsBtn" class="btn" @click="reward">星座完成，收下水晶</button>
            </template>

            <!-- IV. hold to wish -->
            <template v-else-if="curLoc === 'spring'">
              <template v-if="game.springDone">
                <img v-if="C.spring.photo" class="photo" :src="C.spring.photo" alt="我們的合照">
                <div v-else class="photo">【待放：你們最近的合照】</div>
                <div class="note"><span :class="{ ph: isTodo(C.spring.message) }">{{ C.spring.message }}</span></div>
                <button class="btn" @click="reward">收下水晶</button>
              </template>
              <template v-else>
                <button
                  class="hold" @pointerdown="holdDown" @pointerup="holdUp" @pointerleave="holdUp" @pointercancel="holdUp"
                  @keydown.enter.space.prevent="game.springDone = true"
                >
                  <svg viewBox="0 0 128 128" aria-hidden="true">
                    <circle cx="64" cy="64" r="60" fill="none" stroke="#1f2656" stroke-width="4" />
                    <circle cx="64" cy="64" r="60" fill="none" stroke="#9ad8ff" stroke-width="4" :stroke-dasharray="RING_C" :stroke-dashoffset="RING_C * (1 - game.hold)" stroke-linecap="round" />
                  </svg>
                  <span style="position: relative">按住許願</span>
                </button>
                <p>按住不放，直到光環繞滿一圈。</p>
              </template>
            </template>
          </div>
          <button class="btn ghost" @click="go('map')">← 回到地圖</button>
        </div>
      </section>

      <!-- 4. Finale -->
      <section v-else-if="scene === 'finale'" class="scene">
        <div class="col">
          <div class="eyebrow">The wishing sky</div>
          <h2>四顆水晶升上夜空</h2>
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
            <button class="btn" @click="go('end')">點燃煙火</button>
          </template>
        </div>
      </section>

      <!-- 5. End -->
      <section v-else-if="scene === 'end'" class="scene">
        <div class="col">
          <div class="eyebrow">Fin · and a new beginning</div>
          <h1><span :class="{ ph: isTodo(C.finalLine) }">{{ C.finalLine }}</span></h1>
          <label for="reply" class="eyebrow">寫一句話給 <span :class="{ ph: isTodo(C.myName) }">{{ C.myName }}</span></label>
          <textarea id="reply" v-model="reply" :placeholder="C.replyPlaceholder" @input="replyMsg = ''"></textarea>
          <div class="row">
            <button class="btn" @click="sendReply">送出回信</button>
            <button class="btn ghost" @click="restart">重新開始旅程</button>
          </div>
          <div class="msg" role="status" :style="{ color: replyOk ? 'var(--crystal)' : undefined }">{{ replyMsg }}</div>
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
  gap: 1.25rem; text-align: center; overflow-y: auto;
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

/* Portal */
.portal { width: min(60vw, 14rem); aspect-ratio: 1; border-radius: 50%; position: relative; }
.portal svg { width: 100%; height: 100%; animation: spin 24s linear infinite; }
.portal.go svg { animation: spin 1.2s linear infinite; }
.portal.go { animation: zoom 1.4s ease-in forwards; }
form.pass { display: flex; gap: .5rem; width: 100%; max-width: 22rem; flex-wrap: wrap; justify-content: center; }
form.pass input { flex: 1 1 12rem; min-width: 0; background: var(--ink); border: 1px solid var(--gold-dim); color: var(--parchment); border-radius: 999px; padding: .6rem 1.1rem; font: inherit; text-align: center; }
.msg { min-height: 1.7em; font-size: .95rem; color: var(--danger); }
.shake { animation: shake .4s; }

/* Map */
.map { position: relative; width: 100%; max-width: 30rem; aspect-ratio: 4 / 5; border: 1px solid var(--gold-dim); border-radius: 14px; background: radial-gradient(ellipse at 50% 40%, var(--ink-2), var(--ink) 70%); }
.map svg.trail { position: absolute; inset: 0; width: 100%; height: 100%; }
.loc { position: absolute; translate: -50% -50%; background: none; border: none; color: var(--parchment); display: flex; flex-direction: column; align-items: center; gap: .3rem; width: 7.5rem; }
.loc .gem { width: 3rem; height: 3rem; rotate: 45deg; border: 1px solid var(--gold); background: var(--night); display: grid; place-items: center; transition: background .4s, box-shadow .4s; }
.loc .gem span { rotate: -45deg; font-family: var(--f-latin); color: var(--gold); }
.loc .name { font-size: .95rem; letter-spacing: .1em; }
.loc .sub { font-size: .75rem; color: var(--mist); }
.loc.done .gem { background: var(--crystal); box-shadow: 0 0 22px var(--crystal); }
.loc.done .gem span { color: var(--night); }
.loc:hover .gem { box-shadow: 0 0 16px var(--gold); }
.tally { font-family: var(--f-latin); letter-spacing: .2em; color: var(--crystal); font-variant-numeric: tabular-nums; }

/* Location games */
.stage { width: 100%; max-width: 26rem; min-height: 14rem; border: 1px solid var(--gold-dim); border-radius: 14px; background: var(--ink); padding: 1.25rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; position: relative; }
.page { background: var(--paper); color: var(--parch-ink); font-family: var(--f-hand); border-radius: 4px; padding: 1.25rem; width: 100%; min-height: 9rem; display: grid; place-items: center; animation: flip .5s ease; }
.page .ph, .letter .ph { color: #8a5a1a; border-color: #b08a50; }
.row { display: flex; gap: .75rem; flex-wrap: wrap; justify-content: center; }
.opts { display: flex; flex-direction: column; gap: .6rem; width: 100%; }
.opt { border: 1px solid var(--gold-dim); background: var(--night); color: var(--parchment); border-radius: 10px; padding: .6rem 1rem; width: 100%; }
.opt:hover { border-color: var(--gold); }
.sky-box { position: relative; width: 100%; aspect-ratio: 1; }
.sky-box svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.star { position: absolute; translate: -50% -50%; width: 2.75rem; height: 2.75rem; border: none; background: none; color: var(--mist); font-size: 1.6rem; transition: color .4s, text-shadow .4s; }
.star.lit { color: var(--gold); text-shadow: 0 0 14px var(--gold); }
.note { font-family: var(--f-hand); color: var(--parchment); min-height: 3.4em; }
.hold { position: relative; width: 8rem; height: 8rem; border-radius: 50%; border: none; background: var(--night); color: var(--crystal); touch-action: none; user-select: none; -webkit-user-select: none; }
.hold svg { position: absolute; inset: 0; rotate: -90deg; }
.photo { width: 100%; aspect-ratio: 4 / 3; border: 1px dashed var(--gold-dim); border-radius: 8px; display: grid; place-items: center; color: var(--gold-dim); font-size: .9rem; object-fit: cover; }
.reward { display: flex; flex-direction: column; align-items: center; gap: .75rem; animation: fadeIn .8s ease both; }
.crystal { width: 2.2rem; height: 3.2rem; background: var(--crystal); clip-path: polygon(50% 0, 100% 35%, 50% 100%, 0 35%); filter: drop-shadow(0 0 10px var(--crystal)); animation: float 2.5s ease-in-out infinite; }

/* Finale */
.constellation { position: relative; width: 100%; max-width: 22rem; aspect-ratio: 1; }
.constellation svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.constellation .crystal { position: absolute; translate: -50% -50%; animation: rise 1.6s ease both; }
.letter { background: var(--paper); color: var(--parch-ink); font-family: var(--f-hand); text-align: left; padding: 1.75rem 1.5rem; border-radius: 4px; width: 100%; max-width: 28rem; display: flex; flex-direction: column; gap: .9rem; animation: unroll 1s ease both; font-size: 1.05rem; }
.letter p { color: var(--parch-ink); max-width: none; }
.letter .sign { text-align: right; }
textarea { width: 100%; max-width: 26rem; min-height: 6rem; background: var(--ink); color: var(--parchment); border: 1px solid var(--gold-dim); border-radius: 10px; padding: .8rem 1rem; font-family: var(--f-hand); font-size: 1rem; resize: vertical; }

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
@keyframes unroll { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0 0 0 0); } }
</style>
