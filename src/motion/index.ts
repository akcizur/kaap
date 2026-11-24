export const MOTION = {
  page: {
    distance: 22,
    exit: { duration: 190, easing: 'cubic-bezier(.55, 0, .8, .35)' },
    enter: { duration: 260, easing: 'cubic-bezier(.2, .82, .2, 1)' },
  },
  control: {
    icon: { duration: 240, easing: 'cubic-bezier(.2, .82, .2, 1)' },
  },
} as const

export type MotionChannel = 'route' | 'control'
export type MotionHandle = {
  finished: Promise<boolean>
  cancel: () => void
}

type MotionRequest = {
  channel: MotionChannel
  element: HTMLElement
  keyframes: Keyframe[]
  timing: KeyframeAnimationOptions
}

function idleMotion(): MotionHandle {
  return { finished: Promise.resolve(false), cancel: () => undefined }
}

/** Single owner for WAAPI motion. Route motion is exclusive; controls are single-flight. */
class MotionDirector {
  private active = new Map<MotionChannel, Animation>()
  private routeLocked = false

  prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  beginRoute(): void {
    this.routeLocked = true
    this.cancelAll()
  }

  endRoute(): void {
    this.cancelAll()
    this.routeLocked = false
  }

  play(request: MotionRequest): MotionHandle {
    const { channel, element, keyframes, timing } = request
    if (this.prefersReducedMotion() || !element.isConnected || typeof element.animate !== 'function') {
      return idleMotion()
    }
    if (this.routeLocked && channel !== 'route') return idleMotion()
    if (channel === 'route' && !this.routeLocked) return idleMotion()

    this.cancel(channel)
    let animation: Animation
    try {
      animation = element.animate(keyframes, { ...timing, fill: 'both' })
    } catch {
      return idleMotion()
    }

    this.active.set(channel, animation)
    const finished = animation.finished
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        if (this.active.get(channel) === animation) this.active.delete(channel)
      })

    return {
      finished,
      cancel: () => {
        if (this.active.get(channel) === animation) this.active.delete(channel)
        animation.cancel()
      },
    }
  }

  cancel(channel: MotionChannel): void {
    const animation = this.active.get(channel)
    if (!animation) return
    this.active.delete(channel)
    animation.cancel()
  }

  cancelAll(): void {
    for (const channel of this.active.keys()) this.cancel(channel)
  }
}

export const motionDirector = new MotionDirector()
