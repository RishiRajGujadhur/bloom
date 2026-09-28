import gsap from 'gsap'

/**
 * gsap.from() tweens are entrance animations. If one is killed half-way (a
 * React effect cleanup, StrictMode's double effects, a quick re-render), the
 * element would stay frozen at its "from" state — often opacity 0. Make kill()
 * finish the tween first so things always end up visible.
 */
let patched = false
export function installSafeFrom() {
  if (patched) return
  patched = true
  const from = gsap.from.bind(gsap)
  gsap.from = ((targets: gsap.TweenTarget, vars: gsap.TweenVars) => {
    const tw = from(targets, vars)
    const kill = tw.kill.bind(tw)
    tw.kill = ((...args: Parameters<typeof tw.kill>) => {
      if (tw.progress() < 1 && !tw.vars.repeat) tw.progress(1)
      return kill(...args)
    }) as typeof tw.kill
    return tw
  }) as typeof gsap.from
}
