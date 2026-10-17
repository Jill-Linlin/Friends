<script setup lang="ts">
/** Comic-style drawings of the secret gadgets used by GadgetCard (thick dark outlines, flat colours). */
export type GadgetKind = 'pocket' | 'timeMachine' | 'memoryBread' | 'konjac' | 'bambooCopter' | 'dorayaki' | 'bell'
defineProps<{ kind: GadgetKind; spin?: boolean }>()
</script>

<template>
  <svg class="art" :class="kind" viewBox="0 0 120 120" aria-hidden="true">
    <g fill="none" stroke="#1d1d1f" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
      <!-- 四次元口袋 -->
      <template v-if="kind === 'pocket'">
        <path d="M12 44 H108 A48 48 0 0 1 12 44 Z" fill="#fff" />
        <path d="M22 44 H98" stroke-width="2" opacity=".35" />
      </template>

      <!-- 時光機 -->
      <template v-else-if="kind === 'timeMachine'">
        <path d="M8 82 L38 64 H114 L84 82 Z" fill="#cfd8dc" />
        <path d="M8 82 H84 V92 H8 Z" fill="#90a4ae" />
        <path d="M84 82 L114 64 V74 L84 92 Z" fill="#b0bec5" />
        <path d="M46 50 H78 V70 H46 Z" fill="#eceff1" />
        <circle cx="54" cy="58" r="3.5" fill="#e60012" />
        <circle cx="64" cy="58" r="3.5" fill="#ffd400" />
        <circle cx="54" cy="65" r="2" fill="#0096e0" stroke-width="2" />
        <path d="M60 64 H72" stroke-width="2" />
        <path d="M74 50 L82 32" />
        <circle cx="83" cy="30" r="5" fill="#e60012" />
      </template>

      <!-- 記憶麵包（吐司） -->
      <template v-else-if="kind === 'memoryBread'">
        <path d="M22 40 C22 20 40 14 60 14 C80 14 98 20 98 40 C98 47 94 51 91 53 V104 H29 V53 C26 51 22 47 22 40 Z" fill="#d9954a" />
        <path d="M31 41 C31 27 44 23 60 23 C76 23 89 27 89 41 C89 46 86 49 82 51 V96 H38 V51 C34 49 31 46 31 41 Z" fill="#fde7b8" stroke-width="2" />
      </template>

      <!-- 翻譯蒟蒻 -->
      <template v-else-if="kind === 'konjac'">
        <ellipse cx="60" cy="94" rx="46" ry="9" fill="#e3f2fd" />
        <path d="M24 52 Q24 42 34 42 H86 Q96 42 96 52 V82 Q96 90 86 90 H34 Q24 90 24 82 Z" fill="#9a8f82" />
        <path d="M30 48 Q30 46 34 46 H70" stroke="#c9bfb2" stroke-width="3" />
        <g fill="#5d554b" stroke="none">
          <circle cx="40" cy="60" r="2" /><circle cx="55" cy="70" r="2" /><circle cx="72" cy="58" r="2" />
          <circle cx="84" cy="74" r="2" /><circle cx="46" cy="80" r="2" /><circle cx="66" cy="82" r="2" />
        </g>
      </template>

      <!-- 竹蜻蜓 -->
      <template v-else-if="kind === 'bambooCopter'">
        <g class="blades" :class="{ spin }">
          <ellipse cx="60" cy="38" rx="48" ry="8" fill="#ffd400" />
        </g>
        <circle cx="60" cy="38" r="5" fill="#ffb300" />
        <path d="M57 42 H63 V80 H57 Z" fill="#ffca28" />
        <ellipse cx="60" cy="84" rx="16" ry="6" fill="#ffd400" />
      </template>

      <!-- 銅鑼燒 -->
      <template v-else-if="kind === 'dorayaki'">
        <ellipse cx="60" cy="70" rx="44" ry="22" fill="#a8642a" />
        <path d="M17 64 Q60 84 103 64 L103 68 Q60 90 17 68 Z" fill="#5d2a1a" />
        <ellipse cx="60" cy="56" rx="44" ry="22" fill="#c98140" />
        <ellipse cx="50" cy="49" rx="16" ry="6" fill="#e3a764" stroke="none" />
      </template>

      <!-- 鈴鐺 -->
      <template v-else-if="kind === 'bell'">
        <circle cx="60" cy="62" r="34" fill="#ffd400" />
        <path d="M28 52 H92 M28 59 H92" stroke-width="2.5" />
        <circle cx="60" cy="76" r="6" fill="#1d1d1f" />
        <path d="M60 80 V96" />
        <ellipse cx="47" cy="44" rx="7" ry="4" fill="#fff6b3" stroke="none" />
      </template>
    </g>
  </svg>
</template>

<style scoped>
.art { display: block; width: 100%; height: auto; overflow: visible; }
.blades { transform-box: fill-box; transform-origin: center; }
.blades.spin { animation: blades .18s linear infinite; }
@keyframes blades { 50% { transform: scaleX(.12); } }
</style>
