// Screen navigation. App.svelte keeps a "stack" of screens: push() opens a screen on top,
// pop() goes back to the one underneath.
//
// Svelte "context" lets App share the nav functions with every screen inside it,
// without passing them down through props at each level.
import { getContext, setContext } from 'svelte'

const KEY = Symbol('nav')

export function provideNav(nav) {
  setContext(KEY, nav)
}

// Use in any screen: const nav = useNav(); nav.push(SomeScreen, { someProp }); nav.pop()
export function useNav() {
  return getContext(KEY)
}
