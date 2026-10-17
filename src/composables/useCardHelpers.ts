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

export function saveReply(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* private mode etc. */ }
}
