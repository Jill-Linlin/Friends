<script setup lang="ts">
/** Flat cartoon duo for the landing card: a space ranger and a cowboy, thick navy outlines, rosy cheeks. */
</script>

<template>
  <svg class="heroes" viewBox="0 0 124 112" aria-hidden="true">
    <g stroke="#2b2a4c" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
      <!-- ================= space ranger ================= -->
      <g class="ranger">
        <!-- legs + boots -->
        <rect x="15" y="74" width="11" height="21" rx="3" fill="#ffffff" />
        <rect x="31" y="74" width="11" height="21" rx="3" fill="#ffffff" />
        <path d="M16 82 h9 M32 82 h9" stroke-width="1.4" />
        <rect x="12" y="92" width="16" height="7" rx="3.5" fill="#9be06b" />
        <rect x="29" y="92" width="16" height="7" rx="3.5" fill="#9be06b" />
        <!-- arms (hands on hips) -->
        <path d="M11 55 Q3 62 7 70 L14 71" fill="none" stroke-width="9" />
        <path d="M11 55 Q3 62 7 70 L14 71" fill="none" stroke="#ffffff" stroke-width="5.6" />
        <path d="M46 55 Q54 62 50 70 L43 71" fill="none" stroke-width="9" />
        <path d="M46 55 Q54 62 50 70 L43 71" fill="none" stroke="#ffffff" stroke-width="5.6" />
        <path d="M5.4 62 l3 1.4 M51.6 62 l-3 1.4" stroke="#7b5bb8" stroke-width="2" />
        <!-- body armour -->
        <path d="M11 52 Q28.5 45 46 52 L44 71 H13 Z" fill="#ffffff" />
        <path d="M12 50.5 Q28.5 44 45 50.5 L43.4 58.6 Q28.5 54 13.6 58.6 Z" fill="#9be06b" />
        <path d="M26 50 l2.5 3 2.5 -3" fill="none" stroke-width="1.4" />
        <rect x="15.5" y="60" width="2.4" height="6" rx="1" fill="#e23b2e" stroke-width="1" />
        <rect x="18.6" y="60" width="2.4" height="6" rx="1" fill="#2f6fdb" stroke-width="1" />
        <rect x="21.7" y="60" width="2.4" height="6" rx="1" fill="#5cbf3a" stroke-width="1" />
        <circle cx="38.5" cy="63" r="3.4" fill="#e23b2e" />
        <rect x="13" y="69.5" width="31" height="5.5" rx="2" fill="#7b5bb8" />
        <path d="M20 72 h17" stroke="#2b2a4c" stroke-width="1.4" />
        <!-- hood + face -->
        <path d="M13 36 Q12 16 28.5 15 Q45 16 44 36 L42 46 H15 Z" fill="#7b5bb8" />
        <path d="M18 27 Q18 20 28.5 20 Q39 20 39 27 V38 Q39 47 28.5 47 Q18 47 18 38 Z" fill="#f7d2b6" />
        <path d="M22 26 q2.6 -1.6 5 0 M30 26 q2.6 -1.6 5 0" fill="none" stroke-width="1.6" />
        <circle cx="24.6" cy="30" r="1.7" fill="#2b2a4c" stroke="none" />
        <circle cx="32.4" cy="30" r="1.7" fill="#2b2a4c" stroke="none" />
        <circle cx="21.4" cy="35.4" r="2.2" fill="#f59a9a" opacity=".6" stroke="none" />
        <circle cx="35.6" cy="35.4" r="2.2" fill="#f59a9a" opacity=".6" stroke="none" />
        <path d="M23.2 36.4 Q28.5 42.4 33.8 36.4 Z" fill="#ffffff" stroke-width="1.6" />
        <path d="M27.6 43.6 q.9 1 1.8 0" fill="none" stroke-width="1.2" />
        <!-- glass helmet -->
        <circle cx="28.5" cy="31" r="21" fill="#dff3ff" fill-opacity=".28" />
        <path d="M16 20 q4 -6 10 -7.6" fill="none" stroke="#ffffff" stroke-width="2.4" />
        <ellipse cx="17.6" cy="26" rx="1.6" ry="2.6" fill="#ffffff" stroke="none" transform="rotate(25 17.6 26)" />
      </g>

      <!-- ================= cowboy ================= -->
      <g class="cowboy">
        <!-- legs + boots -->
        <rect x="78" y="75" width="10" height="17" rx="2" fill="#4a73b5" />
        <rect x="90" y="75" width="10" height="17" rx="2" fill="#4a73b5" />
        <path d="M76 89 H88 V99 H73 Q73 94 76 92 Z M90 89 H102 V92 Q105 94 105 99 H90 Z" fill="#8a5a3a" />
        <path d="M78 93 h6 M93 93 h6" stroke="#5e3a1e" stroke-width="1.2" />
        <!-- arms -->
        <path d="M76 55 Q70 64 72 73" fill="none" stroke-width="8.6" />
        <path d="M76 55 Q70 64 72 73" fill="none" stroke="#f2c14e" stroke-width="5.2" />
        <path d="M102 55 Q110 62 105 69 L100 69" fill="none" stroke-width="8.6" />
        <path d="M102 55 Q110 62 105 69 L100 69" fill="none" stroke="#f2c14e" stroke-width="5.2" />
        <circle cx="72.4" cy="75" r="3.2" fill="#f7d2b6" />
        <!-- shirt + vest + bandana -->
        <path d="M75 52 Q89 46.6 103 52 L102 75 H76 Z" fill="#f2c14e" />
        <path d="M80 54 V74 M86 52 V74 M92 52 V74 M98 54 V74 M76 60 H102 M76 67 H102" stroke="#d99a2b" stroke-width="1" />
        <path d="M75 52 L83 50 L85 75 H76 Z" fill="#ffffff" />
        <path d="M103 52 L95 50 L93 75 H102 Z" fill="#ffffff" />
        <g fill="#2b2a4c" stroke="none">
          <path d="M77.6 56 q2 -1 2.6 1 q-.6 2 -2.6 1.4 Z" /><path d="M79 66 q2.4 -.4 2.4 1.8 q-1.4 1.6 -2.8 .4 Z" />
          <path d="M96 57 q2 -.6 2.4 1.4 q-1.2 1.4 -2.6 .6 Z" /><path d="M97.6 68 q1.8 -.4 2 1.4 q-1.2 1.2 -2.2 .2 Z" />
        </g>
        <path d="M80.4 63.8 l1.3 2.6 2.9.3 -2.1 2 .6 2.8 -2.6 -1.4 -2.6 1.4 .6 -2.8 -2.1 -2 2.9 -.3z" fill="#ffcc29" stroke-width="1" />
        <path d="M82 49 L89 56 L96 49 Z" fill="#e23b2e" />
        <path d="M95 50 l7 2 l-3 3.4 Z" fill="#e23b2e" stroke-width="1.6" />
        <rect x="76" y="72.5" width="26" height="4.4" rx="1.4" fill="#6b3d1e" />
        <ellipse cx="89" cy="74.7" rx="4.2" ry="3" fill="#ffcc29" stroke-width="1.4" />
        <!-- head -->
        <path d="M77 22 Q76 47 89 48.6 Q102 47 101 22 Z" fill="#f7d2b6" />
        <path d="M77 25 Q78 18 89 18 Q100 18 101 25 Q96 21.6 89 24 Q82 21.6 77 25 Z" fill="#6b3d1e" />
        <ellipse cx="76.6" cy="33" rx="2.4" ry="3.4" fill="#f7d2b6" />
        <ellipse cx="101.4" cy="33" rx="2.4" ry="3.4" fill="#f7d2b6" />
        <path d="M81.6 26.6 q2.6 -1.6 5 0 M91.4 26.6 q2.6 -1.6 5 0" fill="none" stroke-width="1.6" />
        <ellipse cx="84" cy="31" rx="1.9" ry="2.6" fill="#2b2a4c" stroke="none" />
        <ellipse cx="94" cy="31" rx="1.9" ry="2.6" fill="#2b2a4c" stroke="none" />
        <circle cx="84.6" cy="30.2" r=".7" fill="#fff" stroke="none" /><circle cx="94.6" cy="30.2" r=".7" fill="#fff" stroke="none" />
        <circle cx="80.4" cy="37" r="2.4" fill="#f59a9a" opacity=".6" stroke="none" />
        <circle cx="97.6" cy="37" r="2.4" fill="#f59a9a" opacity=".6" stroke="none" />
        <path d="M84.4 38.4 q4.6 4 9.2 0" fill="none" stroke-width="1.8" />
        <!-- hat -->
        <path d="M60 20 Q89 30 118 20 Q114 13 104 15 Q89 21 74 15 Q64 13 60 20 Z" fill="#8a5a3a" />
        <path d="M75 17 Q75 1 89 3 Q103 1 103 17 Q89 21 75 17 Z" fill="#8a5a3a" />
        <path d="M84 4.4 q5 3 10 0" fill="none" stroke="#5e3a1e" stroke-width="1.4" />
        <path d="M75.6 14 Q89 18.4 102.4 14" fill="none" stroke="#5e3a1e" stroke-width="2.4" />
      </g>
    </g>
    <ellipse cx="62" cy="104" rx="50" ry="4" fill="#2b2a4c" opacity=".18" />
  </svg>
</template>

<style scoped>
.heroes { display: block; width: 100%; height: auto; overflow: visible; }
.ranger { animation: bob 2.4s ease-in-out infinite; }
.cowboy { animation: bob 2.4s ease-in-out 1.2s infinite; }
@keyframes bob { 50% { transform: translateY(-2px); } }
</style>
