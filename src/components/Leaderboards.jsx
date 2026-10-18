import { useState } from 'react'
import { formatMoney, ordinal } from '../lib/sweep.js'

const BOARDS = {
  merit: { label: 'Order of Merit', show: (v) => `${v} ${v === 1 ? 'pt' : 'pts'}`, note: '1st 5 · 2nd 3 · 3rd 1 · Magic Twos 5' },
  winnings: { label: 'Winnings', show: formatMoney, note: 'Weekly sweep, Magic Twos, match play and Ryder Cup' },
}

export function Leaderboards({ season, playerId }) {
  const [board, setBoard] = useState('merit')
  const rows = season[board]
  const { show, note } = BOARDS[board]

  return (
    <main className="page">
      <h1 className="page-title">Leaderboards</h1>
      <div className="segmented" role="group" aria-label="Choose a leaderboard">
        {Object.entries(BOARDS).map(([key, b]) => (
          <button key={key} aria-pressed={board === key} onClick={() => setBoard(key)}>
            {b.label}
          </button>
        ))}
      </div>
      <p className="list-sub">{note}</p>
      {rows.length === 0 ? (
        <div className="empty">
          <h2>No one on the board yet</h2>
          <p>It fills up once the first week’s results are in.</p>
        </div>
      ) : (
        <ol className="list">
          {rows.map((r) => (
            <li key={r.playerId} className={`list-row ${r.playerId === playerId ? 'row-me' : ''}`}>
              <span className="pos">
                {r.tied ? '=' : ''}
                {ordinal(r.rank)}
              </span>
              <span className="list-main list-title">{season.playerName(r.playerId)}</span>
              <span className="list-end list-title">{show(r.value)}</span>
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}
