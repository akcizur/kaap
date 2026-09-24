import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  Globe2,
  Languages,
  Mail,
  Moon,
  Search,
  Scaling,
  Sun,
  X,
} from 'lucide-react'
import { ModeButton } from './components/ModeButton'
import { PostPage } from './components/PostPage'
import { PostCard } from './components/PostCard'
import { posts } from './data/posts'
import {
  VIEW_MODES,
  VIEW_MODE_ORDER,
  type ViewMode,
} from './config/viewModes'
import { usePreferences } from './hooks/usePreferences'

type Language = 'EN' | 'CZ'
type Scale = 90 | 100 | 110

const SCALE_ORDER: Scale[] = [90, 100, 110]

function GithubMark({ size = 15 }: { size?: number }) {
  return (
    <svg className="ui-icon" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5a9.5 9.5 0 0 0-3 18.52c.47.09.64-.2.64-.45v-1.72c-2.62.57-3.18-1.26-3.18-1.26-.43-1.1-1.05-1.4-1.05-1.4-.86-.59.07-.58.07-.58.95.07 1.45.97 1.45.97.85 1.45 2.22 1.03 2.76.79.09-.61.33-1.03.6-1.27-2.09-.24-4.29-1.05-4.29-4.68 0-1.03.37-1.87.97-2.53-.1-.24-.42-1.2.09-2.5 0 0 .79-.25 2.59.97A9 9 0 0 1 12 6.9c.8 0 1.6.11 2.35.33 1.8-1.22 2.59-.97 2.59-.97.51 1.3.19 2.26.09 2.5.6.66.97 1.5.97 2.53 0 3.64-2.2 4.44-4.3 4.67.34.3.64.88.64 1.78v2.64c0 .25.17.54.64.45A9.5 9.5 0 0 0 12 2.5Z" />
    </svg>
  )
}

export default function App() {
  const { preferences, updatePreference } = usePreferences()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [language, setLanguage] = useState<Language>('EN')
  const [scale, setScale] = useState<Scale>(100)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPostId, setSelectedPostId] = useState<number | null>(() => {
    const value = new URLSearchParams(window.location.search).get('post')
    const id = value ? Number(value) : NaN
    return Number.isInteger(id) && id > 0 ? id : null
  })

  const { theme, viewMode } = preferences
  const isDark = theme === 'dark'
  const currentMode = VIEW_MODES[viewMode]
  const ThemeIcon = isDark ? Sun : Moon

  const currentViewIndex = VIEW_MODE_ORDER.indexOf(viewMode)
  const nextViewMode =
    VIEW_MODE_ORDER[(currentViewIndex + 1) % VIEW_MODE_ORDER.length]

  const nextScale =
    SCALE_ORDER[(SCALE_ORDER.indexOf(scale) + 1) % SCALE_ORDER.length]

  const selectedPost = selectedPostId ? posts.find(post => post.id === selectedPostId) : undefined

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

  function handleViewModeChange() {
    updatePreference('viewMode', nextViewMode)
  }

  function handleScaleChange() {
    setScale(nextScale)
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

          <nav className="header-actions" aria-label="Site controls and links">
            <div className="nav-group nav-controls">
              <div className="view-switcher">
                <ModeButton
                  mode={viewMode}
                  icon={currentMode.icon}
                  currentLabel={currentMode.label}
                  nextLabel={VIEW_MODES[nextViewMode].label}
                  onClick={handleViewModeChange}
                />
              </div>

              <button
                className="nav-button"
                onClick={() => setLanguage(current => current === 'EN' ? 'CZ' : 'EN')}
                title={`Language: ${language}. Switch to ${language === 'EN' ? 'CZ' : 'EN'}`}
                aria-label={`Language: ${language}. Switch language`}
              >
                <Languages className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
                <span>{language}</span>
              </button>

              <button
                className="nav-button"
                onClick={() => updatePreference('theme', isDark ? 'light' : 'dark')}
                title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                <ThemeIcon className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
                <span>{isDark ? 'Light' : 'Dark'}</span>
              </button>

              <button
                className="nav-button"
                onClick={handleScaleChange}
                title={`UI scale: ${scale}%. Click for ${nextScale}%`}
                aria-label={`UI scale ${scale} percent. Click for ${nextScale} percent`}
              >
                <Scaling className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
                <span>{scale}%</span>
              </button>

              <button
                className={`nav-button search-toggle${searchOpen ? ' is-active' : ''}`}
                onClick={() => {
                  setSearchOpen(open => !open)
                  if (searchOpen) setSearchQuery('')
                }}
                title={searchOpen ? 'Close search' : 'Search'}
                aria-label={searchOpen ? 'Close search' : 'Search'}
                aria-expanded={searchOpen}
              >
                {searchOpen ? (
                  <X className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
                ) : (
                  <Search className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
                )}
                <span>{searchOpen ? 'Close' : 'Search'}</span>
              </button>
            </div>

            <div className="nav-group nav-links">
              <a
                className="nav-button nav-link"
                href="https://github.com/akcizur/kaap"
                target="_blank"
                rel="noreferrer"
                title="GitHub"
                aria-label="Open GitHub repository"
              >
                <GithubMark />
              </a>

              <a
                className="nav-button nav-link"
                href="https://dimple.blog"
                target="_blank"
                rel="noreferrer"
                title="Website"
                aria-label="Open website"
              >
                <Globe2 className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
              </a>

              <a
                className="nav-button nav-link"
                href="mailto:hello@dimple.blog"
                title="Mail"
                aria-label="Send email"
              >
                <Mail className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
              </a>
            </div>
          </nav>
        </div>

        {searchOpen && (
          <div className="search-row">
            <div className="search-field">
              <Search className="ui-icon" size={16} strokeWidth={2} aria-hidden="true" />
              <input
                className="search-input"
                type="search"
                value={searchQuery}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search posts..."
                aria-label="Search posts"
                autoFocus
              />
              {searchQuery && (
                <button
                  className="search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
                </button>
              )}
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

        <div className={currentMode.containerClass}>
          {filteredPosts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              mode={viewMode}
              index={index}
              articleClassName={currentMode.articleClassName}
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
                <button type="submit" className="subscribe-button">Subscribe</button>
              </form>
            </>
          )}
        </section>
      </main>
      )}

      <footer className="site-footer">
        <div className="footer-inner">
          <span><strong>DIMPLE</strong> · Independent writing</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  )
}
