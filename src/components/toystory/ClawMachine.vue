<script setup lang="ts">
/** Pizza Planet claw machine: the first grab brings up a three-eyed alien, the second grab gets the gift capsule. Emits `win`. */
import { ref } from 'vue'
import { toy as T } from '@/data/toyStoryContent'
import { prefersReducedMotion, useTimers } from '@/composables/useCardHelpers'

const emit = defineEmits<{ win: [] }>()
const reduce = prefersReducedMotion()
const { later } = useTimers()

/** claw x position in % (moves with the arrows), the capsule sits at 70% */
const x = ref(30)
const phase = ref<'idle' | 'down' | 'up' | 'alien' | 'won'>('idle')
const tries = ref(0)
const msg = ref('用 ◀ ▶ 移動爪子，按「抓！」')
const busy = () => phase.value === 'down' || phase.value === 'up'

function move(d: number) {
  if (busy() || phase.value === 'won') return
  x.value = Math.min(78, Math.max(18, x.value + d))
}
function grab() {
  if (busy() || phase.value === 'won') return
  phase.value = 'down'
  msg.value = '爪子降下去了……'
  later(() => {
    phase.value = 'up'
    later(() => {
      tries.value++
      if (tries.value === 1) { phase.value = 'alien'; msg.value = `三眼怪：「${T.stations.necklace2.alienLine}」（好像抓錯了，再試一次！）` }
      else { phase.value = 'won'; msg.value = '抓到了！是一顆發光的扭蛋！'; later(() => emit('win'), reduce ? 0 : 1300) }
    }, reduce ? 0 : 900)
  }, reduce ? 0 : 900)
}
</script>

<template>
  <div class="claw-machine">
    <div class="marquee">PIZZA PLANET</div>
    <div class="glass">
      <div class="rail"></div>
      <div class="claw" :class="phase" :style="{ left: `${x}%` }">
        <span class="cable"></span>
        <span class="head">
          <span class="prong l"></span><span class="prong r"></span>
          <span v-if="phase === 'alien' || (phase === 'up' && tries === 0)" class="held alien">👽</span>
          <span v-else-if="phase === 'won' || (phase === 'up' && tries >= 1)" class="held capsule"><span class="ball">?</span></span>
        </span>
      </div>
      <div class="pile" aria-hidden="true">
        <span v-for="n in 9" :key="n" class="alien-toy" :style="{ left: `${n * 10}%`, animationDelay: `${n * .2}s` }">👽</span>
        <span v-if="phase !== 'won' && !(phase === 'up' && tries >= 1)" class="capsule-floor"><span class="ball">?</span></span>
      </div>
    </div>
    <div class="controls">
      <button class="toy-btn blue" aria-label="爪子往左" @click="move(-12)">◀</button>
      <button class="toy-btn red grab" :disabled="busy() || phase === 'won'" @click="grab">抓！</button>
      <button class="toy-btn blue" aria-label="爪子往右" @click="move(12)">▶</button>
    </div>
    <p class="msg" role="status">{{ msg }}</p>
  </div>
</template>

<style scoped>
.claw-machine { width: 100%; max-width: 20rem; display: flex; flex-direction: column; align-items: center; gap: .7rem; }
.marquee { width: 100%; padding: .2rem; border: 3px solid var(--ink); border-radius: 14px 14px 4px 4px; background: var(--red); color: var(--yellow); font-family: var(--f-toy); font-size: 1.3rem; letter-spacing: .1em; text-align: center; text-shadow: 2px 2px 0 var(--ink); }
.glass { position: relative; width: 100%; height: 13rem; overflow: hidden; border: 3px solid var(--ink); border-radius: 6px; background: linear-gradient(#d8f1ff, #9fd8ff); box-shadow: inset 0 0 0 6px #ffffff66; }
.rail { position: absolute; left: 0; right: 0; top: 8px; height: 6px; background: #7a8494; }
.claw { position: absolute; top: 8px; width: 3rem; margin-left: -1.5rem; display: flex; flex-direction: column; align-items: center; transition: left .3s ease; }
.cable { width: 3px; height: 1.2rem; background: #4a5260; transition: height .9s ease-in-out; }
.claw.down .cable { height: 7.5rem; }
.claw.up .cable, .claw.alien .cable, .claw.won .cable { height: 1.2rem; }
.head { position: relative; width: 2.4rem; height: 1.1rem; border: 2px solid var(--ink); border-radius: 6px 6px 2px 2px; background: #c0c6d0; }
.prong { position: absolute; top: 90%; width: 4px; height: 1.3rem; background: #7a8494; border: 1px solid var(--ink); }
.prong.l { left: 2px; rotate: 18deg; transform-origin: top; } .prong.r { right: 2px; rotate: -18deg; transform-origin: top; }
.held { position: absolute; left: 50%; top: 2.1rem; translate: -50% 0; width: 2.4rem; font-size: 2rem; line-height: 1; text-align: center; animation: dangle .5s ease-in-out infinite alternate; }
.pile { position: absolute; left: 0; right: 0; bottom: 0; height: 3.6rem; }
.alien-toy { position: absolute; bottom: .1rem; font-size: 1.8rem; translate: -50% 0; animation: bounce 1.4s ease-in-out infinite; }
.capsule-floor { position: absolute; left: 70%; bottom: .4rem; width: 2.6rem; translate: -50% 0; filter: drop-shadow(0 0 8px #fff); }
/* mystery capsule: what is inside stays secret until it is won */
.ball { display: grid; place-items: center; width: 2.4rem; height: 2.4rem; border-radius: 50%; border: 2px solid var(--ink); background: linear-gradient(180deg, #ff8fb1 0 50%, #fffdf5 50%); font-family: var(--f-toy); font-size: 1.2rem; color: var(--ink); box-shadow: inset -4px -4px 0 #0001; }
.controls { display: flex; gap: .6rem; }
.grab { min-width: 6rem; }
.msg { margin: 0; min-height: 3em; font-size: .95rem; text-align: center; }
@keyframes dangle { from { rotate: -6deg; } to { rotate: 6deg; } }
@keyframes bounce { 50% { translate: -50% -4px; } }
</style>
