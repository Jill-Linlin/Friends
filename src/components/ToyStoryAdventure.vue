<script setup lang="ts">
/**
 * The adventure: a board-game map on Kitty's bedroom floor. "She" walks stop to stop;
 * each stop opens a sheet with its gift game, James joins half-way, and the last stop is Kitty's treasure chest.
 */
import { computed, reactive, ref } from 'vue'
import { toy as T, isTodo } from '@/data/toyStoryContent'
import { prefersReducedMotion, useTimers } from '@/composables/useCardHelpers'
import ToyChibi from './toystory/ToyChibi.vue'
import GiftIcon, { type GiftKind } from './toystory/GiftIcon.vue'
import DialogueBox from './toystory/DialogueBox.vue'
import ClawMachine from './toystory/ClawMachine.vue'
import PairGame from './toystory/PairGame.vue'
import TreasureChest from './toystory/TreasureChest.vue'

const emit = defineEmits<{ home: [] }>()
const reduce = prefersReducedMotion()
const { later, clearAll } = useTimers()
const S = T.stations
const J = T.james

/* ---------- map ---------- */
type NodeKey = 'start' | 'necklace1' | 'necklace2' | 'clips' | 'james' | 'treasure'
const NODES: { key: NodeKey; place: string; icon: GiftKind; x: number; y: number }[] = [
  { key: 'start', place: T.start.place, icon: 'start', x: 22, y: 90 },
  { key: 'necklace1', place: S.necklace1.place, icon: 'necklace1', x: 74, y: 75 },
  { key: 'necklace2', place: S.necklace2.place, icon: 'necklace2', x: 26, y: 58 },
  { key: 'clips', place: S.clips.place, icon: 'clips', x: 74, y: 42 },
  { key: 'james', place: J.place, icon: 'james', x: 28, y: 26 },
  { key: 'treasure', place: T.treasure.place, icon: 'ring', x: 66, y: 9 },
]
const PATH = NODES.map(n => `${n.x},${n.y}`).join(' ')
const GIFTS: { kind: GiftKind; name: string }[] = [
  { kind: 'necklace1', name: S.necklace1.gift },
  { kind: 'necklace2', name: S.necklace2.gift },
  { kind: 'clips', name: S.clips.gift },
  { kind: 'ring', name: '實體戒指 💍' },
]

const pos = ref(0)
const moving = ref(false)
const phase = ref<'intro' | 'map' | 'station'>('intro')
const collected = reactive(new Set<GiftKind>())
const jamesJoined = ref(false)
const jamesLeft = ref(false)
const toast = ref('')

const node = computed(() => NODES[pos.value]!)
const nextNode = computed(() => NODES[pos.value + 1])
const walked = computed(() => NODES.slice(0, pos.value + 1).map(n => `${n.x},${n.y}`).join(' '))
const withJames = computed(() => jamesJoined.value && !jamesLeft.value)
/** gifts stay a mystery ("?") until found; the start and James stops always show their own icon */
const revealed = (icon: GiftKind) => icon === 'start' || icon === 'james' || collected.has(icon)

function advance() {
  if (moving.value || !nextNode.value || phase.value !== 'map') return
  moving.value = true
  pos.value++
  later(() => { moving.value = false; openStation() }, reduce ? 0 : 1300)
}
function showToast(text: string) {
  toast.value = text
  later(() => { if (toast.value === text) toast.value = '' }, 2600)
}

/* ---------- stations ---------- */
const FIRST_STEP: Record<NodeKey, string> = { start: '', necklace1: 'box', necklace2: 'claw', clips: 'pairs', james: 'appear', treasure: 'farewell' }
const step = ref('')
const boxOpen = ref(false)

function openStation() {
  boxOpen.value = false
  stack.placed = 0
  jamesFly.value = false
  step.value = FIRST_STEP[node.value.key]
  if (node.value.key === 'treasure' && !withJames.value) step.value = 'chest'
  phase.value = 'station'
}
function closeStation() { phase.value = 'map' }
function collect(kind: GiftKind, name: string) {
  collected.add(kind)
  closeStation()
  showToast(`🎁 獲得「${name}」！`)
}
function unwrap() {
  if (boxOpen.value) return
  boxOpen.value = true
  later(() => { step.value = 'reveal' }, reduce ? 0 : 900)
}

