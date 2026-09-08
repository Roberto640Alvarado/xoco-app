import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Reescrito con useSyncExternalStore en vez del patrón original de shadcn
// (useState + setState síncrono dentro del efecto) — el eslint-plugin de
// react-hooks de este proyecto marca ese patrón como error
// (react-hooks/set-state-in-effect). useSyncExternalStore es además la
// forma idiomática de suscribirse a una fuente externa (matchMedia) sin
// pasar por un efecto manual.
function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
