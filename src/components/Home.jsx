import { formatMoney, ordinal } from '../lib/sweep.js'
import { Icon } from './Icon.jsx'

const TILES = [
  { screen: 'results', icon: 'results', name: 'Results', note: (s) => `${s.weeks.length} weeks this season` },
  { screen: 'matchPlay', icon: 'matchPlay', name: 'Match play', note: () => 'Knockout · 32 players' },
  { screen: 'ryderCup', icon: 'ryderCup', name: 'Ryder Cup', note: () => '12 v 12 · 3 days' },
  { screen: 'leaderboards', icon: 'leaderboards', name: 'Leaderboards', note: () => 'Order of Merit · winnings' },
]

// "3rd" or "=3rd", or a dash if they're not on the table yet.
function rankLabel(table, playerId) {
  const row = table.find((r) => r.playerId === playerId)
  if (!row) return '–'
  return `${row.tied ? '=' : ''}${ordinal(row.rank)}`
}

export function Home({ season, playerId, go }) {
  const balance = season.balanceOf(playerId)
  const firstName = season.playerName(playerId).split(' ')[0]
  const { pot, weeks } = season.twosRollover
  const merit = season.merit.find((r) => r.playerId === playerId)

  return (
    <main className="page">
      <p className="greeting">
        Hi <strong>{firstName}</strong>
      </p>

      <div className="stats">
        <div className="stat">
          <p className="stat-label">Balance</p>
          <p className={`stat-value ${balance < 0 ? 'money-owed' : ''}`}>{formatMoney(balance)}</p>
          <p className="stat-note">{balance < 0 ? 'Owed to the sweep' : 'In credit'}</p>
        </div>
        <div className="stat">
          <p className="stat-label">Winnings</p>
          <p className="stat-value">{formatMoney(season.winningsOf(playerId))}</p>
          <p className="stat-note">Ranked {rankLabel(season.winnings, playerId)}</p>
        </div>
        <div className="stat">
          <p className="stat-label">Order of Merit</p>
          <p className="stat-value">{rankLabel(season.merit, playerId)}</p>
          <p className="stat-note">{merit ? `${merit.value} points` : 'No points yet'}</p>
        </div>
        <div className="stat">
          <p className="stat-label">Rounds played</p>
          <p className="stat-value">
            {season.weeks.filter((w) => w.sweep.results.some((r) => r.playerId === playerId)).length}
          </p>
          <p className="stat-note">of {season.weeks.length} sweep weeks</p>
        </div>
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
        {TILES.map((t) => (
          <button key={t.screen} className="tile" onClick={() => go({ name: t.screen })}>
            <Icon name={t.icon} className="tile-icon" />
            <span className="tile-name">{t.name}</span>
            <span className="tile-note">{t.note(season)}</span>
          </button>
        ))}
      </div>

      <button className="admin-link" onClick={() => go({ name: 'admin' })}>
        Admin
      </button>
    </main>
  )
}
