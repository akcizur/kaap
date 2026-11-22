import { useEffect, useState } from 'react'
import { VIEW_MODES, type ViewMode } from '../config/viewModes'

export type Theme = 'light' | 'dark'

export type Preferences = {
  theme: Theme
  viewMode: ViewMode
}

const STORAGE_KEYS = {
  theme: 'dimple-theme',
  viewMode: 'dimple-view',
} as const

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme

  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (themeColor) {
    themeColor.content = theme === 'dark' ? '#0a0a0a' : '#ffffff'
  }
}

function getInitialPreferences(): Preferences {
  if (typeof window === 'undefined') {
    return { theme: 'light', viewMode: 'list' }
  }

  let savedTheme: string | null = null
  let savedViewMode: string | null = null

  try {
    savedTheme = window.localStorage.getItem(STORAGE_KEYS.theme)
    savedViewMode = window.localStorage.getItem(STORAGE_KEYS.viewMode)
  } catch {
    // Preferences remain usable for this session when storage is unavailable.
  }

  const theme: Theme =
    savedTheme === 'dark' || savedTheme === 'light'
      ? savedTheme
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'

  const viewMode: ViewMode =
    savedViewMode && savedViewMode in VIEW_MODES
      ? savedViewMode as ViewMode
      : 'list'

  applyTheme(theme)
  return { theme, viewMode }
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(getInitialPreferences)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.theme, preferences.theme)
      localStorage.setItem(STORAGE_KEYS.viewMode, preferences.viewMode)
    } catch {
      // Keep the in-memory preferences when storage is unavailable.
    }
  }, [preferences])

  function updatePreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    // Update the document before React paints the next frame, avoiding a light
    // document background beneath the dark application during the transition.
    if (key === 'theme') applyTheme(value as Theme)
    setPreferences(current => ({ ...current, [key]: value }))
  }

  return { preferences, updatePreference }
}