/* James: joint mission — take turns stacking blocks */
const stack = reactive({ placed: 0 })
const BLOCK_COLORS = ['#e23b2e', '#2f6fdb', '#ffcc29', '#5cbf3a', '#ff8fb1', '#7cc6ff']
const BLOCK_LETTERS = 'TOYSTORY'
const turnIsHer = computed(() => stack.placed % 2 === 0)
const lastBanter = computed(() => (stack.placed ? J.mission.banter[stack.placed - 1] : undefined))
const missionDone = computed(() => stack.placed >= J.mission.blocks)
function placeBlock() {
  if (missionDone.value) return
  stack.placed++
}
function jamesDone() {
  jamesJoined.value = true
  closeStation()
  showToast(`✦ ${J.name} 成為妳的隊友了！`)
}
/** last farewell line: James turns into a star and flies away */
const jamesFly = ref(false)
const TRAIL = Array.from({ length: 8 }, (_, i) => ({ delay: `${1.05 + i * .07}s`, size: `${.55 - i * .04}rem` }))
function onFarewellLine(i: number) {
  if (i === J.farewell.length - 1) jamesFly.value = true
}
function farewellDone() {
  jamesLeft.value = true
  step.value = 'chest'
}

/* ---------- reset / dev ---------- */
function reset() {
  clearAll()
  pos.value = 0
  moving.value = false
  collected.clear()
  jamesJoined.value = false
  jamesLeft.value = false
  toast.value = ''
  phase.value = 'intro'
}
function restart() { reset(); emit('home') }

const devOpen = ref(false)
function devJump(i: number) {
  devOpen.value = false
  reset()
  pos.value = i
  // only the gifts of the stops before this one count as found
  GIFTS.slice(0, Math.max(0, Math.min(i - 1, 3))).forEach(g => collected.add(g.kind))
  jamesJoined.value = i > 4
  if (i === 0) { phase.value = 'intro'; return }
  openStation()
}
</script>

