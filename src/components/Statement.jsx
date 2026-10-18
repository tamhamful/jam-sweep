import { useState } from 'react'
import { formatDate } from '../lib/share.js'
import { formatMoney, LEDGER_LABEL, LEDGER_TYPE, ordinal, WINNING_TYPES } from '../lib/sweep.js'
import { Icon } from './Icon.jsx'

// What a ledger row is called, and where / when it came from.
function describeRow(row) {
  const w = row.week
  switch (row.type) {
    case LEDGER_TYPE.SWEEP_ENTRY:
      return { title: 'Sweep entry', detail: w.competition }
    case LEDGER_TYPE.TWOS_ENTRY:
      return { title: 'Magic Twos entry', detail: `Week ${w.weekNumber} · hole ${w.twosHole}` }
    case LEDGER_TYPE.SWEEP_WIN:
      return { title: `Sweep · ${ordinal(row.position)} place`, detail: w.competition }
    case LEDGER_TYPE.TWOS_WIN:
      return {
        title: 'Magic Twos',
        detail: `A two on hole ${w.twosHole} · ${w.competition}${w.twos.winnerIds.length > 1 ? ` (shared ${w.twos.winnerIds.length} ways)` : ''}`,
      }
    case LEDGER_TYPE.MATCHPLAY_WIN:
      return { title: 'Match play', detail: row.note }
    case LEDGER_TYPE.RYDER_WIN:
      return { title: 'Ryder Cup', detail: `Winning team: ${row.note}` }
    case LEDGER_TYPE.DEPOSIT:
      return { title: 'Paid in', detail: 'Recorded by the money admin' }
    case LEDGER_TYPE.WITHDRAWAL:
      return { title: 'Paid out', detail: 'Recorded by the money admin' }
    default:
      return { title: LEDGER_LABEL[row.type], detail: row.note ?? '' }
  }
}

function LedgerRow({ row, showBalance, go }) {
  const { title, detail } = describeRow(row)
  const content = (
    <>
      <div className="list-main">
        <p className="list-title">{title}</p>
        <p className="list-sub">
          {formatDate(row.date)}
          {detail ? ` · ${detail}` : ''}
        </p>
      </div>
      <div className="list-end">
        <p className={`list-title ${row.amount > 0 ? 'money-in' : ''}`}>
          {row.amount > 0 ? '+' : ''}
          {formatMoney(row.amount)}
        </p>
        {showBalance && <p className={`list-sub ${row.balance < 0 ? 'money-owed' : ''}`}>{formatMoney(row.balance)}</p>}
      </div>
    </>
  )
  // Rows from a sweep week open that week's results.
  return (
    <li>
      {row.week ? (
        <button className="list-row" onClick={() => go({ name: 'week', weekId: row.week.id })}>
          {content}
        </button>
      ) : (
        <div className="list-row">{content}</div>
      )}
    </li>
  )
}

const FILTERS = {
  all: { label: 'All', test: () => true },
  winnings: { label: 'Winnings', test: (r) => WINNING_TYPES.has(r.type) },
  entries: { label: 'Entries', test: (r) => r.amount < 0 && r.type !== LEDGER_TYPE.WITHDRAWAL },
  payments: {
    label: 'Paid in/out',
    test: (r) => [LEDGER_TYPE.DEPOSIT, LEDGER_TYPE.WITHDRAWAL, LEDGER_TYPE.BUY_IN].includes(r.type),
  },
}

