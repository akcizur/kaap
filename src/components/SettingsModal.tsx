import { type MouseEvent } from 'react'
import { Check, Grid2X2, List, Newspaper, Rows3, Sun, Moon, X } from 'lucide-react'
import { VIEW_MODES, type ViewMode } from '../config/viewModes'

type Theme = 'light' | 'dark'

type SettingsModalProps = {
  theme: Theme
  viewMode: ViewMode
  onThemeChange: (theme: Theme) => void
  onViewModeChange: (viewMode: ViewMode) => void
  onClose: () => void
}

const VIEW_ICONS = {
  list: List,
  grid: Grid2X2,
  magazine: Newspaper,
  compact: Rows3,
} satisfies Record<ViewMode, typeof List>

export function SettingsModal({
  theme,
  viewMode,
  onThemeChange,
  onViewModeChange,
  onClose,
}: SettingsModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
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
                </button>
              )
            })}
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

        <button className="done-button" onClick={onClose}>
          <span>Done</span>
          <Check className="ui-icon" size={15} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
