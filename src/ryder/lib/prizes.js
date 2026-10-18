// Ryder Cup prize money. Everyone pays £5 to play; once a team reaches the
// winning total the pot is shared equally between that team's players.
// A 12–12 tie means the pot rolls over to next year.

import { LEDGER_TYPE, RYDER_ENTRY } from '../../lib/sweep.js'
import { getTeamPoints, STATUS } from './tournament.js'
import { getMatchStatus } from './scoring.js'

export function ryderPot(t, carriedIn = 0) {
  return carriedIn + RYDER_ENTRY * t.players.length
}

// { winner: 'HOME' | 'CHALLENGERS' | null, tied, complete }
export function ryderOutcome(t) {
  const points = getTeamPoints(t.matches, t.holesPerMatch)
  const winner = ['HOME', 'CHALLENGERS'].find((team) => points[team] >= t.targetPoints) ?? null
  const complete = t.matches.every((m) => getMatchStatus(m, t.holesPerMatch) === STATUS.COMPLETE)
  return { winner, tied: complete && !winner, complete }
}

export function ryderPrizeRows(t, date, carriedIn = 0) {
  const { winner } = ryderOutcome(t)
  if (!winner) return []
  const team = t.players.filter((p) => p.teamId === winner)
  const pot = ryderPot(t, carriedIn)
  const share = Math.floor(pot / team.length)
  return team.map((p) => ({
    date,
    weekId: null,
    playerId: p.id,
    type: LEDGER_TYPE.RYDER_WIN,
    amount: share,
    note: t.teams[winner].name,
  }))
}