// Every movement of money on a player's account, newest first.
export function Transactions({ season, playerId, go }) {
  const [filter, setFilter] = useState('all')
  const balance = season.balanceOf(playerId)
  const rows = season.statementOf(playerId).filter(FILTERS[filter].test)

  return (
    <main className="page">
      <div>
        <h1 className="page-title">Your balance</h1>
        <p className={`big-number ${balance < 0 ? 'money-owed' : ''}`}>{formatMoney(balance)}</p>
        <p className="muted">
          {balance < 0
            ? 'You owe the sweep this amount. Pay the money admin to top up.'
            : 'In credit. Entries come out of this, and winnings are added to it.'}
        </p>
      </div>

      <div className="chips" role="group" aria-label="Show">
        {Object.entries(FILTERS).map(([key, f]) => (
          <button key={key} className="chip" aria-pressed={filter === key} onClick={() => setFilter(key)}>
            {f.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="empty">
          <p>Nothing here yet.</p>
        </div>
      ) : (
        <ul className="list">
          {rows.map((row, i) => (
            <LedgerRow key={i} row={row} showBalance={filter === 'all'} go={go} />
          ))}
        </ul>
      )}
    </main>
  )
}

const SOURCES = [
  { label: 'Sweep', types: [LEDGER_TYPE.SWEEP_WIN] },
  { label: 'Magic Twos', types: [LEDGER_TYPE.TWOS_WIN] },
  { label: 'Match play', types: [LEDGER_TYPE.MATCHPLAY_WIN] },
  { label: 'Ryder Cup', types: [LEDGER_TYPE.RYDER_WIN] },
]

// Each win this season, where it came from and when.
export function Winnings({ season, playerId, go }) {
  const rows = season.winningsListOf(playerId)
  const total = season.winningsOf(playerId)

  return (
    <main className="page">
      <div>
        <h1 className="page-title">Your winnings</h1>
        <p className="big-number">{formatMoney(total)}</p>
        <p className="muted">This season, from every competition.</p>
      </div>

      <div className="stats">
        {SOURCES.map((s) => {
          const sum = rows.filter((r) => s.types.includes(r.type)).reduce((n, r) => n + r.amount, 0)
          return (
            <div key={s.label} className="stat">
              <span className="stat-label">{s.label}</span>
              <span className="stat-value stat-value-small">{formatMoney(sum)}</span>
            </div>
          )
        })}
      </div>

      {rows.length === 0 ? (
        <div className="empty">
          <h2>No winnings yet</h2>
          <p>A top-two finish in the sweep or a Magic Two will show up here.</p>
        </div>
      ) : (
        <ul className="list">
          {rows.map((row, i) => (
            <LedgerRow key={i} row={row} go={go} />
          ))}
        </ul>
      )}
    </main>
  )
}

// Every sweep round the player has played, newest first.
export function Rounds({ season, playerId, go }) {
  const rounds = season.roundsOf(playerId)
  const finishes = rounds.map((r) => r.result.position).filter(Boolean)
  const best = finishes.length ? Math.min(...finishes) : null

  return (
    <main className="page">
      <h1 className="page-title">Your rounds</h1>

      <div className="stats stats-3">
        <div className="stat">
          <span className="stat-label">Played</span>
          <span className="stat-value">
            {rounds.length}
            <span className="stat-of"> / {season.weeks.length}</span>
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Top 3</span>
          <span className="stat-value">{finishes.filter((p) => p <= 3).length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Best</span>
          <span className="stat-value">{best ? ordinal(best) : '–'}</span>
        </div>
      </div>

      {rounds.length === 0 ? (
        <div className="empty">
          <h2>No rounds yet</h2>
          <p>Your rounds show up here once you’re in a week’s results.</p>
        </div>
      ) : (
        <ul className="list">
          {rounds.map(({ week, result }) => (
            <li key={week.id}>
              <button
                className={`list-row ${result.winnings ? 'row-winner' : ''}`}
                onClick={() => go({ name: 'week', weekId: week.id })}
              >
                <span className="pos">{result.position ? ordinal(result.position) : 'NR'}</span>
                <div className="list-main">
                  <p className="list-title">{week.competition}</p>
                  <p className="list-sub">
                    {formatDate(week.date)} · {result.position ? `${ordinal(result.position)} of ${week.sweep.results.length}` : 'No return'}
                  </p>
                </div>
                <div className="list-end">
                  <p className="list-title">
                    {result.score}
                    {week.scoring === 'STABLEFORD' && result.score !== 'NR' ? ' pts' : ''}
                  </p>
                  {result.winnings > 0 && <p className="list-sub prize">{formatMoney(result.winnings)}</p>}
                </div>
                <Icon name="chevron" size={18} className="chevron" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
