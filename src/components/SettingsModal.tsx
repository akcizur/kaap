import { type MouseEvent } from 'react'
import { VIEW_MODES, type ViewMode } from '../config/viewModes'

type Theme = 'light' | 'dark'

type SettingsModalProps = {
  theme: Theme
  viewMode: ViewMode
  onThemeChange: (theme: Theme) => void
  onViewModeChange: (viewMode: ViewMode) => void
  onClose: () => void
}

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
            ✕
          </button>
        </div>

        <div className="settings-section">
          <div className="settings-label">View Mode</div>
          <div className="settings-grid settings-grid--modes">
            {(Object.keys(VIEW_MODES) as ViewMode[]).map(mode => (
              <button
                key={mode}
                className={`setting-button${viewMode === mode ? ' is-active' : ''}`}
                onClick={() => onViewModeChange(mode)}
                aria-pressed={viewMode === mode}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-label">Theme</div>
          <div className="settings-grid settings-grid--theme">
            {(['light', 'dark'] as Theme[]).map(option => (
              <button
                key={option}
                className={`setting-button${theme === option ? ' is-active' : ''}`}
                onClick={() => onThemeChange(option)}
                aria-pressed={theme === option}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <button className="done-button" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  )
}
