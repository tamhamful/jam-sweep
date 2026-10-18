import { formatMoney, ordinal } from '../lib/sweep.js'
import { Icon } from './Icon.jsx'

// "3rd" or "=3rd", or a dash if they're not on the table yet.
function rankLabel(table, playerId) {
  const row = table.find((r) => r.playerId === playerId)
  if (!row) return '–'
  return `${row.tied ? '=' : ''}${ordinal(row.rank)}`
}

function Stat({ label, value, note, owed, onClick }) {
  return (
    <button className="stat stat-button" onClick={onClick}>
      <span className="stat-label">
        {label}
        <Icon name="chevron" size={14} className="chevron" />
      </span>
      <span className={`stat-value ${owed ? 'money-owed' : ''}`}>{value}</span>
      <span className="stat-note">{note}</span>
    </button>
  )
}

// notes: one-line status for the Match play and Ryder Cup tiles.
export function Home({ season, playerId, go, notes }) {
  const balance = season.balanceOf(playerId)
  const firstName = season.playerName(playerId).split(' ')[0]
  const { pot, weeks } = season.twosRollover
  const merit = season.merit.find((r) => r.playerId === playerId)
  const latest = season.latestWeek
  const rounds = season.roundsOf(playerId).length

  const tiles = [
    {
      icon: 'results',
      name: 'Results',
      note: latest ? `Latest: ${latest.competition}` : 'No results yet',
      open: () => go(latest ? { name: 'week', weekId: latest.id } : { name: 'results' }),
    },
    { icon: 'matchPlay', name: 'Match play', note: notes.matchPlay, open: () => go({ name: 'matchPlay' }) },
    { icon: 'ryderCup', name: 'Ryder Cup', note: notes.ryderCup, open: () => go({ name: 'ryderCup' }) },
    { icon: 'leaderboards', name: 'Leaderboards', note: 'Order of Merit · winnings', open: () => go({ name: 'leaderboards' }) },
  ]

  return (
    <main className="page">
      <p className="greeting">
        Hi <strong>{firstName}</strong>
      </p>

      <div className="stats">
        <Stat
          label="Balance"
          value={formatMoney(balance)}
          note={balance < 0 ? 'Owed to the sweep' : 'In credit'}
          owed={balance < 0}
          onClick={() => go({ name: 'transactions' })}
        />
        <Stat
          label="Winnings"
          value={formatMoney(season.winningsOf(playerId))}
          note={`Ranked ${rankLabel(season.winnings, playerId)}`}
          onClick={() => go({ name: 'winnings' })}
        />
        <Stat
          label="Order of Merit"
          value={rankLabel(season.merit, playerId)}
          note={merit ? `${merit.value} points` : 'No points yet'}
          onClick={() => go({ name: 'leaderboards', board: 'merit' })}
        />
        <Stat
          label="Rounds played"
          value={rounds}
          note={`of ${season.weeks.length} sweep weeks`}
          onClick={() => go({ name: 'rounds' })}
        />
      </div>

      <div className="callout">
        <span className="callout-badge">2</span>
        <div>
          <p className="callout-label">Magic Twos</p>
          <p className="callout-value">{formatMoney(pot)} carried over</p>
          <p className="callout-note">
            {weeks > 0 ? `No winner for ${weeks} ${weeks === 1 ? 'week' : 'weeks'}. ` : ''}
            Next week’s pot: {formatMoney(pot + 100 * season.players.length)}
          </p>
        </div>
      </div>

      <div className="tiles">
        {tiles.map((t) => (
          <button key={t.name} className="tile" onClick={t.open}>
            <Icon name={t.icon} className="tile-icon" />
            <span className="tile-name">{t.name}</span>
            <span className="tile-note">{t.note}</span>
          </button>
        ))}
      </div>

      <button className="admin-link" onClick={() => go({ name: 'admin' })}>
        Admin
      </button>
    </main>
  )
}
