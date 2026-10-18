import { Icon } from './Icon.jsx'

export function Header({ title, onBack }) {
  return (
    <header className="header">
      <div className="header-inner">
        {onBack ? (
          <button className="header-back" onClick={onBack}>
            <Icon name="back" size={20} />
            Back
          </button>
        ) : (
          <img className="header-logo" src="/logo.svg" alt="" />
        )}
        <span className="header-title">{title}</span>
        <span className="header-spacer" />
      </div>
    </header>
  )
}