<template>
  <div class="adventure">
    <nav class="dev" aria-label="關卡目錄（原型測試用）">
      <button :aria-expanded="devOpen" @click="devOpen = !devOpen">JUMP</button>
      <ul v-if="devOpen">
        <li v-for="(n, i) in NODES" :key="n.key"><button @click="devJump(i)">{{ i === 0 ? '開場' : `${i}. ${n.place}` }}</button></li>
      </ul>
    </nav>

    <header class="hud">
      <div class="sign wood">{{ T.mapTitle }}</div>
      <div class="bag" aria-label="背包">
        <span class="bag-label">背包</span>
        <span v-for="g in GIFTS" :key="g.kind" class="slot" :class="{ got: collected.has(g.kind) }" :title="collected.has(g.kind) ? g.name : '還沒找到的禮物'">
          <GiftIcon v-if="collected.has(g.kind)" :kind="g.kind" /><span v-else class="mystery">?</span>
        </span>
        <span v-if="withJames" class="mate" :title="`隊友：${J.name}`"><ToyChibi :look="T.looks.james" kind="james" /></span>
      </div>
    </header>

    <!-- board -->
    <div class="board">
      <div class="rug" aria-hidden="true"></div>
      <span class="deco block b1" aria-hidden="true">A</span>
      <span class="deco block b2" aria-hidden="true">B</span>
      <span class="deco block b3" aria-hidden="true">C</span>
      <span class="deco ball" aria-hidden="true">★</span>
      <span class="deco dino" aria-hidden="true">🦖</span>
      <span class="deco pig" aria-hidden="true">🐷</span>
      <svg class="path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polyline :points="PATH" fill="none" stroke="#fff" stroke-width="2.4" stroke-dasharray="1 2.6" stroke-linecap="round" vector-effect="non-scaling-stroke" />
        <polyline :points="walked" fill="none" stroke="#ffcc29" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
      </svg>
      <div
        v-for="(n, i) in NODES" :key="n.key" class="node"
        :class="{ done: i < pos || (i === pos && phase !== 'station' && i > 0), here: i === pos, next: i === pos + 1 }"
        :style="{ left: `${n.x}%`, top: `${n.y}%` }"
      >
        <span class="disc"><GiftIcon v-if="revealed(n.icon)" :kind="n.icon" /><span v-else class="mystery">?</span></span>
        <span class="tag">{{ i === 0 ? '起點' : n.key === 'james' ? '？？？' : n.place }}</span>
      </div>
      <div class="token" :class="{ moving }" :style="{ left: `${node.x}%`, top: `${node.y}%` }">
        <span class="who"><ToyChibi :look="T.looks.her" kind="her" /></span>
        <span v-if="withJames" class="who"><ToyChibi :look="T.looks.james" kind="james" /></span>
      </div>
    </div>

    <!-- under the board -->
    <div class="dock">
      <DialogueBox v-if="phase === 'intro'" :lines="T.intro" done-label="開始冒險！" @done="phase = 'map'" />
      <div v-else-if="nextNode" class="next-card cream-card">
        <p>下一站：<b>{{ nextNode.key === 'james' ? '書架下……好像有個人影？' : nextNode.place }}</b></p>
        <button class="toy-btn red" :disabled="moving || phase !== 'map'" @click="advance">{{ moving ? '前進中……' : '前進 ▶' }}</button>
      </div>
    </div>

    <div v-if="toast" class="toast" role="status">{{ toast }}</div>

    <!-- station sheet -->
    <div v-if="phase === 'station'" class="sheet-backdrop" :class="node.key === 'treasure' ? 'full toy-world' : ''">
      <section class="sheet" :class="[node.key, { full: node.key === 'treasure' }]" role="dialog" :aria-label="node.place">
        <div class="sheet-head">
          <span class="sheet-icon"><GiftIcon v-if="revealed(node.icon)" :kind="node.icon" /><span v-else class="mystery">?</span></span>
          <span>{{ node.key === 'james' ? '突發事件！' : `第 ${node.key === 'treasure' ? 4 : pos} 站・${node.place}` }}</span>
        </div>

        <!-- 第 1 站：拆禮物 -->
        <template v-if="node.key === 'necklace1'">
          <template v-if="step === 'box'">
            <p class="arrive">{{ S.necklace1.arrive }}</p>
            <button class="giftbox" :class="{ open: boxOpen }" aria-label="拆開禮物盒" @click="unwrap">
              <span class="gb-lid"><span class="bow">🎀</span></span>
              <span class="gb-body"></span>
              <span v-if="boxOpen" class="pop-stars" aria-hidden="true">✦ ★ ✦</span>
            </button>
            <p class="hint">（點一下禮物盒，把它拆開）</p>
          </template>
          <div v-else class="reveal">
            <div class="new">✦ 獲得新禮物！✦</div>
            <div class="gift-big"><GiftIcon kind="necklace1" /></div>
            <h3>{{ S.necklace1.gift }}</h3>
            <p class="desc">{{ S.necklace1.desc }}</p>
            <p><span :class="{ todo: isTodo(S.necklace1.giftNote) }">{{ S.necklace1.giftNote }}</span></p>
            <div class="memory">
              <div class="memory-title">{{ S.necklace1.blessingTitle }}</div>
              <p><span :class="{ todo: isTodo(S.necklace1.blessing) }">{{ S.necklace1.blessing }}</span></p>
            </div>
            <button class="toy-btn green" @click="collect('necklace1', S.necklace1.gift)">收進背包</button>
          </div>
        </template>

        <!-- 第 2 站：夾娃娃機 -->
        <template v-else-if="node.key === 'necklace2'">
          <template v-if="step === 'claw'">
            <p class="arrive">{{ S.necklace2.arrive }}</p>
            <ClawMachine @win="step = 'reveal'" />
          </template>
          <div v-else class="reveal">
            <div class="new">✦ 獲得新禮物！✦</div>
            <div class="gift-big"><GiftIcon kind="necklace2" /></div>
            <h3>{{ S.necklace2.gift }}</h3>
            <p class="desc">{{ S.necklace2.desc }}</p>
            <p><span :class="{ todo: isTodo(S.necklace2.giftNote) }">{{ S.necklace2.giftNote }}</span></p>
            <div class="memory">
              <div class="memory-title">{{ S.necklace2.bondTitle }}</div>
              <p><span :class="{ todo: isTodo(S.necklace2.bond) }">{{ S.necklace2.bond }}</span></p>
            </div>
            <button class="toy-btn green" @click="collect('necklace2', S.necklace2.gift)">收進背包</button>
          </div>
        </template>

        <!-- 第 3 站：翻牌配對 -->
        <template v-else-if="node.key === 'clips'">
          <template v-if="step === 'pairs'">
            <p class="arrive">{{ S.clips.arrive }}</p>
            <PairGame @win="step = 'reveal'" />
          </template>
          <div v-else class="reveal">
            <div class="new">✦ 全部配對成功！✦</div>
            <div class="gift-big"><GiftIcon kind="clips" /></div>
            <h3>{{ S.clips.gift }}</h3>
            <p class="desc">{{ S.clips.desc }}</p>
            <p><span :class="{ todo: isTodo(S.clips.giftNote) }">{{ S.clips.giftNote }}</span></p>
            <button class="toy-btn green" @click="collect('clips', S.clips.gift)">收進背包</button>
          </div>
        </template>

        <!-- 突發事件：James -->
        <template v-else-if="node.key === 'james'">
          <div class="duo">
            <span class="who"><ToyChibi :look="T.looks.her" kind="her" /></span>
            <span class="who james-in" :class="{ wave: step === 'appear' }"><ToyChibi :look="T.looks.james" kind="james" flip :spread="step === 'appear'" /></span>
          </div>
          <div class="name-tag">{{ J.name }}<small>{{ J.tag }}</small></div>
          <DialogueBox v-if="step === 'appear'" :lines="J.appear" done-label="一起組隊！" @done="step = 'mission'" />

          <template v-else-if="step === 'mission'">
            <div class="mission cream-card">
              <h3>{{ J.mission.title }}</h3>
              <p>{{ J.mission.desc }}</p>
              <div class="tower" aria-label="積木塔">
                <span class="shelf" aria-hidden="true"></span>
                <span
                  v-for="b in stack.placed" :key="b" class="block-piece"
                  :style="{ background: BLOCK_COLORS[(b - 1) % BLOCK_COLORS.length], bottom: `${(b - 1) * 2.1}rem`, rotate: `${b % 2 ? -3 : 4}deg` }"
                >{{ BLOCK_LETTERS[(b - 1) % BLOCK_LETTERS.length] }}</span>
              </div>
              <p v-if="lastBanter" :key="stack.placed" class="banter" :class="lastBanter.who">
                <b>{{ lastBanter.who === 'her' ? T.herName : J.name }}：</b>{{ lastBanter.text }}
              </p>
              <button v-if="!missionDone" class="toy-btn" :class="turnIsHer ? 'red' : 'blue'" @click="placeBlock">
                {{ turnIsHer ? `換${T.herName}放一塊！` : `換 ${J.name} 放一塊！` }}（{{ stack.placed }} / {{ J.mission.blocks }}）
              </button>
              <template v-else>
                <p class="done-msg">✦ 任務完成！搆到寶藏地圖了！✦</p>
                <button class="toy-btn green" @click="step = 'after'">打開地圖看看</button>
              </template>
            </div>
          </template>

          <DialogueBox v-else-if="step === 'after'" :lines="J.afterMission" done-label="一起出發！" @done="jamesDone" />
        </template>

        <!-- 第 4 站：終極寶藏 -->
        <template v-else-if="node.key === 'treasure'">
          <template v-if="step === 'farewell'">
            <div class="duo">
              <span class="who"><ToyChibi :look="T.looks.her" kind="her" /></span>
              <span class="who james-spot">
                <span class="james-body" :class="{ flying: jamesFly }"><ToyChibi :look="T.looks.james" kind="james" flip wave /></span>
                <template v-if="jamesFly">
                  <span class="fly-star" aria-hidden="true">★</span>
                  <span v-for="(t, i) in TRAIL" :key="i" class="trail" :style="{ animationDelay: t.delay, width: t.size, height: t.size }" aria-hidden="true"></span>
                  <span class="poof" aria-hidden="true">✦</span>
                </template>
              </span>
            </div>
            <DialogueBox :lines="J.farewell" done-label="打開寶箱" @line="onFarewellLine" @done="farewellDone" />
          </template>
          <TreasureChest v-else :gifts="GIFTS" @opened="collected.add('ring')" @restart="restart" />
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* Layout: HUD (title sign + backpack) on top, the bedroom-floor board in the middle, a dialogue/next-step dock below; stops open as a sheet over the board. */
.adventure { position: relative; min-height: 100vh; display: flex; flex-direction: column; align-items: center; gap: .9rem; padding: 1rem 16px 2rem; }
.hud { width: 100%; max-width: 26rem; display: flex; flex-direction: column; align-items: center; gap: .55rem; }
.hud .sign { padding: .35rem 1.2rem; border-radius: 12px; color: #fff; font-weight: 700; letter-spacing: .1em; text-shadow: 0 2px 0 var(--wood-dark); }
.bag { display: flex; align-items: center; gap: .35rem; padding: .3rem .6rem; border: 3px solid var(--ink); border-radius: 999px; background: #ffffffe6; box-shadow: 0 3px 0 var(--ink); }
.bag-label { font-size: .78rem; font-weight: 700; color: var(--ink-soft); }
.slot { width: 2rem; height: 2rem; display: grid; place-items: center; }
.slot:not(.got) { border: 2px dashed #b9a58a; border-radius: 8px; }
.slot.got { animation: got .5s cubic-bezier(.2, 1.6, .4, 1); }
.slot .mystery { font-size: 1.1rem; color: #b9a58a; }
/* mystery mark for gifts that have not been found yet */
.mystery { display: grid; place-items: center; width: 100%; height: 100%; font-family: var(--f-toy); font-size: 1.5rem; line-height: 1; color: var(--red); text-shadow: 1px 1px 0 var(--ink); }
.sheet-icon .mystery { font-size: 1.1rem; }
.mate { width: 1.8rem; height: 2rem; overflow: hidden; border-left: 2px dashed var(--ink-soft); padding-left: .3rem; }
.mate :deep(.chibi) { width: 1.6rem; }

.board {
  position: relative; width: 100%; max-width: 26rem; aspect-ratio: 360 / 540; border: 4px solid var(--wood-dark); border-radius: 20px; overflow: hidden;
  background:
    repeating-linear-gradient(90deg, transparent 0 58px, #8b5a2b55 58px 60px),
    repeating-linear-gradient(0deg, #ffffff0d 0 3px, transparent 3px 11px),
    linear-gradient(#d39a5c, #c8894a);
  box-shadow: 0 8px 0 var(--wood-dark), 0 18px 30px #0003;
}
.rug { position: absolute; left: 50%; top: 52%; width: 70%; aspect-ratio: 1; translate: -50% -50%; border-radius: 50%; background: radial-gradient(circle, #ffcc29 0 18%, #2f6fdb 18% 34%, #e23b2e 34% 50%, #5cbf3a 50% 66%, #7cc6ff 66% 70%, transparent 70.5%); opacity: .35; }
.deco { position: absolute; display: grid; place-items: center; }
.block { width: 2rem; height: 2rem; border: 2px solid var(--ink); border-radius: 4px; color: #fff; font-family: var(--f-toy); font-size: 1.1rem; box-shadow: 0 3px 0 #0004; }
.b1 { left: 6%; top: 40%; background: var(--red); rotate: -8deg; } .b2 { left: 12%; top: 46%; background: var(--blue); rotate: 6deg; } .b3 { right: 6%; top: 60%; background: var(--green); rotate: 10deg; }
.ball { right: 8%; top: 22%; width: 2.6rem; height: 2.6rem; border-radius: 50%; border: 2px solid var(--ink); color: var(--red); font-size: 1.1rem; background: linear-gradient(transparent 40%, #2f6fdb 40% 60%, transparent 60%), #ffcc29; }
.dino { left: 4%; top: 6%; font-size: 2rem; rotate: -10deg; } .pig { right: 6%; bottom: 3%; font-size: 1.8rem; }
.path { position: absolute; inset: 0; width: 100%; height: 100%; }
.node { position: absolute; z-index: 1; translate: -50% -50%; display: flex; flex-direction: column; align-items: center; gap: .1rem; pointer-events: none; }
.disc { width: 2.8rem; height: 2.8rem; padding: .35rem; display: grid; place-items: center; border-radius: 50%; border: 3px solid var(--ink); background: var(--cream); box-shadow: 0 3px 0 var(--ink); }
.node.next .disc { animation: pulse 1.2s ease-in-out infinite; }
.node.done .disc { background: #fff3b0; }
.node.done .disc::after { content: "✔"; position: absolute; right: -.2rem; top: -.3rem; width: 1.2rem; height: 1.2rem; display: grid; place-items: center; border-radius: 50%; background: var(--green); color: #fff; font-size: .7rem; border: 2px solid var(--ink); }
.tag { max-width: 7rem; padding: 0 .45rem; border-radius: 999px; background: #ffffffe6; border: 2px solid var(--ink); font-size: .68rem; font-weight: 700; line-height: 1.5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.token { position: absolute; z-index: 2; display: flex; align-items: flex-end; translate: -50% -88%; transition: left 1.2s ease-in-out, top 1.2s ease-in-out; filter: drop-shadow(0 4px 2px #0004); }
.token .who { width: 2.8rem; }
.token .who + .who { margin-left: -.5rem; width: 2.6rem; }
.token.moving .who { animation: hop .3s ease-in-out infinite alternate; }

.dock { width: 100%; max-width: 26rem; }
.next-card { display: flex; align-items: center; justify-content: space-between; gap: .8rem; padding: .7rem .9rem; }
.next-card p { margin: 0; }
.toast { position: fixed; top: 1rem; left: 50%; z-index: 40; translate: -50% 0; max-width: calc(100% - 32px); padding: .5rem 1.1rem; border: 3px solid var(--ink); border-radius: 999px; background: var(--yellow); font-weight: 700; box-shadow: 0 4px 0 var(--ink); animation: drop .5s cubic-bezier(.2, 1.4, .4, 1) both; }

/* sheet */
.sheet-backdrop { position: fixed; inset: 0; z-index: 30; display: flex; justify-content: center; align-items: flex-start; overflow-y: auto; overflow-x: hidden; padding: 1.2rem 16px 2rem; animation: fade .3s ease both; }
.sheet-backdrop:not(.full) { background: #1a3a5c99; backdrop-filter: blur(3px); }
.sheet { position: relative; width: 100%; max-width: 28rem; display: flex; flex-direction: column; align-items: center; gap: .9rem; padding: 1rem 1rem 1.4rem; text-align: center; background: #fffdf5; border: 4px solid var(--ink); border-radius: 22px; box-shadow: 0 8px 0 var(--ink); animation: slide .45s cubic-bezier(.2, 1.3, .4, 1) both; }
.sheet.full { max-width: 30rem; background: transparent; border: none; box-shadow: none; }
.sheet-head { align-self: stretch; display: flex; align-items: center; justify-content: center; gap: .5rem; padding: .3rem .8rem; border-radius: 12px; background: var(--red); color: #fff; font-weight: 700; border: 3px solid var(--ink); }
.sheet-icon { width: 1.8rem; padding: .1rem; border-radius: 50%; background: var(--cream); }
.arrive { margin: 0; font-size: 1rem; }
.hint { margin: 0; color: var(--ink-soft); font-size: .9rem; }

/* gift box */
.giftbox { position: relative; width: 9rem; height: 9rem; padding: 0; border: none; background: none; cursor: pointer; animation: wiggle 1.8s ease-in-out infinite; }
.gb-body { position: absolute; left: 1rem; right: 1rem; bottom: 0; height: 5.4rem; border: 3px solid var(--ink); border-radius: 6px; background: linear-gradient(90deg, transparent 42%, var(--yellow) 42% 58%, transparent 58%), var(--red); }
.gb-lid { position: absolute; left: .5rem; right: .5rem; bottom: 5.1rem; height: 1.8rem; border: 3px solid var(--ink); border-radius: 6px; background: linear-gradient(90deg, transparent 42%, var(--yellow) 42% 58%, transparent 58%), #f2554a; transition: transform .8s cubic-bezier(.3, 1.4, .5, 1); }
.bow { position: absolute; left: 50%; top: -1.6rem; translate: -50% 0; font-size: 1.9rem; }
.giftbox.open { animation: none; }
.giftbox.open .gb-lid { transform: translate(3rem, -5rem) rotate(40deg); }
.pop-stars { position: absolute; left: 50%; top: 2rem; translate: -50% 0; color: var(--yellow); font-size: 1.6rem; -webkit-text-stroke: 1px var(--ink); white-space: nowrap; animation: rise-out .9s ease-out both; }

/* gift reveal */
.reveal { display: flex; flex-direction: column; align-items: center; gap: .6rem; }
.new { padding: .15rem .9rem; border-radius: 999px; background: var(--yellow); border: 2px solid var(--ink); font-weight: 700; animation: zoom .5s cubic-bezier(.2, 1.6, .4, 1) both; }
.gift-big { width: 9rem; aspect-ratio: 1; display: grid; place-items: center; padding: .9rem; border-radius: 50%; background: radial-gradient(circle, #fff, #fff3b0); border: 3px solid var(--ink); box-shadow: 0 0 0 6px #fff3b088, 0 0 30px 6px #ffcc2988; animation: zoom .7s .1s cubic-bezier(.2, 1.4, .4, 1) both; }
.reveal h3 { margin: 0; font-size: 1.3rem; color: var(--red); }
.reveal p { margin: 0; }
.reveal .desc { padding: .4rem .8rem; border-radius: 12px; background: #e6f4ff; border: 2px solid var(--ink); font-size: .92rem; }
.memory { width: 100%; display: flex; flex-direction: column; gap: .5rem; padding: .8rem; border: 3px dashed var(--wood-dark); border-radius: 14px; background: var(--cream); }
.memory-title { font-weight: 700; color: var(--wood-dark); }
.memory p { font-family: var(--f-hand); font-size: 1.02rem; }

/* James */
.duo { display: flex; align-items: flex-end; justify-content: center; gap: 1.2rem; }
.duo .who { width: 4.6rem; }
/* James flies away as a star: glow → shrink & spin → a gold star shoots to the upper right with a sparkle trail */
.james-spot { position: relative; }
.james-body { display: block; }
.james-body.flying { animation: vanish 1.1s ease-in forwards; }
.fly-star { position: absolute; left: 50%; top: 40%; z-index: 2; font-size: 2.2rem; line-height: 1; color: var(--yellow); -webkit-text-stroke: 1.5px var(--ink); text-shadow: 0 0 12px #fff3a0, 0 0 24px #ffcc29; translate: -50% -50%; animation: star-born 2.6s ease-in-out .7s both; }
.trail { position: absolute; left: 50%; top: 40%; z-index: 1; border-radius: 50%; background: #fff6c2; box-shadow: 0 0 8px 2px #ffcc29; translate: -50% -50%; opacity: 0; animation: trail 1.6s ease-out both; }
.poof { position: absolute; left: 50%; top: 40%; translate: -50% -50%; font-size: 1.6rem; color: #fff; text-shadow: 0 0 10px #ffcc29; opacity: 0; animation: poof 1s ease-out .6s both; }
.james-in { animation: enter .8s cubic-bezier(.2, 1.3, .4, 1) both; }
.name-tag { display: flex; flex-direction: column; align-items: center; margin-top: -.4rem; padding: .1rem 1rem; border-radius: 10px; background: var(--blue); color: #fff; font-family: var(--f-toy); letter-spacing: .08em; border: 2px solid var(--ink); }
.name-tag small { font-family: var(--f-round); font-size: .72rem; letter-spacing: 0; }
.mission { width: 100%; display: flex; flex-direction: column; align-items: center; gap: .6rem; padding: 1rem; }
.mission h3 { margin: 0; color: var(--blue); }
.mission p { margin: 0; }
.tower { position: relative; width: 8rem; height: 14.5rem; border-bottom: 4px solid var(--wood-dark); }
.shelf { position: absolute; left: 50%; top: 2.2rem; translate: -50% 0; width: 3.4rem; border-bottom: 4px solid var(--wood-dark); }
.block-piece { position: absolute; left: 50%; width: 3.6rem; height: 2rem; margin-left: -1.8rem; display: grid; place-items: center; border: 2px solid var(--ink); border-radius: 4px; color: #fff; font-family: var(--f-toy); font-size: 1.1rem; box-shadow: inset 0 -4px 0 #0003; animation: dropIn .4s cubic-bezier(.3, 1.5, .5, 1) both; }
.banter { padding: .4rem .8rem; border-radius: 12px; border: 2px solid var(--ink); animation: zoom .35s ease both; }
.banter.her { background: #ffe3e0; } .banter.james { background: #e3ecff; }
.done-msg { font-weight: 700; color: var(--green); }

/* prototype jump menu */
.dev { position: fixed; top: 10px; right: 10px; z-index: 50; }
.dev > button { padding: .2rem .8rem; border: 2px solid var(--ink); border-radius: 999px; background: #fff; font-size: .72rem; font-weight: 700; box-shadow: 0 2px 0 var(--ink); }
.dev ul { list-style: none; margin: .4rem 0 0; padding: .3rem; background: #fff; border: 2px solid var(--ink); border-radius: 12px; }
.dev li button { width: 100%; text-align: left; background: none; border: none; padding: .25rem .6rem; font-size: .82rem; border-radius: 8px; cursor: pointer; }
.dev li button:hover { background: #e6f4ff; }

@keyframes got { from { scale: 1.8; } }
@keyframes pulse { 50% { box-shadow: 0 3px 0 var(--ink), 0 0 0 8px #ffcc2988; } }
@keyframes hop { to { translate: 0 -6px; } }
@keyframes drop { from { opacity: 0; translate: -50% -1rem; } }
@keyframes fade { from { opacity: 0; } }
@keyframes slide { from { opacity: 0; transform: translateY(30px); } }
@keyframes wiggle { 0%, 70%, 100% { rotate: 0deg; } 80% { rotate: -6deg; } 90% { rotate: 6deg; } }
@keyframes rise-out { from { opacity: 1; translate: -50% 0; } to { opacity: 0; translate: -50% -3rem; } }
@keyframes zoom { from { scale: .3; opacity: 0; } }
@keyframes vanish { 0% { transform: none; filter: none; } 35% { transform: scale(1.05); filter: brightness(1.6) drop-shadow(0 0 12px #ffe680); } 100% { transform: scale(.05) rotate(540deg); opacity: 0; filter: brightness(2.4) drop-shadow(0 0 16px #ffe680); } }
@keyframes star-born { 0% { transform: scale(0) rotate(0); opacity: 0; } 18% { transform: scale(1.3) rotate(90deg); opacity: 1; } 30% { transform: scale(1) rotate(160deg); } 100% { transform: translate(12rem, -22rem) scale(.35) rotate(720deg); opacity: 0; } }
@keyframes trail { 0% { transform: translate(0, 0); opacity: 0; } 15% { opacity: 1; } 100% { transform: translate(9rem, -16rem) scale(.2); opacity: 0; } }
@keyframes poof { 0% { transform: scale(.2); opacity: 0; } 40% { transform: scale(1.6) rotate(45deg); opacity: 1; } 100% { transform: scale(.4) rotate(90deg); opacity: 0; } }
@keyframes enter { from { opacity: 0; transform: translateX(3rem); } }
@keyframes dropIn { from { transform: translateY(-6rem); opacity: 0; } }
</style>
