import { type MouseEvent } from 'react'
import { Check, Grid2X2, Languages, List, Moon, Newspaper, Rows3, Scaling, Sun, X } from 'lucide-react'
import { VIEW_MODES, type ViewMode } from '../config/viewModes'

type Theme = 'light' | 'dark'
type Language = 'EN' | 'CZ'
type Scale = 90 | 100 | 110

type SettingsModalProps = {
  theme: Theme
  viewMode: ViewMode
  language: Language
  scale: Scale
  onThemeChange: (theme: Theme) => void
  onViewModeChange: (viewMode: ViewMode) => void
  onLanguageChange: (language: Language) => void
  onScaleChange: (scale: Scale) => void
  onClose: () => void
}

const VIEW_ICONS = {
  list: List,
  grid: Grid2X2,
  magazine: Newspaper,
  compact: Rows3,
} satisfies Record<ViewMode, typeof List>

const LANGUAGES: Language[] = ['EN', 'CZ']
const SCALES: Scale[] = [90, 100, 110]

export function SettingsModal({
  theme,
  viewMode,
  language,
  scale,
  onThemeChange,
  onViewModeChange,
  onLanguageChange,
  onScaleChange,
  onClose,
}: SettingsModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        id="display-settings"
        className="settings-modal"
        onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="settings-header">
          <h3 id="settings-title">Display Settings</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close settings">
            <X className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="settings-section">
          <div className="settings-label">View Mode</div>
          <div className="settings-grid settings-grid--modes">
            {(Object.keys(VIEW_MODES) as ViewMode[]).map(mode => {
              const Icon = VIEW_ICONS[mode]
              return (
                <button
                  key={mode}
                  className={`setting-button${viewMode === mode ? ' is-active' : ''}`}
                  onClick={() => onViewModeChange(mode)}
                  aria-label={`${VIEW_MODES[mode].label} view`}
                  aria-pressed={viewMode === mode}
                >
                  <Icon className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
                  <span>{VIEW_MODES[mode].label}</span>
                  {viewMode === mode && <Check className="ui-icon setting-check" size={14} strokeWidth={2.2} aria-hidden="true" />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-label">Language</div>
          <div className="settings-grid settings-grid--theme">
            {LANGUAGES.map(option => (
              <button
                key={option}
                className={`setting-button${language === option ? ' is-active' : ''}`}
                onClick={() => onLanguageChange(option)}
                aria-pressed={language === option}
              >
                <Languages className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
                <span>{option}</span>
                {language === option && <Check className="ui-icon setting-check" size={14} strokeWidth={2.2} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-label">Theme</div>
          <div className="settings-grid settings-grid--theme">
            <button
              className={`setting-button${theme === 'light' ? ' is-active' : ''}`}
              onClick={() => onThemeChange('light')}
              aria-pressed={theme === 'light'}
            >
              <Sun className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
              <span>Light</span>
              {theme === 'light' && <Check className="ui-icon setting-check" size={14} strokeWidth={2.2} aria-hidden="true" />}
            </button>
            <button
              className={`setting-button${theme === 'dark' ? ' is-active' : ''}`}
              onClick={() => onThemeChange('dark')}
              aria-pressed={theme === 'dark'}
            >
              <Moon className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
              <span>Dark</span>
              {theme === 'dark' && <Check className="ui-icon setting-check" size={14} strokeWidth={2.2} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-label">UI Scale</div>
          <div className="settings-grid settings-grid--scale">
            {SCALES.map(option => (
              <button
                key={option}
                className={`setting-button${scale === option ? ' is-active' : ''}`}
                onClick={() => onScaleChange(option)}
                aria-pressed={scale === option}
              >
                <Scaling className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
                <span>{option}%</span>
                {scale === option && <Check className="ui-icon setting-check" size={14} strokeWidth={2.2} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-footer">
          <button className="done-button" onClick={onClose} title="Done" aria-label="Done">
            <Check className="ui-icon" size={15} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
