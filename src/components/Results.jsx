import { useState } from 'react'
import { formatDate, shareText } from '../lib/share.js'
import { formatMoney, ordinal, SCORING } from '../lib/sweep.js'
import { Icon } from './Icon.jsx'

// All the weeks, most recent first.
export function ResultsList({ season, go }) {
  const weeks = [...season.weeks].reverse()
  return (
    <main className="page">
      <h1 className="page-title">Results</h1>
      <ul className="list">
        {weeks.map((w) => {
          const winner = w.sweep.results[0]
          return (
            <li key={w.id}>
              <button className="list-row" onClick={() => go({ name: 'week', weekId: w.id })}>
                <div className="list-main">
                  <p className="list-title">{w.competition}</p>
                  <p className="list-sub">
                    Week {w.weekNumber} · {formatDate(w.date)} · {w.sweep.results.length} played
                  </p>
                </div>
                <div className="list-end">
                  <p className="list-title">{season.playerName(winner.playerId)}</p>
                  <p className="list-sub">{formatMoney(winner.winnings)}</p>
                </div>
                <Icon name="chevron" size={18} className="chevron" />
              </button>
            </li>
          )
        })}
      </ul>
    </main>
  )
}

// One week's results, with the pot, Magic Twos and a share button.
export function WeekResult({ season, weekId, playerId }) {
  const [toast, setToast] = useState(null)
  const week = season.weeks.find((w) => w.id === weekId)
  if (!week) {
    return (
      <main className="page">
        <div className="empty">
          <h2>That week couldn’t be found</h2>
          <p>Go back and choose another week.</p>
        </div>
      </main>
    )
  }

  const unit = week.scoring === SCORING.STABLEFORD ? 'Stableford' : 'Net strokes'

  async function share() {
    const text = shareText(week, season)
    try {
      if (navigator.share) await navigator.share({ text })
      else {
        await navigator.clipboard.writeText(text)
        setToast('Copied. Paste it into WhatsApp.')
        setTimeout(() => setToast(null), 2500)
      }
    } catch {
      // The person closed the share sheet; nothing to do.
    }
  }

  return (
    <main className="page">
      <div>
        <h1 className="page-title">{week.competition}</h1>
        <p className="muted">
          Week {week.weekNumber} · {formatDate(week.date)} · {unit}
        </p>
      </div>

      <div className="week-summary">
        <div className="stat">
          <p className="stat-label">Played</p>
          <p className="stat-value">{week.sweep.results.length}</p>
        </div>
        <div className="stat">
          <p className="stat-label">Pot</p>
          <p className="stat-value">{formatMoney(week.sweep.pot)}</p>
        </div>
        <div className="stat">
          <p className="stat-label">Twos · hole {week.twosHole}</p>
          <p className="stat-value">{formatMoney(week.twos.pot)}</p>
        </div>
      </div>

      <ol className="list">
        {week.sweep.results.map((r) => (
          <li
            key={r.playerId}
            className={`list-row ${r.winnings ? 'row-winner' : ''} ${r.playerId === playerId ? 'row-me' : ''}`}
          >
            <span className="pos">{r.position ? ordinal(r.position) : '–'}</span>
            <span className="list-main list-title">{season.playerName(r.playerId)}</span>
            {r.winnings > 0 && <span className="prize">{formatMoney(r.winnings)}</span>}
            <span className="list-end">{r.score}</span>
          </li>
        ))}
      </ol>

      <div className="card">
        <p className="list-title">Magic Twos · hole {week.twosHole}</p>
        <p className="list-sub">
          {week.twos.winnerIds.length
            ? `${week.twos.winnerIds.map(season.playerName).join(', ')} won ${formatMoney(week.twos.share)} each`
            : `No winner. ${formatMoney(week.twos.rollsOver)} rolls over.`}
        </p>
      </div>

      <button className="primary-button" onClick={share}>
        Share results
      </button>
      {toast && (
        <p className="toast" role="status">
          {toast}
        </p>
      )}
    </main>
  )
}
