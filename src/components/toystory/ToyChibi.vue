<script setup lang="ts">
/**
 * Toy-style characters drawn after the real people:
 * her   — long straight black hair with a centre parting, round smiling face, red cowgirl hat with a sheriff star
 * james — messy golden-brown fringe, cool narrow eyes, navy quilted bomber over a white graphic tee, light ripped jeans, black boots
 * Colours come from toyStoryContent.looks.
 */
import { computed } from 'vue'
import type { ToyLook } from '@/data/toyStoryContent'

const props = defineProps<{ look: ToyLook; kind: 'her' | 'james'; flip?: boolean; wave?: boolean; spread?: boolean }>()
const sleeve = computed(() => (props.kind === 'james' ? props.look.jacket || '#2e3f66' : props.look.shirt))
/** arm end points: relaxed / arms flung wide (James's photo pose) */
const armL = computed(() => (props.spread ? { d: 'M18 54 L5 42', hx: 4, hy: 40.5 } : { d: 'M18 54 L10 66', hx: 9, hy: 68 }))
const armR = computed(() => (props.spread ? { d: 'M46 54 L59 42', hx: 60, hy: 40.5 } : { d: 'M46 54 L54 66', hx: 55, hy: 68 }))
</script>

<template>
  <svg class="chibi" :class="{ flip }" viewBox="0 0 64 98" aria-hidden="true">
    <g stroke="#2a1a10" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
      <!-- long hair falls behind the body -->
      <path v-if="kind === 'her'" d="M13.5 28 Q11 60 17 64 H47 Q53 60 50.5 28 Z" :fill="look.hair" />

      <!-- ===== legs ===== -->
      <template v-if="kind === 'her'">
        <path d="M22 70 H31 V88 H22 Z M33 70 H42 V88 H33 Z" :fill="look.pants" />
        <path d="M19 86 H31 V93 H19 Z M33 86 H45 V93 H33 Z" fill="#6b3d1e" />
      </template>
      <template v-else>
        <path d="M18.5 70 H31.5 L32 89 H17 Z M32.5 70 H45.5 L47 89 H32 Z" :fill="look.pants" />
        <path d="M21 76 h4 M23 80 h3 M37 78 h4 M38 83 h3" stroke="#ffffff" stroke-width="1.3" />
        <g fill="#ffffff" stroke="none"><circle cx="27" cy="74" r=".9" /><circle cx="20" cy="84" r=".8" /><circle cx="42" cy="73" r=".9" /><circle cx="44" cy="86" r=".7" /><circle cx="35" cy="87" r=".8" /></g>
        <path d="M15.5 87 H32 V94 H14.5 Q14 90 15.5 87 Z M32 87 H48.5 Q50 90 49.5 94 H32 Z" fill="#1f1f22" />
      </template>

      <!-- ===== body ===== -->
      <template v-if="kind === 'her'">
        <path d="M18 52 Q32 44 46 52 L47 72 H17 Z" :fill="look.shirt" />
        <path d="M24 49 L32 58 L40 49" fill="none" />
        <path class="badge" d="M39 60 l1.6 3.4 3.7.4 -2.8 2.5 .8 3.6 -3.3 -1.9 -3.3 1.9 .8 -3.6 -2.8 -2.5 3.7 -.4z" fill="#ffcc29" stroke-width="1.2" />
      </template>
      <template v-else>
        <!-- white graphic tee -->
        <path d="M18 52 Q32 45 46 52 L47 73 H17 Z" :fill="look.shirt" />
        <path d="M25.5 59 q3 -4 6.5 -1.2 q3.5 -3 6.5 1.2 q-1.6 4 -6.5 3.6 q-4.9 .4 -6.5 -3.6 Z" fill="#8d939d" stroke-width="1.2" />
        <path d="M27.5 59.6 l3 1 M36.5 59.6 l-3 1" stroke="#f4f4f2" stroke-width="1" />
        <!-- navy quilted bomber, worn open -->
        <path d="M16 51 Q21 47.5 26.5 47.5 L27.5 74 H14.5 Z" :fill="look.jacket" />
        <path d="M48 51 Q43 47.5 37.5 47.5 L36.5 74 H49.5 Z" :fill="look.jacket" />
        <path d="M17 57 H26.6 M16 63 H27 M15.4 69 H27.3 M47 57 H37.4 M48 63 H37 M48.6 69 H36.7" stroke="#1b2745" stroke-width="1.1" />
        <path d="M26.5 47.5 L29.5 53 L27.6 54 M37.5 47.5 L34.5 53 L36.4 54" :fill="look.jacket" />
      </template>

      <!-- ===== arms ===== -->
      <path :d="armL.d" :stroke="sleeve" :stroke-width="kind === 'james' ? 8.5 : 7" />
      <path :class="{ waving: wave && !spread }" :d="armR.d" :stroke="sleeve" :stroke-width="kind === 'james' ? 8.5 : 7" />
      <circle :cx="armL.hx" :cy="armL.hy" r="3.6" :fill="look.skin" />
      <circle :class="{ waving: wave && !spread }" :cx="armR.hx" :cy="armR.hy" r="3.6" :fill="look.skin" />

      <!-- ===== head: her ===== -->
      <template v-if="kind === 'her'">
        <ellipse cx="32" cy="33" rx="17.5" ry="17" :fill="look.skin" />
        <!-- centre-parted curtain fringe -->
        <path d="M32 16.5 Q20 16 15 30 Q14.4 40 16.6 47 Q17.4 33 23.6 25.4 Q28 20.4 32 18.6 Z" :fill="look.hair" />
        <path d="M32 16.5 Q44 16 49 30 Q49.6 40 47.4 47 Q46.6 33 40.4 25.4 Q36 20.4 32 18.6 Z" :fill="look.hair" />
        <!-- cowgirl hat (sits high so the parting shows) -->
        <path d="M5 17 Q32 27 59 17 Q57 23.5 32 25 Q7 23.5 5 17 Z" :fill="look.hat" />
        <path d="M19 18 Q19 2.5 32 4.5 Q45 2.5 45 18 Q32 21 19 18 Z" :fill="look.hat" />
        <path d="M19.6 14.4 Q32 18.4 44.4 14.4" fill="none" stroke="#7a1a12" stroke-width="2.5" />
        <!-- smiling eyes, blush, sweet smile -->
        <path d="M22.6 34.6 q3 -3.4 6 0 M35.4 34.6 q3 -3.4 6 0" fill="none" stroke-width="2" />
        <path d="M22.4 33.4 l-1.4 -1 M41.6 33.4 l1.4 -1" stroke-width="1.2" />
        <circle cx="21" cy="39.5" r="2.8" fill="#f59a9a" opacity=".55" stroke="none" />
        <circle cx="43" cy="39.5" r="2.8" fill="#f59a9a" opacity=".55" stroke="none" />
        <path d="M27.6 40.4 q4.4 3.8 8.8 0" fill="#e88a8a" stroke-width="1.6" />
      </template>

      <!-- ===== head: James ===== -->
      <template v-else>
        <path d="M15.5 30 Q15 43 19.5 46 H44.5 Q49 43 48.5 30 Z" :fill="look.hairRoot || look.hair" />
        <ellipse cx="32" cy="33" rx="16" ry="17.5" :fill="look.skin" />
        <!-- messy golden fringe with darker roots -->
        <path
          d="M14.5 34 Q12 12.5 32 11.5 Q52 12.5 49.5 34 L47.4 27 L45.6 32.6 L43 24.6 L40.4 31.4 L37.6 23.6 L34.8 30.6 L31.6 22.8 L28.6 30.8 L25.6 23.8 L22.8 31 L20.4 25.6 L18 32.6 L16.6 28 Z"
          :fill="look.hair"
        />
        <path d="M17.6 19.6 Q32 9.6 46.4 19.6 Q40 15 32 15.4 Q24 15 17.6 19.6 Z" :fill="look.hairRoot || look.hair" opacity=".75" stroke="none" />
        <path d="M24 17.6 l2.6 6 M33 15.6 l1.4 6.4 M40.4 17.4 l-1.2 6" stroke="#a8844e" stroke-width="1" />
        <!-- cool almond eyes, small closed mouth -->
        <path d="M22.4 35.2 q3.4 -2.8 6.8 -.4 q-3.4 1.8 -6.8 .4 Z M34.8 34.8 q3.4 -2.4 6.8 .4 q-3.4 1.4 -6.8 -.4 Z" fill="#2a1a10" stroke-width="1.2" />
        <circle cx="26.6" cy="34.6" r=".6" fill="#fff" stroke="none" /><circle cx="39" cy="34.6" r=".6" fill="#fff" stroke="none" />
        <path d="M31 38 q1 .8 2 0" fill="none" stroke="#c99a84" stroke-width="1" />
        <path d="M29.4 41.6 q2.6 1.2 5.2 0" fill="#d98a8a" stroke-width="1.3" />
      </template>
    </g>
  </svg>
</template>

<style scoped>
.chibi { display: block; width: 100%; height: auto; overflow: visible; }
.chibi.flip { transform: scaleX(-1); }
.badge { transform-box: fill-box; transform-origin: center; animation: glint 2.4s ease-in-out infinite; }
.waving { transform-box: view-box; transform-origin: 46px 54px; animation: wave .5s ease-in-out infinite alternate; }
@keyframes glint { 50% { filter: brightness(1.4); } }
@keyframes wave { from { rotate: 0deg; } to { rotate: -70deg; } }
</style>
