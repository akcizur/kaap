import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { flushSync } from 'react-dom'
import {
  Globe2,
  Mail,
  Moon,
  Search,
  Sun,
  X,
} from 'lucide-react'
import { PostPage } from './components/PostPage'
import { PostCard } from './components/PostCard'
import { posts } from './data/posts'
import { VIEW_MODE_ORDER, VIEW_MODES } from './config/viewModes'
import { usePreferences } from './hooks/usePreferences'
import { MOTION, motionDirector, type MotionHandle } from './motion'

export default function App() {
  const { preferences, updatePreference } = usePreferences()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const layoutIconRef = useRef<HTMLSpanElement>(null)
  const themeIconRef = useRef<HTMLSpanElement>(null)
  const searchIconRef = useRef<HTMLSpanElement>(null)
  const previousViewModeRef = useRef(preferences.viewMode)
  const previousThemeRef = useRef(preferences.theme)
  const previousSearchOpenRef = useRef(searchOpen)
  const layoutSnapshotRef = useRef<{
    scrollY: number
    anchorPostId: string | null
    anchorTop: number | null
  } | null>(null)
  const transitionLockRef = useRef(false)
  const queuedNavigationRef = useRef<{
    postId: number | null
    direction: 'forward' | 'back'
    restoreScrollY: number
  } | null>(null)
  const [selectedPostId, setSelectedPostId] = useState<number | null>(() => {
    const value = new URLSearchParams(window.location.search).get('post')
    const id = value ? Number(value) : NaN
    return Number.isInteger(id) && id > 0 ? id : null
  })

  const pageRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const selectedPostIdRef = useRef(selectedPostId)
  const navigationTargetRef = useRef(selectedPostId)
  const historyIndexRef = useRef(0)
  const historyBackPendingRef = useRef(false)
  const transitionIdRef = useRef(0)
  const activePageAnimationsRef = useRef<MotionHandle[]>([])


  function clearActivePageTransition() {
    activePageAnimationsRef.current.forEach(animation => animation.cancel())
    activePageAnimationsRef.current = []
    motionDirector.endRoute()

    pageRef.current?.classList.remove('is-route-transitioning')
    headerRef.current?.classList.remove('is-route-transitioning')

    if (pageRef.current) {
      pageRef.current.style.visibility = ''
      pageRef.current.style.pointerEvents = ''
      pageRef.current.style.opacity = ''
      pageRef.current.style.transform = ''
      pageRef.current.style.filter = ''
      pageRef.current.style.transformOrigin = ''
      pageRef.current.style.willChange = ''
    }
  }

  async function transitionToPost(
    nextPostId: number | null,
    direction: 'forward' | 'back',
    restoreScrollY = 0,
  ) {
    if (transitionLockRef.current) {
      queuedNavigationRef.current = {
        postId: nextPostId,
        direction,
        restoreScrollY,
      }
      navigationTargetRef.current = nextPostId
      return
    }

    if (nextPostId === navigationTargetRef.current) return

    transitionLockRef.current = true
    const transitionId = ++transitionIdRef.current
    navigationTargetRef.current = nextPostId
    const page = pageRef.current
    const reduceMotion = motionDirector.prefersReducedMotion()

    try {
      if (!page || typeof page.animate !== 'function' || reduceMotion) {
        flushSync(() => {
          selectedPostIdRef.current = nextPostId
          setSelectedPostId(nextPostId)
        })
        window.scrollTo(0, nextPostId === null ? restoreScrollY : 0)
        return
      }

      // Lock the motion runtime before touching the page. This cancels any
      // running control motion and prevents another channel from starting.
      motionDirector.beginRoute()
      page.classList.add('is-route-transitioning')
      headerRef.current?.classList.add('is-route-transitioning')
      page.style.pointerEvents = 'none'
      page.style.willChange = 'transform'

      // A cinematic page move: directional travel, restrained perspective,
      // shallow depth, and a focus pull. Exit and entrance remain strictly serial.
      const outgoingX = direction === 'forward'
        ? -MOTION.page.distance
        : MOTION.page.distance
      const incomingX = -outgoingX
      const outgoingRotation = direction === 'forward'
        ? -MOTION.page.rotation
        : MOTION.page.rotation
      const incomingRotation = -outgoingRotation
      const makeTravelPose = (x: number, rotation: number) =>
        'translate3d(' + x + 'px, ' + MOTION.page.lift + 'px, -' + MOTION.page.depth + 'px) ' +
        'rotateY(' + rotation + 'deg) scale(' + MOTION.page.scale + ')'
      const outgoingPose = makeTravelPose(outgoingX, outgoingRotation)
      const incomingPose = makeTravelPose(incomingX, incomingRotation)
      const softFocus = 'blur(' + MOTION.page.blur + 'px)'

      page.style.transformOrigin = 'center 48%'
      const outgoingMotion = motionDirector.play({
        channel: 'route',
        element: page,
        keyframes: [
          { transform: 'translate3d(0, 0, 0) rotateY(0deg) scale(1)', opacity: 1, filter: 'blur(0px)' },
          { transform: outgoingPose, opacity: 0, filter: softFocus },
        ],
        timing: MOTION.page.exit,
      })
      activePageAnimationsRef.current = [outgoingMotion]
      if (!(await outgoingMotion.finished)) throw new Error('Page exit motion was cancelled')
      if (transitionId !== transitionIdRef.current) return

      // Pin every animated property before canceling WAAPI, preventing a frame
      // jump while the old route is replaced in the hidden wrapper.
      page.style.transform = outgoingPose
      page.style.opacity = '0'
      page.style.filter = softFocus
      outgoingMotion.cancel()
      activePageAnimationsRef.current = []
      page.style.visibility = 'hidden'

      flushSync(() => {
        selectedPostIdRef.current = nextPostId
        setSelectedPostId(nextPostId)
      })
      window.scrollTo(0, nextPostId === null ? restoreScrollY : 0)

      // Prepare the incoming page at the opposite edge and at shallow depth.
      page.style.transform = incomingPose
      page.style.opacity = '0'
      page.style.filter = softFocus
      page.style.visibility = ''
      const incomingMotion = motionDirector.play({
        channel: 'route',
        element: page,
        keyframes: [
          { transform: incomingPose, opacity: 0, filter: softFocus },
          { transform: 'translate3d(0, 0, 0) rotateY(0deg) scale(1)', opacity: 1, filter: 'blur(0px)' },
        ],
        timing: MOTION.page.enter,
      })
      activePageAnimationsRef.current = [incomingMotion]
      if (!(await incomingMotion.finished)) throw new Error('Page entrance motion was cancelled')
      if (transitionId !== transitionIdRef.current) return

      // Remove the WAAPI effect only after the exact resting pose is pinned.
      page.style.transform = 'none'
      page.style.opacity = ''
      page.style.filter = ''
      incomingMotion.cancel()
      activePageAnimationsRef.current = []
    } catch {
      // Recover visibly and deterministically if an animation is interrupted.
      if (transitionId === transitionIdRef.current) {
        flushSync(() => {
          selectedPostIdRef.current = nextPostId
          navigationTargetRef.current = nextPostId
          setSelectedPostId(nextPostId)
        })
        window.scrollTo(0, nextPostId === null ? restoreScrollY : 0)
      }
    } finally {
      if (transitionId === transitionIdRef.current) {
        clearActivePageTransition()
        transitionLockRef.current = false

        const queued = queuedNavigationRef.current
        queuedNavigationRef.current = null
        if (queued && queued.postId !== selectedPostIdRef.current) {
          // The queue stores the newest target; reset the guard to the page
          // that is now rendered so the queued transition can actually start.
          navigationTargetRef.current = selectedPostIdRef.current
          void transitionToPost(queued.postId, queued.direction, queued.restoreScrollY)
        } else {
          navigationTargetRef.current = selectedPostIdRef.current
        }
      }
    }
  }

  function handleGlowPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return

    const target = event.target
    if (!(target instanceof Element)) return

    const control = target.closest<HTMLElement>('[data-glow="true"]')
    if (!control) return

    const bounds = control.getBoundingClientRect()
    control.style.setProperty('--glow-x', (event.clientX - bounds.left) + 'px')
    control.style.setProperty('--glow-y', (event.clientY - bounds.top) + 'px')
  }

  function handleAppClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return

    const target = event.target
    if (!(target instanceof Element)) return

    const link = target.closest<HTMLAnchorElement>('a[href]')
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return

    const destination = new URL(link.href, window.location.href)
    if (
      destination.origin !== window.location.origin ||
      destination.pathname !== window.location.pathname
    ) return

    const value = destination.searchParams.get('post')
    const id = value ? Number(value) : NaN
    const nextPostId = Number.isInteger(id) && id > 0 ? id : null

    // Do not mutate browser history while a page swap is in flight.
    // Popstate is queued separately, but in-app clicks are ignored until idle.
    if (transitionLockRef.current) {
      event.preventDefault()
      return
    }

    if (nextPostId === navigationTargetRef.current) {
      event.preventDefault()
      return
    }

    // The article's own Back link should use the real previous history entry,
    // so it gets the same reverse transition as the browser Back button.
    if (link.classList.contains('back-link') && nextPostId === null) {
      event.preventDefault()

      // Prevent a rapid double-click from traversing two history entries.
      if (historyBackPendingRef.current) return

      if (historyIndexRef.current > 0) {
        historyBackPendingRef.current = true
        window.history.back()
      } else {
        // A post opened from an external link has no in-app list entry behind
        // it. Replace the current URL instead of pushing another entry, so the
        // browser Back button does not reopen the same article.
        const currentState = window.history.state ?? {}
        window.history.replaceState(
          { ...currentState, __kaapHistoryIndex: historyIndexRef.current },
          '',
          destination.pathname + destination.search + destination.hash,
        )
        void transitionToPost(null, 'back', 0)
      }
      return
    }

    event.preventDefault()
    const currentState = window.history.state ?? {}
    window.history.replaceState(
      {
        ...currentState,
        __kaapHistoryIndex: historyIndexRef.current,
        __kaapScrollY: window.scrollY,
      },
      '',
      window.location.href,
    )

    const nextHistoryIndex = historyIndexRef.current + 1
    window.history.pushState(
      { ...currentState, __kaapHistoryIndex: nextHistoryIndex, __kaapScrollY: 0 },
      '',
      destination.pathname + destination.search + destination.hash,
    )
    historyIndexRef.current = nextHistoryIndex

    void transitionToPost(nextPostId, 'forward', 0)
  }

  const { theme, viewMode } = preferences

  const selectedPost = selectedPostId
    ? posts.find(post => post.id === selectedPostId)
    : undefined

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return posts

    return posts.filter(post =>
      [post.title, post.excerpt, post.category, post.date]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [searchQuery])

  useLayoutEffect(() => {
    const snapshot = layoutSnapshotRef.current
    if (!snapshot) return
    layoutSnapshotRef.current = null

    // Layout changes are intentionally not animated: animating every card
    // across a live grid causes card collisions and visible flashes. Keep the
    // first visible card pinned instead, so the viewport does not jump.
    if (snapshot.anchorPostId === null || snapshot.anchorTop === null) return

    const anchor = pageRef.current?.querySelector<HTMLElement>(
      '.posts .post-link[data-post-id="' + snapshot.anchorPostId + '"]',
    )
    const anchorBounds = anchor?.getBoundingClientRect()
    if (!anchorBounds) return

    const correctedScrollY = Math.max(
      0,
      snapshot.scrollY + anchorBounds.top - snapshot.anchorTop,
    )
    if (Math.abs(correctedScrollY - window.scrollY) > 1) {
      window.scrollTo(0, correctedScrollY)
    }
  }, [viewMode])

  useEffect(() => {
    if (previousViewModeRef.current === viewMode) return
    previousViewModeRef.current = viewMode
    const element = layoutIconRef.current
    if (!element) return
    const motion = motionDirector.play({
      channel: 'control', element,
      keyframes: [
        { opacity: .52, transform: 'translate3d(0, 2px, 0) rotate(-12deg) scale(.94)' },
        { opacity: 1, transform: 'translate3d(0, 0, 0) rotate(0) scale(1)' },
      ],
      timing: MOTION.control.icon,
    })
    return () => motion.cancel()
  }, [viewMode])

  useEffect(() => {
    if (previousThemeRef.current === preferences.theme) return
    previousThemeRef.current = preferences.theme
    const element = themeIconRef.current
    if (!element) return
    const rotation = preferences.theme === 'dark' ? -72 : 72
    const motion = motionDirector.play({
      channel: 'control', element,
      keyframes: [
        { opacity: .58, transform: 'rotate(' + rotation + 'deg) scale(.86)' },
        { opacity: 1, transform: 'rotate(0) scale(1)' },
      ],
      timing: MOTION.control.icon,
    })
    return () => motion.cancel()
  }, [preferences.theme])

  useEffect(() => {
    if (previousSearchOpenRef.current === searchOpen) return
    previousSearchOpenRef.current = searchOpen
    const element = searchIconRef.current
    if (!element) return
    const rotation = searchOpen ? 72 : -72
    const motion = motionDirector.play({
      channel: 'control', element,
      keyframes: [
        { opacity: .58, transform: 'rotate(' + rotation + 'deg) scale(.84)' },
        { opacity: 1, transform: 'rotate(0) scale(1)' },
      ],
      timing: MOTION.control.icon,
    })
    return () => motion.cancel()
  }, [searchOpen])

  useEffect(() => {
    // This app owns scroll restoration because each history entry stores its
    // own position. Native restoration can otherwise race the shared morph.
    const previousScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'

    // Store a monotonic index in each app-managed history entry so Back and
    // Forward can animate in opposite directions.
    const currentState = window.history.state ?? {}
    const currentIndex = Number.isInteger(currentState.__kaapHistoryIndex)
      ? currentState.__kaapHistoryIndex as number
      : 0

    historyIndexRef.current = currentIndex
    window.history.replaceState(
      { ...currentState, __kaapHistoryIndex: currentIndex, __kaapScrollY: window.scrollY },
      '',
      window.location.href,
    )

    const syncPost = (event: PopStateEvent) => {
      historyBackPendingRef.current = false
      const nextIndex = Number.isInteger(event.state?.__kaapHistoryIndex)
        ? event.state.__kaapHistoryIndex as number
        : historyIndexRef.current - 1
      const direction = nextIndex < historyIndexRef.current ? 'back' : 'forward'

      historyIndexRef.current = nextIndex
      const value = new URLSearchParams(window.location.search).get('post')
      const id = value ? Number(value) : NaN
      const restoreScrollY = Number.isFinite(event.state?.__kaapScrollY)
        ? Math.max(0, Number(event.state.__kaapScrollY))
        : 0
      void transitionToPost(Number.isInteger(id) && id > 0 ? id : null, direction, restoreScrollY)
    }

    window.addEventListener('popstate', syncPost)
    return () => {
      window.removeEventListener('popstate', syncPost)
      window.history.scrollRestoration = previousScrollRestoration
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (transitionLockRef.current) return

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
        return
      }

      if (event.key === 'Escape' && searchOpen) {
        closeSearch()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen])

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  function closeSearch() {
    setSearchOpen(false)
    setSearchQuery('')
    window.requestAnimationFrame(() => searchButtonRef.current?.focus())
  }

  function handleSearchToggle() {
    if (transitionLockRef.current) return
    if (searchOpen) {
      closeSearch()
      return
    }
    setSearchOpen(true)
  }

  function handleLayoutToggle() {
    if (transitionLockRef.current) return

    const links = Array.from(
      pageRef.current?.querySelectorAll<HTMLElement>('.posts .post-link[data-post-id]') ?? [],
    )
    let anchorPostId: string | null = null
    let anchorTop: number | null = null

    // Use the first visible article as a stable visual anchor.
    for (const link of links) {
      const id = link.dataset.postId
      if (!id) continue

      const bounds = link.getBoundingClientRect()
      if (bounds.bottom > 56 && bounds.top < window.innerHeight) {
        anchorPostId = id
        anchorTop = bounds.top
        break
      }
    }

    layoutSnapshotRef.current = {
      scrollY: window.scrollY,
      anchorPostId,
      anchorTop,
    }

    const index = VIEW_MODE_ORDER.indexOf(viewMode)
    const nextMode = VIEW_MODE_ORDER[(index + 1) % VIEW_MODE_ORDER.length]
    updatePreference('viewMode', nextMode)
  }
  function handleThemeToggle() {
    if (transitionLockRef.current) return
    updatePreference('theme', theme === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="app" onClick={handleAppClick} onPointerMove={handleGlowPointerMove}>
      <header ref={headerRef} className={'site-header' + (searchOpen ? ' has-search-open' : '')}>
        <div className="header-inner">
          <span className="brand soft-emboss soft-emboss--header">Dimple</span>

          <nav className="header-actions" aria-label="Site controls">
            {!selectedPost && (
            <button
              type="button"
              className="nav-button"
              data-glow="true"
              onClick={handleLayoutToggle}
              title={`Layout: ${VIEW_MODES[viewMode].label}`}
              aria-label={`Change layout. Current: ${VIEW_MODES[viewMode].label}`}
            >
              <span ref={layoutIconRef} key={viewMode} className="nav-icon-swap nav-icon-swap--layout-next" aria-hidden="true">
                {(() => {
                  const ViewIcon = VIEW_MODES[viewMode].icon
                  return <ViewIcon className="ui-icon" size={15} strokeWidth={2} />
                })()}
              </span>
            </button>

            )}

            <button
              type="button"
              className="nav-button"
              data-glow="true"
              onClick={handleThemeToggle}
              title={`Theme: ${theme === 'light' ? 'Light' : 'Dark'}`}
              aria-label={`Change theme. Current: ${theme === 'light' ? 'Light' : 'Dark'}`}
            >
              <span ref={themeIconRef} key={theme} className={'nav-icon-swap nav-icon-swap--theme-' + theme} aria-hidden="true">
                {theme === 'light' ? (
                  <Sun className="ui-icon" size={15} strokeWidth={2} />
                ) : (
                  <Moon className="ui-icon" size={15} strokeWidth={2} />
                )}
              </span>
            </button>

            <button
              ref={searchButtonRef}
              type="button"
              className={`nav-button search-toggle${searchOpen ? ' is-active' : ''}`}
              data-glow="true"
              onClick={handleSearchToggle}
              title={searchOpen ? 'Close search' : 'Search'}
              aria-label={searchOpen ? 'Close search' : 'Search'}
              aria-expanded={searchOpen}
              aria-controls="navbar-search"
            >
              <span ref={searchIconRef} key={searchOpen ? 'close' : 'search'} className={'nav-icon-swap nav-icon-swap--search-' + (searchOpen ? 'open' : 'closed')} aria-hidden="true">
                {searchOpen ? (
                  <X className="ui-icon" size={15} strokeWidth={2} />
                ) : (
                  <Search className="ui-icon" size={15} strokeWidth={2} />
                )}
              </span>
            </button>
          </nav>
        </div>

        <div
          id="navbar-search"
          className={'nav-panel nav-panel--search' + (searchOpen ? ' is-open' : '')}
          aria-hidden={!searchOpen}
        >
          <div className="nav-panel-inner">
            <div className="nav-search">
              <Search className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
              <input
                ref={searchInputRef}
                className="nav-search-input"
                type="search"
                value={searchQuery}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchQuery(event.target.value)}
                placeholder="Search posts by title, category, or date..."
                aria-label="Search posts"
                tabIndex={searchOpen ? 0 : -1}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="nav-search-clear"
                  data-glow="true"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  tabIndex={searchOpen ? 0 : -1}
                >
                  <X className="ui-icon" size={14} strokeWidth={2} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="page-stage">
        <div ref={pageRef} className="page-transition">
      {selectedPost ? (
        <PostPage post={selectedPost} />
      ) : (
        <main className="main-content">
          <section className="hero">
            <h1 className="hero-title soft-emboss soft-emboss--canvas" data-transition-item="hero-title">
              Writing about craft,<br />ideas, and the work.
            </h1>
            <p className="hero-copy" data-transition-item="hero-copy">
              Dimple is an independent blog about writing, thinking, and building things worth reading. Published weekly.
            </p>
            <code className="site-chip" data-transition-item="site-chip">dimple.blog</code>
          </section>

          <div className="posts-heading" data-transition-item="posts-heading">
            <h2 className="soft-emboss soft-emboss--canvas">Posts</h2>
            <span>
              {searchQuery
                ? `${filteredPosts.length} of ${posts.length} articles`
                : `${posts.length} articles`}
            </span>
          </div>

          <div className={VIEW_MODES[viewMode].containerClass}>
            {filteredPosts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                mode={viewMode}
                index={index}
                articleClassName={`post post-${viewMode}`}
              />
            ))}
          </div>

          {searchQuery && filteredPosts.length === 0 && (
            <div className="empty-search" data-transition-item="empty-search">
              <Search className="ui-icon" size={20} strokeWidth={2} aria-hidden="true" />
              <strong>No posts found</strong>
              <span>Try a different search.</span>
            </div>
          )}

          <section className="newsletter" data-transition-item="newsletter">
            <div className="newsletter-copy">
              <h3 className="soft-emboss soft-emboss--glass">Get it in your inbox</h3>
              <p>Email subscriptions are not connected yet. This section will be activated when a real mailing service is configured.</p>
            </div>
          </section>
        </main>
      )}
        </div>
      </div>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-copy">
            <span><strong>DIMPLE</strong> · Independent writing</span>
            <span>© 2026</span>
          </div>

          <nav className="footer-links" aria-label="External links">
            <a
              className="footer-icon-link" data-glow="true"
              href="https://dimple.blog"
              target="_blank"
              rel="noreferrer"
              title="Website"
              aria-label="Open website"
            >
              <Globe2 className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
            </a>

            <a
              className="footer-icon-link" data-glow="true"
              href="mailto:hello@dimple.blog"
              title="Mail"
              aria-label="Send email"
            >
              <Mail className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
            </a>

            <a
              className="footer-icon-link" data-glow="true"
              href="https://github.com/akcizur/kaap"
              target="_blank"
              rel="noreferrer"
              title="GitHub"
              aria-label="Open GitHub repository"
            >
              <svg className="ui-icon" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2.5a9.5 9.5 0 0 0-3 18.52c.47.09.64-.2.64-.45v-1.72c-2.62.57-3.18-1.26-3.18-1.26-.43-1.1-1.05-1.4-1.05-1.4-.86-.59.07-.58.07-.58.95.07 1.45.97 1.45.97.85 1.45 2.22 1.03 2.76.79.09-.61.33-1.03.6-1.27-2.09-.24-4.29-1.05-4.29-4.68 0-1.03.37-1.87.97-2.53.1-.24-.42-1.2.09-2.5 0 0 .79-.25 2.59.97A9 9 0 0 1 12 6.9c.8 0 1.6.11 2.35.33 1.8-1.22 2.59-.97 2.59-.97.51 1.3.19 2.26.09 2.5.6.66.97 1.5.97 2.53 0 3.64-2.2 4.44-4.3 4.67.34.3.64.88.64 1.78v2.64c0 .25.17.54.64.45A9.5 9.5 0 0 0 12 2.5Z" />
              </svg>
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
