import { useState, type ChangeEvent, type FormEvent } from 'react'
import { ModeButton } from './components/ModeButton'
import { PostCard } from './components/PostCard'
import { SettingsModal } from './components/SettingsModal'
import { posts } from './data/posts'
import { VIEW_MODES, type ViewMode } from './config/viewModes'
import { usePreferences } from './hooks/usePreferences'

export default function App() {
  const { preferences, updatePreference } = usePreferences()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const { theme, viewMode } = preferences
  const isDark = theme === 'dark'
  const currentMode = VIEW_MODES[viewMode]

  function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (email.trim()) setSubscribed(true)
  }

  return (
    <div className="app" data-theme={theme}>
      <header className="site-header">
        <div className="header-inner">
          <span className="brand">Dimple</span>

          <div className="header-actions">
            <div className="view-switcher" role="group" aria-label="View mode">
              {(Object.keys(VIEW_MODES) as ViewMode[]).map(mode => (
                <ModeButton
                  key={mode}
                  mode={mode}
                  icon={VIEW_MODES[mode].icon}
                  label={VIEW_MODES[mode].label}
                  active={viewMode === mode}
                  onClick={() => updatePreference('viewMode', mode)}
                />
              ))}
            </div>

            <button
              className="icon-button"
              onClick={() => setSettingsOpen(true)}
              title="Settings"
              aria-label="Open settings"
            >
              ⚙
            </button>

            <button
              className="icon-button"
              onClick={() => updatePreference('theme', isDark ? 'light' : 'dark')}
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {isDark ? '☀' : '☾'}
            </button>
          </div>
        </div>
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
          <span>{posts.length} articles</span>
        </div>

        <div className={currentMode.containerClass}>
          {posts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              mode={viewMode}
              index={index}
              articleClassName={currentMode.articleClassName}
            />
          ))}
        </div>

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

      {settingsOpen && (
        <SettingsModal
          theme={theme}
          viewMode={viewMode}
          onThemeChange={nextTheme => updatePreference('theme', nextTheme)}
          onViewModeChange={nextMode => updatePreference('viewMode', nextMode)}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
