import { FORMAT } from '../lib/tournament.js'

const shortDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

// The three days are spread across the season, each with its own format.
export default function DaySelector({ days, dayInfo, activeDay, onChange }) {
  return (
    <div className="day-selector" role="group" aria-label="Select day">
      {days.map((day) => (
        <button
          key={day}
          type="button"
          className={`day-button ${activeDay === day ? 'is-active' : ''}`}
          aria-pressed={activeDay === day}
          onClick={() => onChange(day)}
        >
          <span className="day-button-name">Day {day}</span>
          <span className="day-button-detail">{FORMAT[dayInfo[day].format].label}</span>
          <span className="day-button-detail">{shortDate(dayInfo[day].date)}</span>
        </button>
      ))}
    </div>
  )
}
