import { useMemo } from 'react'
import { ComingSoon } from './components/ComingSoon.jsx'
import { Header } from './components/Header.jsx'
import { Home } from './components/Home.jsx'
import { Leaderboards } from './components/Leaderboards.jsx'
import { ResultsList, WeekResult } from './components/Results.jsx'
import { DEMO_PLAYER_ID, players, weeks } from './data/season2026.js'
import { buildSeason } from './lib/season.js'
import { useScreenHistory } from './state/useScreenHistory.js'

const TITLES = {
  home: 'Jam Sweep',
  results: 'Results',
  week: 'Results',
  leaderboards: 'Leaderboards',
  matchPlay: 'Match play',
  ryderCup: 'Ryder Cup',
  admin: 'Admin',
}

export default function App() {
  const { screen, go, back } = useScreenHistory()
  // Until sign-in and the database are built, the app runs on the demo weeks
  // from the 2026 spreadsheet and shows Tom's dashboard.
  const season = useMemo(() => buildSeason({ players, weeks }), [])
  const playerId = DEMO_PLAYER_ID

  let page
  switch (screen.name) {
    case 'results':
      page = <ResultsList season={season} go={go} />
      break
    case 'week':
      page = <WeekResult season={season} weekId={screen.weekId} playerId={playerId} />
      break
    case 'leaderboards':
      page = <Leaderboards season={season} playerId={playerId} />
      break
    case 'matchPlay':
      page = <ComingSoon title="Match play">The 32-player knockout draw, bracket and results.</ComingSoon>
      break
    case 'ryderCup':
      page = <ComingSoon title="The Ryder Cup">Live hole-by-hole scoring over the three days.</ComingSoon>
      break
    case 'admin':
      page = <ComingSoon title="Admin">Uploading results, managing players and the money ledger.</ComingSoon>
      break
    default:
      page = <Home season={season} playerId={playerId} go={go} />
  }

  return (
    <>
      <Header title={TITLES[screen.name] ?? 'Jam Sweep'} onBack={screen.name === 'home' ? null : back} />
      <p className="demo-banner">Demo: two weeks from the 2026 spreadsheet</p>
      {page}
    </>
  )
}
