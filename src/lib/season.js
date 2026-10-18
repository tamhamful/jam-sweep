// Turns a season's raw weeks into settled results, Magic Twos rollovers, the
// money ledger and the leaderboards. Weeks are settled in date order, because
// each week's Magic Twos pot depends on what rolled over from the week before.
//
// extraLedger holds everything that isn't a weekly sweep: paid in / paid out,
// match play and Ryder Cup entries and prizes.

import {
  BUY_IN,
  LEDGER_TYPE,
  WINNING_TYPES,
  balanceOf,
  orderOfMerit,
  rankByScore,
  rankTable,
  settleSweep,
  settleTwos,
  weekLedger,
  winningsOf,
} from './sweep.js'

export function buildSeason({ players, weeks, seasonStart = '2026-04-01', twosCarriedIn = 0, extraLedger = [] }) {
  const memberIds = players.map((p) => p.id)
  const ledger = memberIds.map((playerId) => ({
    date: seasonStart,
    weekId: null,
    playerId,
    type: LEDGER_TYPE.BUY_IN,
    amount: BUY_IN,
  }))

  let carried = twosCarriedIn
  let rolledWeeks = 0
  const settled = [...weeks]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((week) => {
      const entries = week.scores.map(([playerId, score]) => ({ playerId, score }))
      const { ordered } = rankByScore(entries, week.scoring)
      const sweep = settleSweep(ordered)
      const twos = settleTwos({ memberIds, carriedIn: carried, winnerIds: week.twosWinnerIds })
      ledger.push(...weekLedger(week, sweep, twos, memberIds))
      carried = twos.rollsOver
      rolledWeeks = twos.winnerIds.length ? 0 : rolledWeeks + 1
      return { ...week, sweep, twos }
    })

  ledger.push(...extraLedger)
  // Oldest first; rows on the same day keep the order they were added.
  ledger.sort((a, b) => a.date.localeCompare(b.date))

  const merit = rankTable(orderOfMerit(settled))
  const winnings = rankTable(new Map(memberIds.map((id) => [id, winningsOf(ledger, id)])))
  const weekById = Object.fromEntries(settled.map((w) => [w.id, w]))

  // A player's ledger rows, newest first, each with the balance after it.
  const statementOf = (id) => {
    let running = 0
    return ledger
      .filter((r) => r.playerId === id)
      .map((r) => ({ ...r, week: weekById[r.weekId] ?? null, balance: (running += r.amount) }))
      .reverse()
  }

  // The weeks a player played, newest first, with where they finished.
  const roundsOf = (id) =>
    settled
      .map((w) => ({ week: w, result: w.sweep.results.find((r) => r.playerId === id) }))
      .filter((row) => row.result)
      .reverse()

  return {
    players,
    weeks: settled,
    latestWeek: settled.at(-1) ?? null,
    ledger,
    merit,
    winnings,
    // The pot as it stands for the next week, before that week's entries.
    twosRollover: { pot: carried, weeks: rolledWeeks },
    balanceOf: (id) => balanceOf(ledger, id),
    winningsOf: (id) => winningsOf(ledger, id),
    statementOf,
    winningsListOf: (id) => statementOf(id).filter((r) => WINNING_TYPES.has(r.type)),
    roundsOf,
    playerName: (id) => players.find((p) => p.id === id)?.name ?? 'Unknown player',
  }
}
