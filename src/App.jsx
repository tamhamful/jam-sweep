import { useMemo, useState } from 'react'
import { ComingSoon } from './components/ComingSoon.jsx'
import { Header } from './components/Header.jsx'
import { Home } from './components/Home.jsx'
import { Leaderboards } from './components/Leaderboards.jsx'
import { MatchPlay } from './components/MatchPlay.jsx'
import { ResultsList, WeekResult } from './components/Results.jsx'
import { Rounds, Transactions, Winnings } from './components/Statement.jsx'
import { createDemoSeason, DEMO_PLAYER_ID } from './data/demoMidSeason.js'
import { buildBracket, matchPlayPrizeRows, playerStatus, recordResult } from './lib/matchPlay.js'
import { buildSeason } from './lib/season.js'
import { RyderCup } from './ryder/RyderCup.jsx'
import { getTeamPoints, formatPoints } from './ryder/lib/tournament.js'
import { ryderPrizeRows } from './ryder/lib/prizes.js'
import { useScreenHistory } from './state/useScreenHistory.js'

const TITLES = {
  home: 'Jam Sweep',
  results: 'Results',
  week: 'Results',
  leaderboards: 'Leaderboards',
  transactions: 'Balance',
  winnings: 'Winnings',
  rounds: 'Rounds played',
  matchPlay: 'Match play',
  ryderCup: 'Ryder Cup',
  admin: 'Admin',
}

// One line for the Match play tile on the home screen.
function matchPlayNote(bracket, playerId) {
  const status = playerStatus(bracket, playerId)
  const round = status.match && bracket.rounds[status.match.round].name.replace(/s$/, '').toLowerCase()
  switch (status.state) {
    case 'NEXT':
      return `Next: ${round}`
    case 'OUT':
      return `Out in the ${round}`
    case 'CHAMPION':
      return 'Champion!'
    default:
      return 'Knockout · 32 players'
  }
}

export default function App() {
  const { screen, go, back } = useScreenHistory()

  // Until sign-in and the database are built, the app runs on a made-up
  // half-way point in the season. Scores entered here only last until the
  // page is reloaded.
  const demo = useMemo(() => createDemoSeason(), [])
  const [playerId, setPlayerId] = useState(DEMO_PLAYER_ID)
  const [matchResults, setMatchResults] = useState(demo.matchPlay.results)
  const [ryderCup, setRyderCup] = useState(demo.ryderCup)

  const bracket = useMemo(() => buildBracket({ ...demo.matchPlay, results: matchResults }), [demo, matchResults])
  const season = useMemo(
    () =>
      buildSeason({
        players: demo.players,
        weeks: demo.weeks,
        extraLedger: [
          ...demo.extraLedger,
          ...matchPlayPrizeRows(bracket, demo.today),
          ...ryderPrizeRows(ryderCup, demo.today),
        ],
      }),
    [demo, bracket, ryderCup],
  )

  const recordMatchResult = (entry) => {
    try {
      const actor = { playerId, isAdmin: false }
      setMatchResults(recordResult(matchResults, bracket, { ...entry, date: demo.today }, actor))
      return null
    } catch (error) {
      return error.message
    }
  }

  const ryderPoints = getTeamPoints(ryderCup.matches, ryderCup.holesPerMatch)
  const notes = {
    matchPlay: matchPlayNote(bracket, playerId),
    ryderCup: `Blue ${formatPoints(ryderPoints.HOME)} – ${formatPoints(ryderPoints.CHALLENGERS)} Gold`,
  }

  let page
  switch (screen.name) {
    case 'results':
      page = <ResultsList season={season} go={go} />
      break
    case 'week':
      page = <WeekResult season={season} weekId={screen.weekId} playerId={playerId} go={go} />
      break
    case 'leaderboards':
      page = <Leaderboards season={season} playerId={playerId} initialBoard={screen.board ?? 'merit'} />
      break
    case 'transactions':
      page = <Transactions season={season} playerId={playerId} go={go} />
      break
    case 'winnings':
      page = <Winnings season={season} playerId={playerId} go={go} />
      break
    case 'rounds':
      page = <Rounds season={season} playerId={playerId} go={go} />
      break
    case 'matchPlay':
      page = <MatchPlay bracket={bracket} playerId={playerId} name={season.playerName} onRecord={recordMatchResult} />
      break
    case 'ryderCup':
      page = (
        <RyderCup
          tournament={ryderCup}
          setTournament={setRyderCup}
          playerId={playerId}
          screen={screen}
          go={go}
          back={back}
        />
      )
      break
    case 'admin':
      page = <ComingSoon title="Admin">Uploading results, managing players and the money ledger.</ComingSoon>
      break
    default:
      page = <Home season={season} playerId={playerId} go={go} notes={notes} />
  }

  return (
    <>
      <Header title={TITLES[screen.name] ?? 'Jam Sweep'} onBack={screen.name === 'home' ? null : back} />
      <p className="demo-banner">
        Demo season · viewing as
        <select value={playerId} onChange={(e) => setPlayerId(Number(e.target.value))} aria-label="View the app as">
          {demo.players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </p>
      {page}
    </>
  )
}
