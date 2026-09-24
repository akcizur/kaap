import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  Github,
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

export default function App() {
  const { preferences, updatePreference } = usePreferences()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [language, setLanguage] = useState<Language>('EN')
  const [scale, setScale] = useState<Scale>(100)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { theme, viewMode } = preferences
  const isDark = theme === 'dark'
  const currentMode = VIEW_MODES[viewMode]
  const ThemeIcon = isDark ? Sun : Moon

  const currentViewIndex = VIEW_MODE_ORDER.indexOf(viewMode)
  const nextViewMode =
    VIEW_MODE_ORDER[(currentViewIndex + 1) % VIEW_MODE_ORDER.length]

  const nextScale =
    SCALE_ORDER[(SCALE_ORDER.indexOf(scale) + 1) % SCALE_ORDER.length]

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

          <nav className="header-actions" aria-label="Primary">
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

            <a
              className="nav-button nav-link"
              href="https://github.com/akcizur/kaap"
              target="_blank"
              rel="noreferrer"
              title="GitHub"
              aria-label="Open GitHub repository"
            >
              <Github className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
              <span>GitHub</span>
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
              <span>Website</span>
            </a>

            <a
              className="nav-button nav-link"
              href="mailto:hello@dimple.blog"
              title="Mail"
              aria-label="Send email"
            >
              <Mail className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
              <span>Mail</span>
            </a>
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

      <footer className="site-footer">
        <div className="footer-inner">
          <span><strong>DIMPLE</strong> · Independent writing</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  )
}
