import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  Globe2,
  Mail,
  Moon,
  Search,
  Settings2,
  Sun,
  X,
} from 'lucide-react'
import { PostPage } from './components/PostPage'
import { PostCard } from './components/PostCard'
import { posts } from './data/posts'
import { VIEW_MODE_ORDER, VIEW_MODES } from './config/viewModes'
import { usePreferences } from './hooks/usePreferences'

type Language = 'EN' | 'CZ'
type Scale = 90 | 100 | 110

export default function App() {
  const { preferences, updatePreference } = usePreferences()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [language, setLanguage] = useState<Language>('EN')
  const [scale, setScale] = useState<Scale>(100)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [selectedPostId, setSelectedPostId] = useState<number | null>(() => {
    const value = new URLSearchParams(window.location.search).get('post')
    const id = value ? Number(value) : NaN
    return Number.isInteger(id) && id > 0 ? id : null
  })

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
    document.documentElement.lang = language.toLowerCase()
    const syncPost = () => {
      const value = new URLSearchParams(window.location.search).get('post')
      const id = value ? Number(value) : NaN
      setSelectedPostId(Number.isInteger(id) && id > 0 ? id : null)
    }
    window.addEventListener('popstate', syncPost)
    return () => window.removeEventListener('popstate', syncPost)
  }, [language])

  useEffect(() => {
    if (!settingsOpen && !searchOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSettingsOpen(false)
        setSearchOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [settingsOpen, searchOpen])

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  function handleSearchToggle() {
    setSettingsOpen(false)
    setSearchOpen(open => {
      if (open) setSearchQuery('')
      return !open
    })
  }

  function handleSettingsToggle() {
    setSearchOpen(false)
    setSettingsOpen(open => !open)
  }

  function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (email.trim()) setSubscribed(true)
  }

  return (
    <div className={`app scale-${scale}`} data-theme={theme}>
      <header className="site-header">
        <div className="header-inner">
          <span className="brand">Dimple</span>

          <nav className="header-actions" aria-label="Site controls">
            <button
              className={`nav-button${settingsOpen ? ' is-active' : ''}`}
              onClick={handleSettingsToggle}
              title="Settings"
              aria-label="Display settings"
              aria-expanded={settingsOpen}
              aria-controls="navbar-settings"
            >
              <Settings2 className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
            </button>

            <button
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

        {settingsOpen && (
          <div id="navbar-settings" className="nav-panel nav-panel--settings">
            <div className="nav-panel-inner">
              <div className="nav-setting-row">
                <span className="nav-setting-label">View</span>
                <div className="nav-setting-options" role="group" aria-label="View mode">
                  {VIEW_MODE_ORDER.map(mode => {
                    const ModeIcon = VIEW_MODES[mode].icon

                    return (
                      <button
                        key={mode}
                        type="button"
                        className={`nav-setting-option${viewMode === mode ? ' is-active' : ''}`}
                        onClick={() => updatePreference('viewMode', mode)}
                        title={VIEW_MODES[mode].label}
                        aria-label={`View: ${VIEW_MODES[mode].label}`}
                        aria-pressed={viewMode === mode}
                      >
                        <ModeIcon className="ui-icon" size={14} strokeWidth={2} aria-hidden="true" />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="nav-setting-row">
                <span className="nav-setting-label">Theme</span>
                <div className="nav-setting-options" role="group" aria-label="Theme">
                  {(['light', 'dark'] as const).map(option => (
                    <button
                      key={option}
                      type="button"
                      className={`nav-setting-option${theme === option ? ' is-active' : ''}`}
                      onClick={() => updatePreference('theme', option)}
                      title={option === 'light' ? 'Light' : 'Dark'}
                      aria-label={`Theme: ${option === 'light' ? 'Light' : 'Dark'}`}
                      aria-pressed={theme === option}
                    >
                      {option === 'light' ? (
                        <Sun className="ui-icon" size={14} strokeWidth={2} aria-hidden="true" />
                      ) : (
                        <Moon className="ui-icon" size={14} strokeWidth={2} aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="nav-setting-row">
                <span className="nav-setting-label">Language</span>
                <div className="nav-setting-options" role="group" aria-label="Language">
                  {(['EN', 'CZ'] as const).map(option => (
                    <button
                      key={option}
                      type="button"
                      className={`nav-setting-option${language === option ? ' is-active' : ''}`}
                      onClick={() => setLanguage(option)}
                      title={`Language: ${option}`}
                      aria-label={`Language: ${option}`}
                      aria-pressed={language === option}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="nav-setting-row">
                <span className="nav-setting-label">Scale</span>
                <div className="nav-setting-options" role="group" aria-label="UI scale">
                  {([90, 100, 110] as const).map(option => (
                    <button
                      key={option}
                      type="button"
                      className={`nav-setting-option${scale === option ? ' is-active' : ''}`}
                      onClick={() => setScale(option)}
                      title={`UI scale: ${option}%`}
                      aria-label={`UI scale: ${option}%`}
                      aria-pressed={scale === option}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {selectedPost ? (
        <PostPage post={selectedPost} />
      ) : (
        <main className="main-content">
          <section className="hero">
            <h1 className="hero-title">
              Writing about craft,<br />ideas, and the work.
            </h1>
            <p className="hero-copy">
              Dimple is an independent blog about writing, thinking, and building things worth reading. Published weekly.
            </p>
            <code className="site-chip">dimple.blog</code>
          </section>

          <div className="posts-heading">
            <h2>Posts</h2>
            <span>
              {searchQuery
                ? `${filteredPosts.length} of ${posts.length} articles`
                : `${posts.length} articles`}
            </span>
          </div>

          <div className="posts posts-list">
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
            <div className="empty-search">
              <Search className="ui-icon" size={20} strokeWidth={2} aria-hidden="true" />
              <strong>No posts found</strong>
              <span>Try a different search.</span>
            </div>
          )}

          <section className="newsletter">
            {subscribed ? (
              <div className="subscription-success">
                <div className="success-icon">✓</div>
                <div className="success-title">You're subscribed.</div>
                <p>First issue lands next Thursday.</p>
              </div>
            ) : (
              <>
                <div className="newsletter-copy">
                  <h3>Get it in your inbox</h3>
                  <p>One email per week. No noise, no sponsors, no paywalls.</p>
                </div>
                <form onSubmit={handleSubscribe} className="subscribe-form">
                  <input
                    className="email-input"
                    type="email"
                    value={email}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
                    placeholder="your@email.com"
                    required
                    aria-label="Email address"
                  />
                  <button type="submit" className="subscribe-button" title="Subscribe" aria-label="Subscribe">
                    <Mail className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
                  </button>
                </form>
              </>
            )}
          </section>
        </main>
      )}

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
