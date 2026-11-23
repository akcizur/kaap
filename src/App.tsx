import { useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent as ReactMouseEvent } from 'react'
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

export default function App() {
  const { preferences, updatePreference } = usePreferences()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [selectedPostId, setSelectedPostId] = useState<number | null>(() => {
    const value = new URLSearchParams(window.location.search).get('post')
    const id = value ? Number(value) : NaN
    return Number.isInteger(id) && id > 0 ? id : null
  })

  const pageRef = useRef<HTMLDivElement>(null)
  const previousPageLayerRef = useRef<HTMLDivElement>(null)
  const selectedPostIdRef = useRef(selectedPostId)
  const navigationTargetRef = useRef(selectedPostId)
  const historyIndexRef = useRef(0)
  const transitionIdRef = useRef(0)
  const activePageAnimationsRef = useRef<Animation[]>([])
  const transitionItemStylesRef = useRef<Array<{
    element: HTMLElement
    opacity: string
    transform: string
  }>>([])

  function restoreTransitionItemStyles() {
    transitionItemStylesRef.current.forEach(({ element, opacity, transform }) => {
      element.style.opacity = opacity
      element.style.transform = transform
    })
    transitionItemStylesRef.current = []
  }

  function clearActivePageTransition() {
    activePageAnimationsRef.current.forEach(animation => animation.cancel())
    activePageAnimationsRef.current = []
    restoreTransitionItemStyles()
    previousPageLayerRef.current?.replaceChildren()

    if (pageRef.current) {
      pageRef.current.style.visibility = ''
      pageRef.current.style.pointerEvents = ''
    }
  }

  function waitForPaint() {
    return new Promise<void>(resolve => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => resolve())
      })
    })
  }

  async function transitionToPost(
    nextPostId: number | null,
    direction: 'forward' | 'back',
  ) {
    if (nextPostId === navigationTargetRef.current) return

    navigationTargetRef.current = nextPostId
    const transitionId = ++transitionIdRef.current

    // Cancel any in-flight transition and restore the currently rendered page
    // before taking its snapshot. This keeps rapid navigation deterministic.
    clearActivePageTransition()

    const page = pageRef.current
    const previousPageLayer = previousPageLayerRef.current
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (
      !page ||
      !previousPageLayer ||
      typeof page.animate !== 'function' ||
      reduceMotion
    ) {
      selectedPostIdRef.current = nextPostId
      setSelectedPostId(nextPostId)
      window.scrollTo(0, 0)
      return
    }

    // Capture the outgoing page, then render the destination underneath it.
    // Both layers can now move on the same frame instead of waiting for OUT
    // to finish before IN starts (the previous implementation introduced a
    // visible pause here).
    page.style.pointerEvents = 'none'
    page.style.visibility = 'hidden'

    const previousPage = page.cloneNode(true) as HTMLDivElement
    previousPage.classList.add('page-transition__snapshot')
    previousPage.setAttribute('aria-hidden', 'true')
    previousPage.setAttribute('inert', '')
    previousPage.querySelectorAll('[id]').forEach(element => {
      element.removeAttribute('id')
    })
    previousPageLayer.replaceChildren(previousPage)

    selectedPostIdRef.current = nextPostId
    setSelectedPostId(nextPostId)
    window.scrollTo(0, 0)

    await waitForPaint()
    if (transitionId !== transitionIdRef.current) return

    // Start each component from a clean, invisible baseline. The page itself
    // still enters as a single continuous surface, while content reveals in
    // a restrained sequence over the shared page movement.
    const transitionItems = Array.from(
      page.querySelectorAll<HTMLElement>('[data-transition-item]'),
    )
    transitionItemStylesRef.current = transitionItems.map(element => ({
      element,
      opacity: element.style.opacity,
      transform: element.style.transform,
    }))
    transitionItems.forEach(element => {
      element.style.opacity = '0'
      element.style.transform = 'translate3d(0, 14px, 0)'
    })

    const outgoingX = direction === 'back'
      ? 'calc(100% - 32px)'
      : 'calc(-100% + 32px)'
    const incomingX = direction === 'back' ? '-100%' : '100%'

    // Reveal the incoming page only after its first-frame styles are ready.
    page.style.visibility = ''

    const pageTiming: KeyframeAnimationOptions = {
      duration: 880,
      easing: 'cubic-bezier(.22, .72, .18, 1)',
      fill: 'both',
    }

    // OUT + IN run concurrently with identical timing/easing. The outgoing
    // page stays above the incoming one, naturally exposing the new page as
    // it glides in and leaving a narrow 32px edge until the reveal settles.
    const outgoingAnimation = previousPage.animate(
      [
        { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
        { opacity: .94, transform: `translate3d(${outgoingX}, 0, 0) scale(.99)` },
      ],
      pageTiming,
    )
    const incomingAnimation = page.animate(
      [
        { opacity: .985, transform: `translate3d(${incomingX}, 0, 0) scale(.99)` },
        { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
      ],
      pageTiming,
    )

    // Cap the stagger so very long lists do not leave the last cards waiting
    // several seconds. The first items remain clearly sequenced.
    const itemAnimations = transitionItems.map((item, index) =>
      item.animate(
        [
          { opacity: 0, transform: 'translate3d(0, 14px, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        ],
        {
          duration: 580,
          delay: 100 + Math.min(index, 12) * 48,
          easing: 'cubic-bezier(.2, .72, .25, 1)',
          fill: 'both',
        },
      ),
    )

    activePageAnimationsRef.current = [
      outgoingAnimation,
      incomingAnimation,
      ...itemAnimations,
    ]

    // A canceled animation rejects its finished promise. Convert that into a
    // settled result; the transition id below decides which navigation wins.
    await Promise.all(
      activePageAnimationsRef.current.map(animation =>
        animation.finished.catch(() => undefined),
      ),
    )

    if (transitionId !== transitionIdRef.current) return

    // Keep the previous page's narrow edge visible until the new components
    // have arrived, then remove it with a short, quiet fade.
    const edgeFadeAnimation = previousPage.animate(
      [{ opacity: .94 }, { opacity: 0 }],
      {
        duration: 240,
        easing: 'ease-out',
        fill: 'forwards',
      },
    )
    activePageAnimationsRef.current = [edgeFadeAnimation]

    try {
      await edgeFadeAnimation.finished
    } catch {
      // A newer navigation can replace the transition.
    }

    if (transitionId !== transitionIdRef.current) return

    clearActivePageTransition()
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

    if (nextPostId === navigationTargetRef.current) {
      event.preventDefault()
      return
    }

    // The article's own Back link should use the real previous history entry,
    // so it gets the same reverse transition as the browser Back button.
    if (link.classList.contains('back-link') && nextPostId === null) {
      event.preventDefault()

      if (historyIndexRef.current > 0) {
        window.history.back()
      } else {
        const nextHistoryIndex = historyIndexRef.current + 1
        window.history.pushState(
          { ...window.history.state, __kaapHistoryIndex: nextHistoryIndex },
          '',
          destination.pathname + destination.search + destination.hash,
        )
        historyIndexRef.current = nextHistoryIndex
        void transitionToPost(null, 'back')
      }
      return
    }

    event.preventDefault()
    const nextHistoryIndex = historyIndexRef.current + 1
    window.history.pushState(
      { ...window.history.state, __kaapHistoryIndex: nextHistoryIndex },
      '',
      destination.pathname + destination.search + destination.hash,
    )
    historyIndexRef.current = nextHistoryIndex
    void transitionToPost(nextPostId, 'forward')
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

  useEffect(() => {
    // Store a monotonic index in each app-managed history entry so Back and
    // Forward can animate in opposite directions.
    const currentState = window.history.state ?? {}
    const currentIndex = Number.isInteger(currentState.__kaapHistoryIndex)
      ? currentState.__kaapHistoryIndex as number
      : 0

    historyIndexRef.current = currentIndex
    window.history.replaceState(
      { ...currentState, __kaapHistoryIndex: currentIndex },
      '',
      window.location.href,
    )

    const syncPost = (event: PopStateEvent) => {
      const nextIndex = Number.isInteger(event.state?.__kaapHistoryIndex)
        ? event.state.__kaapHistoryIndex as number
        : historyIndexRef.current - 1
      const direction = nextIndex < historyIndexRef.current ? 'back' : 'forward'

      historyIndexRef.current = nextIndex
      const value = new URLSearchParams(window.location.search).get('post')
      const id = value ? Number(value) : NaN
      void transitionToPost(Number.isInteger(id) && id > 0 ? id : null, direction)
    }

    window.addEventListener('popstate', syncPost)
    return () => window.removeEventListener('popstate', syncPost)
  }, [])

  useEffect(() => {
    if (!searchOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen])

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  function handleSearchToggle() {
    setSearchOpen(open => {
      if (open) setSearchQuery('')
      return !open
    })
  }

  function handleLayoutToggle() {
    const index = VIEW_MODE_ORDER.indexOf(viewMode)
    const nextMode = VIEW_MODE_ORDER[(index + 1) % VIEW_MODE_ORDER.length]
    updatePreference('viewMode', nextMode)
  }

  function handleThemeToggle() {
    updatePreference('theme', theme === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="app" onClick={handleAppClick}>
      <header className="site-header">
        <div className="header-inner">
          <span className="brand">Dimple</span>

          <nav className="header-actions" aria-label="Site controls">
            <button
              type="button"
              className="nav-button"
              onClick={handleLayoutToggle}
              title={`Layout: ${VIEW_MODES[viewMode].label}`}
              aria-label={`Change layout. Current: ${VIEW_MODES[viewMode].label}`}
            >
              {(() => {
                const ViewIcon = VIEW_MODES[viewMode].icon
                return <ViewIcon className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
              })()}
            </button>

            <button
              type="button"
              className="nav-button"
              onClick={handleThemeToggle}
              title={`Theme: ${theme === 'light' ? 'Light' : 'Dark'}`}
              aria-label={`Change theme. Current: ${theme === 'light' ? 'Light' : 'Dark'}`}
            >
              {theme === 'light' ? (
                <Sun className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
              ) : (
                <Moon className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              className={`nav-button search-toggle${searchOpen ? ' is-active' : ''}`}
              onClick={handleSearchToggle}
              title={searchOpen ? 'Close search' : 'Search'}
              aria-label={searchOpen ? 'Close search' : 'Search'}
              aria-expanded={searchOpen}
              aria-controls="navbar-search"
            >
              {searchOpen ? (
                <X className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
              ) : (
                <Search className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
              )}
            </button>
          </nav>
        </div>

        {searchOpen && (
          <div id="navbar-search" className="nav-panel nav-panel--search">
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
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="nav-search-clear"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    <X className="ui-icon" size={14} strokeWidth={2} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="page-stage">
        <div
          ref={previousPageLayerRef}
          className="page-previous-layer"
          aria-hidden="true"
        />
        <div ref={pageRef} className="page-transition">
      {selectedPost ? (
        <PostPage post={selectedPost} />
      ) : (
        <main className="main-content">
          <section className="hero">
            <h1 className="hero-title" data-transition-item="hero-title">
              Writing about craft,<br />ideas, and the work.
            </h1>
            <p className="hero-copy" data-transition-item="hero-copy">
              Dimple is an independent blog about writing, thinking, and building things worth reading. Published weekly.
            </p>
            <code className="site-chip" data-transition-item="site-chip">dimple.blog</code>
          </section>

          <div className="posts-heading" data-transition-item="posts-heading">
            <h2>Posts</h2>
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
              <h3>Get it in your inbox</h3>
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
              className="footer-icon-link"
              href="https://dimple.blog"
              target="_blank"
              rel="noreferrer"
              title="Website"
              aria-label="Open website"
            >
              <Globe2 className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
            </a>

            <a
              className="footer-icon-link"
              href="mailto:hello@dimple.blog"
              title="Mail"
              aria-label="Send email"
            >
              <Mail className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
            </a>

            <a
              className="footer-icon-link"
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
