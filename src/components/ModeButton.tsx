import type { ViewMode } from '../config/viewModes'

type ModeButtonProps = {
  mode: ViewMode
  icon: string
  label: string
  active: boolean
  onClick: () => void
}

export function ModeButton({ mode, icon, label, active, onClick }: ModeButtonProps) {
  return (
    <button
      className={\`mode-button\${active ? ' is-active' : ''}\`}
      data-mode={mode}
      onClick={onClick}
      title={label}
      aria-label={\`\${label} view\`}
      aria-pressed={active}
    >
      {icon}
    </button>
  )
}
