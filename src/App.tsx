import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
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
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const layoutSnapshotRef = useRef<Map<string, DOMRect> | null>(null)
  const sharedElementRef = useRef<HTMLElement | null>(null)
  const sharedTargetRef = useRef<HTMLElement | null>(null)
  const sharedTargetStyleRef = useRef<{ opacity: string; visibility: string } | null>(null)
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
  const historyBackPendingRef = useRef(false)
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

    if (sharedTargetRef.current && sharedTargetStyleRef.current) {
      sharedTargetRef.current.style.opacity = sharedTargetStyleRef.current.opacity
      sharedTargetRef.current.style.visibility = sharedTargetStyleRef.current.visibility
    }
    sharedTargetRef.current = null
    sharedTargetStyleRef.current = null
    sharedElementRef.current?.remove()
    sharedElementRef.current = null

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
    restoreScrollY = 0,
    sourceElement: HTMLElement | null = null,
  ) {
    if (nextPostId === navigationTargetRef.current) return

    const currentPostId = selectedPostIdRef.current
    const sharedSource = sourceElement ?? (
      direction === 'back' && currentPostId !== null
        ? pageRef.current?.querySelector<HTMLElement>('.post-detail') ?? null
        : null
    )
    const sourceBounds = sharedSource?.getBoundingClientRect()
    const transitionId = ++transitionIdRef.current

    navigationTargetRef.current = nextPostId
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
      await waitForPaint()
      window.scrollTo(0, nextPostId === null ? restoreScrollY : 0)
      return
    }

    page.style.pointerEvents = 'none'

    const previousPage = page.cloneNode(true) as HTMLDivElement
    previousPage.classList.add('page-transition__snapshot')
    previousPage.setAttribute('aria-hidden', 'true')
    previousPage.setAttribute('inert', '')
    previousPage.querySelectorAll('[id]').forEach(element => {
      element.removeAttribute('id')
    })
    previousPageLayer.replaceChildren(previousPage)

    // A fixed clone keeps the clicked card attached to the viewport while
    // the destination page and its scroll position are being prepared.
    let sharedElement: HTMLElement | null = null
    if (sharedSource && sourceBounds) {
      sharedElement = sharedSource.cloneNode(true) as HTMLElement
      sharedElement.classList.add('shared-element-transition')
      sharedElement.querySelectorAll('[id]').forEach(element => {
        element.removeAttribute('id')
      })
      Object.assign(sharedElement.style, {
        position: 'fixed',
        left: sourceBounds.left + 'px',
        top: sourceBounds.top + 'px',
        width: sourceBounds.width + 'px',
        height: sourceBounds.height + 'px',
        margin: '0',
        zIndex: '1000',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        opacity: '1',
      })
      document.body.appendChild(sharedElement)
      sharedElementRef.current = sharedElement
    }

    page.style.visibility = 'hidden'
    selectedPostIdRef.current = nextPostId
    setSelectedPostId(nextPostId)
    window.scrollTo(0, 0)

    await waitForPaint()
    if (transitionId !== transitionIdRef.current) return

    // Wait until the destination list has expanded the document before
    // restoring a deep scroll position. Otherwise the old article height can
    // clamp window.scrollY back to zero.
    if (nextPostId === null && restoreScrollY > 0) {
      window.scrollTo(0, restoreScrollY)
      await waitForPaint()
      if (transitionId !== transitionIdRef.current) return
    }

    page.style.visibility = ''

    const targetSelector = nextPostId !== null
      ? '.post-detail'
      : currentPostId !== null
        ? '[data-post-id="' + currentPostId + '"] .post'
        : null
    const sharedTarget = targetSelector
      ? page.querySelector<HTMLElement>(targetSelector)
      : null

    if (sharedElement && sharedTarget && sourceBounds) {
      const targetBounds = sharedTarget.getBoundingClientRect()
      const sourceRadius = getComputedStyle(sharedElement).borderRadius
      const targetRadius = getComputedStyle(sharedTarget).borderRadius

      sharedTargetStyleRef.current = {
        opacity: sharedTarget.style.opacity,
        visibility: sharedTarget.style.visibility,
      }
      sharedTargetRef.current = sharedTarget
      sharedTarget.style.visibility = 'visible'
      sharedTarget.style.opacity = '0'

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
        element.style.transform = 'translate3d(0, 9px, 0)'
      })

      const sharedAnimation = sharedElement.animate(
        [
          {
            left: sourceBounds.left + 'px',
            top: sourceBounds.top + 'px',
            width: sourceBounds.width + 'px',
            height: sourceBounds.height + 'px',
            borderRadius: sourceRadius,
            opacity: 1,
          },
          {
            left: targetBounds.left + 'px',
            top: targetBounds.top + 'px',
            width: targetBounds.width + 'px',
            height: targetBounds.height + 'px',
            borderRadius: targetRadius,
            opacity: .98,
            offset: .82,
          },
          {
            left: targetBounds.left + 'px',
            top: targetBounds.top + 'px',
            width: targetBounds.width + 'px',
            height: targetBounds.height + 'px',
            borderRadius: targetRadius,
            opacity: 0,
          },
        ],
        {
          duration: 560,
          easing: 'cubic-bezier(.2, .82, .2, 1)',
          fill: 'forwards',
        },
      )

      const outgoingAnimation = previousPage.animate(
        [{ opacity: 1 }, { opacity: .12 }],
        {
          duration: 470,
          easing: 'cubic-bezier(.2, .78, .2, 1)',
          fill: 'forwards',
        },
      )
      const incomingAnimation = page.animate(
        [
          { opacity: .92, transform: 'translate3d(0, 8px, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        ],
        {
          duration: 390,
          easing: 'cubic-bezier(.2, .82, .2, 1)',
          fill: 'both',
        },
      )
      const revealAnimation = sharedTarget.animate(
        [
          { opacity: 0, transform: 'translate3d(0, 7px, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        ],
        {
          duration: 210,
          delay: 390,
          easing: 'cubic-bezier(.16, 1, .3, 1)',
          fill: 'both',
        },
      )
      const itemAnimations = transitionItems.map((item, index) =>
        item.animate(
          [
            { opacity: 0, transform: 'translate3d(0, 9px, 0)' },
            { opacity: 1, transform: 'translate3d(0, 0, 0)' },
          ],
          {
            duration: 390,
            delay: 65 + Math.min(index, 8) * 24,
            easing: 'cubic-bezier(.2, .78, .2, 1)',
            fill: 'both',
          },
        ),
      )

      activePageAnimationsRef.current = [
        sharedAnimation,
        outgoingAnimation,
        incomingAnimation,
        revealAnimation,
        ...itemAnimations,
      ]

      await Promise.all(
        activePageAnimationsRef.current.map(animation =>
          animation.finished.catch(() => undefined),
        ),
      )

      if (transitionId !== transitionIdRef.current) return
      clearActivePageTransition()
      return
    }

    // Direct-entry navigation keeps the layered slide as a dependable fallback.
    sharedElement?.remove()
    sharedElementRef.current = null

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

    const pageTiming: KeyframeAnimationOptions = {
      duration: direction === 'back' ? 700 : 760,
      easing: 'cubic-bezier(.2, .82, .2, 1)',
      fill: 'both',
    }

    const outgoingAnimation = previousPage.animate(
      [
        { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
        { opacity: .94, transform: 'translate3d(' + outgoingX + ', 0, 0) scale(.99)' },
      ],
      pageTiming,
    )
    const incomingAnimation = page.animate(
      [
        { opacity: .985, transform: 'translate3d(' + incomingX + ', 0, 0) scale(.99)' },
        { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
      ],
      pageTiming,
    )
    const itemAnimations = transitionItems.map((item, index) =>
      item.animate(
        [
          { opacity: 0, transform: 'translate3d(0, 10px, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        ],
        {
          duration: item.classList.contains('back-link') ? 420 : 500,
          delay: item.classList.contains('back-link') ? 55 : 70 + Math.min(index, 8) * 34,
          easing: 'cubic-bezier(.2, .78, .2, 1)',
          fill: 'both',
        },
      ),
    )

    activePageAnimationsRef.current = [
      outgoingAnimation,
      incomingAnimation,
      ...itemAnimations,
    ]

    await Promise.all(
      activePageAnimationsRef.current.map(animation =>
        animation.finished.catch(() => undefined),
      ),
    )

    if (transitionId !== transitionIdRef.current) return
    clearActivePageTransition()
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
        void transitionToPost(null, 'back', 0, pageRef.current?.querySelector<HTMLElement>('.post-detail') ?? null)
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

    const sharedSource = link.classList.contains('post-link')
      ? link.querySelector<HTMLElement>('.post')
      : null
    void transitionToPost(nextPostId, 'forward', 0, sharedSource)
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
    const snapshots = layoutSnapshotRef.current
    if (!snapshots) return
    layoutSnapshotRef.current = null

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const links = Array.from(
      pageRef.current?.querySelectorAll<HTMLElement>('.posts .post-link[data-post-id]') ?? [],
    )

    links.forEach(link => {
      const id = link.dataset.postId
      const previous = id ? snapshots.get(id) : undefined
      if (!previous) return

      const next = link.getBoundingClientRect()
      const deltaX = previous.left - next.left
      const deltaY = previous.top - next.top
      const scaleX = Math.max(.55, Math.min(1.8, previous.width / Math.max(1, next.width)))
      const scaleY = Math.max(.55, Math.min(1.8, previous.height / Math.max(1, next.height)))

      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1 && Math.abs(scaleX - 1) < .02 && Math.abs(scaleY - 1) < .02) return

      link.style.willChange = 'transform'
      const animation = link.animate(
        [
          {
            transform: 'translate3d(' + deltaX + 'px, ' + deltaY + 'px, 0) scale(' + scaleX + ', ' + scaleY + ')',
            transformOrigin: 'top left',
          },
          {
            transform: 'translate3d(0, 0, 0) scale(1, 1)',
            transformOrigin: 'top left',
          },
        ],
        {
          duration: 480,
          easing: 'cubic-bezier(.2, .82, .2, 1)',
          fill: 'both',
        },
      )

      animation.finished
        .then(() => {
          animation.cancel()
          link.style.willChange = ''
        })
        .catch(() => {
          link.style.willChange = ''
        })
    })
  }, [viewMode])

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
    if (searchOpen) {
      closeSearch()
      return
    }
    setSearchOpen(true)
  }

  function handleLayoutToggle() {
    const snapshots = new Map<string, DOMRect>()
    const links = Array.from(
      pageRef.current?.querySelectorAll<HTMLElement>('.posts .post-link[data-post-id]') ?? [],
    )
    links.forEach(link => {
      const id = link.dataset.postId
      if (id) snapshots.set(id, link.getBoundingClientRect())
    })
    layoutSnapshotRef.current = snapshots

    const index = VIEW_MODE_ORDER.indexOf(viewMode)
    const nextMode = VIEW_MODE_ORDER[(index + 1) % VIEW_MODE_ORDER.length]
    updatePreference('viewMode', nextMode)
  }

  function handleThemeToggle() {
    updatePreference('theme', theme === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="app" onClick={handleAppClick} onPointerMove={handleGlowPointerMove}>
      <header className={'site-header' + (searchOpen ? ' has-search-open' : '')}>
        <div className="header-inner">
          <span className="brand soft-emboss soft-emboss--header">Dimple</span>

          <nav className="header-actions" aria-label="Site controls">
            <button
              type="button"
              className="nav-button"
              data-glow="true"
              onClick={handleLayoutToggle}
              title={`Layout: ${VIEW_MODES[viewMode].label}`}
              aria-label={`Change layout. Current: ${VIEW_MODES[viewMode].label}`}
            >
              <span key={viewMode} className="nav-icon-swap" aria-hidden="true">
                {(() => {
                  const ViewIcon = VIEW_MODES[viewMode].icon
                  return <ViewIcon className="ui-icon" size={15} strokeWidth={2} />
                })()}
              </span>
            </button>

            <button
              type="button"
              className="nav-button"
              data-glow="true"
              onClick={handleThemeToggle}
              title={`Theme: ${theme === 'light' ? 'Light' : 'Dark'}`}
              aria-label={`Change theme. Current: ${theme === 'light' ? 'Light' : 'Dark'}`}
            >
              <span key={theme} className="nav-icon-swap" aria-hidden="true">
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
              <span key={searchOpen ? 'close' : 'search'} className="nav-icon-swap" aria-hidden="true">
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
