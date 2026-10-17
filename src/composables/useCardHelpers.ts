import { nextTick, onBeforeUnmount, ref } from 'vue'

/** setTimeout that is cleared automatically when the component unmounts (e.g. switching styles mid-animation). */
export function useTimers() {
  const ids = new Set<number>()
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => { ids.delete(id); fn() }, ms)
    ids.add(id)
    return id
  }
  const wait = (ms: number) => new Promise<void>(res => later(res, ms))
  const clearAll = () => { ids.forEach(clearTimeout); ids.clear() }
  onBeforeUnmount(clearAll)
  return { later, wait, clearAll }
}

/** Re-playable CSS animation class (the original `classList.remove → offsetWidth → add` trick). */
export function useRetrigger() {
  const active = ref(false)
  const fire = async () => {
    active.value = false
    await nextTick()
    void document.body.offsetWidth
    active.value = true
  }
  return { active, fire }
}

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** 'YYYY-MM-DD' → whole days from today (0 once the day has arrived) and a Chinese date label */
export function countdownTo(date: string) {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.max(0, Math.ceil((new Date(y, m - 1, d).getTime() - today.getTime()) / 864e5))
  return { days, label: `${y} 年 ${m} 月 ${d} 日` }
}
