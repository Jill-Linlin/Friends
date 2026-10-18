<script setup lang="ts">
/**
 * Cartoon versions of the real gifts (drawn after the product photos):
 * necklace1 = brown suede lariat + gold oval slider + gold sheriff star
 * necklace2 = silver chain with little Toy Story charms
 * clips     = two silver bobby pins (logo badge with a gold star / pink Woody & Bullseye disc)
 * ring      = gold band engraved "YOU'VE GOT A FRIEND IN ME" with two crystals
 */
export type GiftKind = 'necklace1' | 'necklace2' | 'clips' | 'ring' | 'james' | 'start'
defineProps<{ kind: GiftKind }>()

/** crop each drawing to its own bounds so it fills the space it is given */
const VIEW: Record<GiftKind, string> = {
  necklace1: '2 2 56 58',
  necklace2: '3 4 54 36',
  clips: '2 1 57 50',
  ring: '8 16 44 36',
  james: '0 0 60 60',
  start: '6 10 48 44',
}

/** n-point star path */
function star(cx: number, cy: number, r: number, inner: number, n = 5) {
  const pts: string[] = []
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n
    const rr = i % 2 ? inner : r
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)} ${(cy + Math.sin(a) * rr).toFixed(2)}`)
  }
  return `M${pts.join(' L')} Z`
}
/** sheriff star: 6 points with ball tips */
const SHERIFF = { path: star(17, 50, 7.4, 3.8, 6), tips: Array.from({ length: 6 }, (_, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 3
  return { x: 17 + Math.cos(a) * 7.4, y: 50 + Math.sin(a) * 7.4 }
}) }
const TINY_STAR = star(10.8, 18.6, 2.6, 1.1)
const LOGO_STAR = star(27.5, 30.5, 2.6, 1.1)
const BIG_STAR = star(30, 30, 16, 7)
</script>

<template>
  <svg class="gift-icon" :viewBox="VIEW[kind]" aria-hidden="true">
    <!-- 第一條項鍊：麂皮繩 + 金色滑扣 + 警長星星 -->
    <g v-if="kind === 'necklace1'" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 4 Q7 30 27 41 M51 4 Q53 30 33 41" fill="none" stroke="#5e3a1e" stroke-width="3.4" />
      <path d="M9 4 Q7 30 27 41 M51 4 Q53 30 33 41" fill="none" stroke="#9a6236" stroke-width="2" />
      <path d="M14 4 Q13 27 28 38 M46 4 Q47 27 32 38" fill="none" stroke="#5e3a1e" stroke-width="3.4" />
      <path d="M14 4 Q13 27 28 38 M46 4 Q47 27 32 38" fill="none" stroke="#a86d3e" stroke-width="2" />
      <path d="M33 43 Q37 51 39 59" fill="none" stroke="#5e3a1e" stroke-width="3.4" />
      <path d="M33 43 Q37 51 39 59" fill="none" stroke="#9a6236" stroke-width="2" />
      <path d="M27 43 Q22 41 18.5 43.5" fill="none" stroke="#5e3a1e" stroke-width="3.4" />
      <path d="M27 43 Q22 41 18.5 43.5" fill="none" stroke="#9a6236" stroke-width="2" />
      <ellipse cx="30" cy="41.5" rx="5.6" ry="3.4" transform="rotate(-14 30 41.5)" fill="#f0c24a" stroke="#8a6418" stroke-width="1.3" />
      <path d="M27 40.6 q3 -1.6 6 -.8" fill="none" stroke="#fff3c4" stroke-width="1" />
      <path :d="SHERIFF.path" fill="#f0c24a" stroke="#8a6418" stroke-width="1.2" />
      <circle v-for="(t, i) in SHERIFF.tips" :key="i" :cx="t.x" :cy="t.y" r="1.35" fill="#f0c24a" stroke="#8a6418" stroke-width=".9" />
      <circle cx="17" cy="50" r="1.8" fill="none" stroke="#b8891f" stroke-width=".9" />
    </g>

    <!-- 第二條項鍊：銀鍊 + 玩具總動員小吊飾 -->
    <g v-else-if="kind === 'necklace2'" stroke="#6b7380" stroke-width=".9" stroke-linejoin="round" stroke-linecap="round" fill="#e6eaef">
      <path d="M4 6 Q30 48 56 6" fill="none" stroke="#8d96a3" stroke-width="2.2" stroke-dasharray="1.6 1.2" />
      <!-- star -->
      <path :d="TINY_STAR" />
      <!-- rocket -->
      <g transform="rotate(-35 15.6 25)">
        <rect x="13.9" y="20.6" width="3.4" height="8.4" rx="1.7" />
        <path d="M13.9 27 l-1.4 2 h1.4 Z M17.3 27 l1.4 2 h-1.4 Z" />
        <circle cx="15.6" cy="23.6" r=".8" fill="#9fb4d0" />
      </g>
      <!-- dinosaur -->
      <path d="M19.4 34.5 q-.4 -4.6 3.2 -5.6 l1.4 -2.4 q2.4 -.6 3 1 l-1.4 1.4 q.6 2.4 -1 4 l.4 2 h-1.2 l-.4 -1.4 h-1.6 l-.2 1.4 h-1.2 Z" />
      <circle cx="25.3" cy="27.6" r=".35" fill="#2a2f38" stroke="none" />
      <!-- astronaut -->
      <rect x="27.3" y="33" width="5.4" height="5.6" rx="1.6" />
      <circle cx="30" cy="30.6" r="3.2" />
      <ellipse cx="30" cy="30.8" rx="2" ry="1.5" fill="#b9a4e0" />
      <path d="M28.6 35.2 h2.8" stroke="#5cbf3a" stroke-width="1" />
      <!-- cowboy -->
      <path d="M34.4 28.6 h5.6 M35.6 28.6 q.2 -2.2 1.6 -2.2 q1.4 0 1.6 2.2" />
      <circle cx="37.2" cy="30.4" r="1.7" />
      <rect x="35.6" y="32.2" width="3.2" height="5.2" rx="1" />
      <!-- cloud -->
      <path d="M41.6 25.2 a1.6 1.6 0 0 1 1.4 -2.4 a2 2 0 0 1 3.6 .4 a1.4 1.4 0 0 1 .6 2.6 Z" />
      <!-- heart -->
      <path d="M49.2 16.6 c-.8 -1.6 -3 -1 -2.6 .8 c.3 1.2 2.6 2.8 2.6 2.8 c0 0 2.3 -1.6 2.6 -2.8 c.4 -1.8 -1.8 -2.4 -2.6 -.8 Z" />
    </g>

    <!-- 一對髮夾 -->
    <g v-else-if="kind === 'clips'" stroke-linecap="round" stroke-linejoin="round">
      <!-- left pin with the logo badge -->
      <path d="M5 8 L22 27 M7 6.4 Q10 9 9.6 10.4 Q12.6 12.6 12.4 14.2 Q15.4 16.4 15.2 18 Q18.4 20.4 18.2 22 L23.6 25.6" fill="none" stroke="#7d8692" stroke-width="2.2" />
      <path d="M5 8 L22 27 M7 6.4 Q10 9 9.6 10.4 Q12.6 12.6 12.4 14.2 Q15.4 16.4 15.2 18 Q18.4 20.4 18.2 22 L23.6 25.6" fill="none" stroke="#e3e7ec" stroke-width="1" />
      <path d="M15.6 30 q-.6 -4 3.4 -4.4 q1 -2.6 4 -1.8 q2.4 -1.6 4.4 .4 q3.2 .2 2.6 3.4 l-.4 6.4 q-3.4 2.8 -8 2.4 q-4.6 -.6 -6 -3.6 Z" fill="#e6eaef" stroke="#6b7380" stroke-width="1.2" />
      <path d="M18.6 29.6 h7.4 M18 32.4 h8.8" stroke="#9aa3ae" stroke-width="1.2" />
      <path :d="LOGO_STAR" fill="#ffcc29" stroke="#8a6418" stroke-width=".8" />
      <!-- right pin with the pink Woody & Bullseye disc -->
      <path d="M28 4 L44 28 M30.4 3 Q33 6 32.8 7.6 Q35.6 10 35.4 11.6 Q38.2 14 38 15.6 Q41 18 40.8 19.6 L46 24.6" fill="none" stroke="#7d8692" stroke-width="2.2" />
      <path d="M28 4 L44 28 M30.4 3 Q33 6 32.8 7.6 Q35.6 10 35.4 11.6 Q38.2 14 38 15.6 Q41 18 40.8 19.6 L46 24.6" fill="none" stroke="#e3e7ec" stroke-width="1" />
      <circle cx="46" cy="38" r="11" fill="#d9dee5" stroke="#6b7380" stroke-width="1.2" />
      <circle cx="46" cy="38" r="9.4" fill="#f4a3c4" stroke="#b9c0ca" stroke-width="1.6" stroke-dasharray="1 .9" />
      <!-- Bullseye -->
      <path d="M40.4 44 q-.4 -5 2.4 -7.4 l-.6 -3 l2 1.6 l1.4 -1.4 v2.4 q2 1.6 1.4 4.6 q-.6 2.6 -3 3.4 Z" fill="#fff" stroke="#8d4a6a" stroke-width=".8" />
      <circle cx="43.6" cy="38.8" r=".4" fill="#8d4a6a" />
      <!-- Woody's hat + face -->
      <path d="M46.4 33.2 h7 M47.8 33.2 q.2 -2.8 2 -2.8 q1.8 0 2 2.8" fill="#fff" stroke="#8d4a6a" stroke-width=".9" />
      <circle cx="49.9" cy="35.8" r="2.3" fill="#fff" stroke="#8d4a6a" stroke-width=".9" />
      <path d="M48.6 39 q1.3 1.8 2.6 0 v4 h-2.6 Z" fill="#fff" stroke="#8d4a6a" stroke-width=".8" />
    </g>

    <!-- 戒指：金色、刻字、兩顆小鑽 -->
    <g v-else-if="kind === 'ring'" stroke-linejoin="round">
      <path d="M10 34 a20 15 0 1 0 40 0 a20 15 0 1 0 -40 0 Z M15 32 a15 9.4 0 1 1 30 0 a15 9.4 0 1 1 -30 0 Z" fill="#f0c24a" fill-rule="evenodd" stroke="#8a6418" stroke-width="1.4" />
      <path d="M12.6 38 q17.4 10.4 34.8 0" fill="none" stroke="#c99520" stroke-width="1" />
      <path d="M14 27 q4 -6 12 -7.6" fill="none" stroke="#fff3c4" stroke-width="1.6" stroke-linecap="round" />
      <text x="30" y="45.6" class="engrave">FRIEND IN ME</text>
      <circle cx="16" cy="40.6" r="1.7" fill="#fff" stroke="#8a6418" stroke-width=".8" />
      <circle cx="44" cy="40.6" r="1.7" fill="#fff" stroke="#8a6418" stroke-width=".8" />
      <path d="M43.4 40 l.6 .6 M15.4 40 l.6 .6" stroke="#bfe9ff" stroke-width=".7" />
    </g>

    <!-- James 的星星 -->
    <g v-else-if="kind === 'james'" stroke="#2a1a10" stroke-width="2" stroke-linejoin="round">
      <circle cx="30" cy="30" r="24" fill="#2b3a55" />
      <path :d="BIG_STAR" fill="#ffcc29" />
    </g>

    <!-- 起點：玩具箱 -->
    <g v-else stroke="#2a1a10" stroke-width="2.2" stroke-linejoin="round">
      <rect x="10" y="22" width="40" height="28" rx="3" fill="#e23b2e" />
      <path d="M8 22 Q30 10 52 22 Z" fill="#2f6fdb" />
      <path d="M10 34 H50" stroke="#ffcc29" stroke-width="3" />
    </g>
  </svg>
</template>

<style scoped>
.gift-icon { display: block; width: 100%; height: auto; overflow: visible; }
.engrave { font-family: "Luckiest Guy", sans-serif; font-size: 4.4px; letter-spacing: .3px; fill: #9a6e12; text-anchor: middle; }
</style>
