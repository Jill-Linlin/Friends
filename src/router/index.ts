import { createRouter, createWebHashHistory } from 'vue-router'

/** 每種風格一個網址：#/star、#/time-machine（hash 模式部署到 GitHub Pages 等靜態空間時不會 404） */
export const STYLES = [
  { path: '/star', name: 'star', label: '星夜', component: () => import('@/components/StarAcademyCard.vue') },
  { path: '/time-machine', name: 'timemachine', label: '時光機', component: () => import('@/components/TimeMachineCard.vue') },
] as const

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/star' },
    ...STYLES.map(({ path, name, component }) => ({ path, name, component })),
    { path: '/:pathMatch(.*)*', redirect: '/star' },
  ],
})

export default router
