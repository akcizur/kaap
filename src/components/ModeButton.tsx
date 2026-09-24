import type { LucideIcon } from 'lucide-react'
import type { ViewMode } from '../config/viewModes'

type ModeButtonProps = {
  mode: ViewMode
  icon: LucideIcon
  label: string
  active: boolean
  onClick: () => void
}

export function ModeButton({
  mode,
  icon: Icon,
  label,
  active,
  onClick,
}: ModeButtonProps) {
  return (
    <button
      className={`mode-button${active ? ' is-active' : ''}`}
      data-mode={mode}
      onClick={onClick}
      title={label}
      aria-label={`${label} view`}
      aria-pressed={active}
    >
      <Icon className="ui-icon" size={15} strokeWidth={2} aria-hidden="true" />
    </button>
  )
}
