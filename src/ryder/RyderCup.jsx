// The Ryder Cup section: the WGM Golf Cup screens (ticker, scoreboard, match
// board, scorecard, rankings, players) with fourballs, foursomes and singles.

import { useMemo, useState } from 'react'
import './ryder.css'
import './ryder-theme.css'
import DaySelector from './components/DaySelector.jsx'
import MatchBoard from './components/MatchBoard.jsx'
import PlayersView from './components/PlayersView.jsx'
import RankingsView from './components/RankingsView.jsx'
import Scoreboard from './components/Scoreboard.jsx'
import Scorecard from './components/Scorecard.jsx'
import Ticker from './components/Ticker.jsx'
import { getPlayerRankings } from './lib/rankings.js'
import { canScoreMatch, recordHole, resetMatch, undoLastHole } from './lib/scoring.js'
import { buildTickerEvents } from './lib/ticker.js'
import {
  FORMAT,
  getProjectedPoints,
  getTeamPoints,
  getTournamentStatus,
  sideNamer,
} from './lib/tournament.js'

const TABS = ['Leaderboard', 'Rankings', 'Players']

const initials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .join('')
    .slice(0, 3)

// What the scorecard shows for each side: "Tom Hamilton" / "TH" for singles,
// "Hamilton & Muir" / "HM" for a pair.
function sideFor(ids, playersById, sideName) {
  const names = ids.map((id) => playersById[id]?.name ?? 'TBC')
  const mark = names.length === 1 ? initials(names[0]) : names.map((n) => n.split(' ').at(-1)[0]).join('')
  return { name: sideName(ids), mark }
}

// Wraps the scoring engine so each change returns an error message (or null)
// like the WGM app, and records when each hole was entered for the ticker.
function useLocalScoring(tournament, setTournament) {
  const run = (change) => {
    let next
    try {
      next = change(tournament)
    } catch (error) {
      return error.message
    }
    const now = new Date().toISOString()
    setTournament({
      ...next,
      matches: next.matches.map((m) => {
        const before = tournament.matches.find((o) => o.id === m.id)
        if (before.holes === m.holes) return m
        const times = (before.holeTimes ?? []).slice(0, m.holes.length)
        m.holes.forEach((result, i) => {
          if (result !== before.holes[i] || !times[i]) times[i] = now
        })
        return { ...m, holeTimes: times }
      }),
    })
    return null
  }
  return {
    recordHole: (matchId, hole, result, actor) => run((t) => recordHole(t, matchId, hole, result, actor)),
    undoLastHole: (matchId, actor) => run((t) => undoLastHole(t, matchId, actor)),
    resetMatch: (matchId, actor) => run((t) => resetMatch(t, matchId, actor)),
  }
}

export function RyderCup({ tournament, setTournament, playerId, screen, go, back }) {
  const { teams, players, matches, days, dayInfo, targetPoints, holesPerMatch, currentDay } = tournament
  const scoring = useLocalScoring(tournament, setTournament)
  const playersById = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players])
  const sideName = useMemo(() => sideNamer(players), [players])
  const tickerEvents = useMemo(() => buildTickerEvents(tournament), [tournament])
  const [viewedDay, setViewedDay] = useState(null)

  const points = getTeamPoints(matches, holesPerMatch)
  const projected = getProjectedPoints(matches, holesPerMatch)
  const status = getTournamentStatus(matches, days, holesPerMatch, currentDay)
  const activeDay = viewedDay ?? currentDay
  const tab = TABS.includes(screen.tab) ? screen.tab : 'Leaderboard'

  // Members not playing in the Ryder Cup can watch but not score.
  const actor = { playerId: playersById[playerId] ? playerId : null, isAdmin: false }
  const canOpenMatch = (match) =>
    match.homeIds.length > 0 && match.challengerIds.length > 0 && canScoreMatch(tournament, match, actor)
  const dayMatches = matches.filter((m) => m.day === activeDay)
  const openableToday = dayMatches.some(canOpenMatch)

  const scoringMatch = matches.find((m) => m.id === screen.matchId)
  if (scoringMatch && canOpenMatch(scoringMatch)) {
    return (
      <main className="page ryder">
        <Scorecard
          key={scoringMatch.id}
          tournament={tournament}
          match={scoringMatch}
          home={sideFor(scoringMatch.homeIds, playersById, sideName)}
          challenger={sideFor(scoringMatch.challengerIds, playersById, sideName)}
          actor={actor}
          scoring={scoring}
          onBack={back}
        />
      </main>
    )
  }

  const format = FORMAT[dayInfo[activeDay].format]

  return (
    <main className="page ryder">
      <div className="ryder-top">
        <span className="tournament-status">{status.label}</span>
      </div>

      <Ticker events={tickerEvents} />

      <Scoreboard
        teams={teams}
        points={points}
        projected={projected}
        target={targetPoints}
        totalMatches={matches.length} // one point a match: 6 fourballs + 6 foursomes + 12 singles
      />

      <nav className="tabs" aria-label="Sections">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            className={`tab ${tab === name ? 'is-active' : ''}`}
            aria-current={tab === name ? 'page' : undefined}
            onClick={() => name !== tab && go({ name: 'ryderCup', tab: name })}
          >
            {name}
          </button>
        ))}
      </nav>

      {tab === 'Leaderboard' && (
        <>
          <DaySelector
            days={days}
            dayInfo={dayInfo}
            activeDay={activeDay}
            onChange={(day) => setViewedDay(day === currentDay ? null : day)}
          />
          <p className="format-note">
            <strong>{format.label}</strong> · {format.note} · {12 / format.perSide} matches
          </p>
          {openableToday && <p className="score-hint">Tap your group’s match to enter scores.</p>}
          <MatchBoard
            matches={dayMatches}
            teams={teams}
            playersById={playersById}
            holesPerMatch={holesPerMatch}
            canOpen={canOpenMatch}
            onOpen={(match) => go({ name: 'ryderCup', tab, matchId: match.id })}
            currentPlayerId={playerId}
          />
        </>
      )}
      {tab === 'Rankings' && (
        <RankingsView rankings={getPlayerRankings(tournament)} teams={teams} currentPlayerId={playerId} />
      )}
      {tab === 'Players' && <PlayersView teams={teams} players={players} />}
    </main>
  )
}
