import { useEffect, useRef, useState } from 'react'
import { playerStatus, RESULT_OPTIONS } from '../lib/matchPlay.js'
import { formatDate } from '../lib/share.js'

const roundName = (bracket, match) => bracket.rounds[match.round].name.replace(/s$/, '').toLowerCase()

// The player's own match: what's next, or how they went out.
function StatusCard({ bracket, status, playerId, name, onRecord }) {
  const [entering, setEntering] = useState(false)
  const [winnerId, setWinnerId] = useState(null)
  const [result, setResult] = useState('')
  const [error, setError] = useState(null)

  if (status.state === 'NOT_ENTERED') {
    return (
      <section className="mp-status">
        <p className="eyebrow">Match play</p>
        <p className="mp-status-title">You’re not in this year’s knockout</p>
        <p className="muted">You can still follow every match in the bracket below.</p>
      </section>
    )
  }

  if (status.state === 'CHAMPION') {
    return (
      <section className="mp-status is-champion">
        <p className="eyebrow">Match play</p>
        <p className="mp-status-title">Champion!</p>
        <p className="muted">You won the final {status.match.result}.</p>
      </section>
    )
  }

  if (status.state === 'OUT') {
    const { match, lostTo } = status
    return (
      <section className="mp-status is-out">
        <p className="eyebrow">Match play · knocked out</p>
        <p className="mp-status-title">Out in the {roundName(bracket, match)}</p>
        <p className="muted">
          Lost to {name(lostTo)} {match.result} on {formatDate(match.date)}.
        </p>
      </section>
    )
  }

  const { match, opponentId, waitingOn } = status
  const round = bracket.rounds[match.round]

  const save = () => {
    if (!winnerId) return setError('Choose who won.')
    if (!result) return setError('Choose the result, for example 3&2.')
    const problem = onRecord({ matchId: match.id, winnerId, result })
    if (problem) return setError(problem)
    setEntering(false)
    setError(null)
  }

  return (
    <section className="mp-status">
      <p className="eyebrow">Your next match · {round.name.replace(/s$/, '')}</p>
      <p className="mp-status-title">
        {opponentId ? `v ${name(opponentId)}` : 'Opponent to be decided'}
      </p>
      <p className="muted">
        {opponentId
          ? `Play by ${round.deadline ? formatDate(round.deadline) : 'the deadline'}. Either of you can enter the result.`
          : `You’ll play the winner of ${name(waitingOn.playerIds[0])} v ${name(waitingOn.playerIds[1])}.`}
      </p>

      {opponentId && !entering && (
        <button className="primary-button" onClick={() => setEntering(true)}>
          Enter result
        </button>
      )}

      {entering && (
        <div className="mp-form">
          <p className="mp-form-label">Who won?</p>
          <div className="segmented">
            {[playerId, opponentId].map((id) => (
              <button
                key={id}
                aria-pressed={winnerId === id}
                onClick={() => {
                  setWinnerId(id)
                  setError(null)
                }}
              >
                {id === playerId ? 'I won' : name(id)}
              </button>
            ))}
          </div>
          <label className="mp-form-label" htmlFor="mp-result">
            Result
          </label>
          <select
            id="mp-result"
            className="select"
            value={result}
            onChange={(e) => {
              setResult(e.target.value)
              setError(null)
            }}
          >
            <option value="">Choose…</option>
            {RESULT_OPTIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="mp-form-actions">
            <button className="secondary-button" onClick={() => setEntering(false)}>
              Cancel
            </button>
            <button className="primary-button" onClick={save}>
              Save result
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function Slot({ id, match, playerId, name }) {
  const won = id && match.winnerId === id
  const lost = id && match.loserId === id
  return (
    <div className={`mp-slot ${id === playerId ? 'is-you' : ''} ${won ? 'is-winner' : ''} ${lost ? 'is-loser' : ''}`}>
      <span className="mp-slot-name">{id ? name(id) : 'TBC'}</span>
      {won && <span className="mp-slot-result">{match.result}</span>}
    </div>
  )
}

// The full draw, one column per round. Scrolls sideways on a phone and opens
// on the round being played now.
function Bracket({ bracket, playerId, name }) {
  const scroller = useRef(null)
  const currentRound = bracket.rounds.findIndex((r) => r.matches.some((m) => !m.winnerId))

  useEffect(() => {
    const column = scroller.current?.children[Math.max(currentRound - 1, 0)]
    if (column) scroller.current.scrollLeft = column.offsetLeft - scroller.current.offsetLeft - 16
  }, [currentRound])

  return (
    <div className="mp-bracket" ref={scroller}>
      {bracket.rounds.map((round) => (
        <section key={round.round} className={`mp-round ${round.round === currentRound ? 'is-current' : ''}`}>
          <header className="mp-round-head">
            <p className="mp-round-name">{round.name}</p>
            <p className="mp-round-deadline">{round.deadline ? `By ${formatDate(round.deadline)}` : ''}</p>
          </header>
          <ol className="mp-round-matches">
            {round.matches.map((m) => (
              <li key={m.id} className="mp-match-wrap">
                <div className="mp-match">
                  <Slot id={m.playerIds[0]} match={m} playerId={playerId} name={name} />
                  <Slot id={m.playerIds[1]} match={m} playerId={playerId} name={name} />
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

export function MatchPlay({ bracket, playerId, name, onRecord }) {
  const status = playerStatus(bracket, playerId)
  const played = bracket.rounds.flatMap((r) => r.matches).filter((m) => m.winnerId).length

  return (
    <main className="page">
      <StatusCard
        key={status.match?.id ?? status.state}
        bracket={bracket}
        status={status}
        playerId={playerId}
        name={name}
        onRecord={onRecord}
      />
      <div className="title-row">
        <h2 className="section-title">Tournament bracket</h2>
        <p className="list-sub">{played} of 31 played</p>
      </div>
      <Bracket bracket={bracket} playerId={playerId} name={name} />
      {bracket.champion && (
        <p className="card">
          <strong>{name(bracket.champion)}</strong> won the knockout and £120. Runner-up {name(bracket.runnerUp)} wins £40.
        </p>
      )}
    </main>
  )
}
