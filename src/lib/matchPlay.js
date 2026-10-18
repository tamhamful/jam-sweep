// The match-play knockout: 32 players, random draw, no byes.
//
// Only two things are stored: the draw (the 32 player ids in bracket order,
// so 1 v 2, 3 v 4 …) and each match's result. Who plays whom in later rounds
// is always worked out from the results, so the bracket can't get out of step.

import { LEDGER_TYPE, MATCHPLAY_ENTRY, FIRST_SHARE } from './sweep.js'

export const DRAW_SIZE = 32
export const ROUND_NAMES = ['Round 1', 'Round 2', 'Quarter-finals', 'Semi-finals', 'Final']

// How a match can finish. Knockout matches can't be halved, so a match level
// after 18 goes to extra holes.
export const RESULT_OPTIONS = [
  '1 UP', '2&1', '3&2', '4&3', '5&4', '6&5', '7&6', '8&7', '9&8', '10&8',
  'At the 19th', 'At the 20th', 'At the 21st',
]

// Random draw. `random` is a function returning 0–1 (Math.random by default).
export function makeDraw(playerIds, random = Math.random) {
  if (playerIds.length !== DRAW_SIZE) throw new Error(`The draw needs exactly ${DRAW_SIZE} players.`)
  if (new Set(playerIds).size !== DRAW_SIZE) throw new Error('A player is in the draw twice.')
  const draw = [...playerIds]
  for (let i = draw.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[draw[i], draw[j]] = [draw[j], draw[i]]
  }
  return draw
}

export const matchId = (round, index) => `r${round}m${index}`

// The whole bracket from the draw and the results.
// Each match: { id, round, index, playerIds: [a, b] (null = not known yet),
//               winnerId, loserId, result, feeds: [matchId, matchId] }
export function buildBracket({ draw, results = {}, deadlines = [] }) {
  const rounds = []
  let entrants = draw.map((id) => id)
  for (let round = 0; round < ROUND_NAMES.length; round++) {
    const matches = []
    for (let index = 0; index < entrants.length / 2; index++) {
      const id = matchId(round, index)
      const playerIds = [entrants[index * 2] ?? null, entrants[index * 2 + 1] ?? null]
      const saved = results[id]
      const winnerId = saved && playerIds.includes(saved.winnerId) ? saved.winnerId : null
      matches.push({
        id,
        round,
        index,
        playerIds,
        winnerId,
        loserId: winnerId ? playerIds.find((p) => p !== winnerId) : null,
        result: winnerId ? saved.result : null,
        date: winnerId ? saved.date : null,
        feeds: round === 0 ? null : [matchId(round - 1, index * 2), matchId(round - 1, index * 2 + 1)],
      })
    }
    rounds.push({ round, name: ROUND_NAMES[round], deadline: deadlines[round] ?? null, matches })
    entrants = matches.map((m) => m.winnerId)
  }
  const final = rounds.at(-1).matches[0]
  return {
    rounds,
    champion: final.winnerId,
    runnerUp: final.loserId,
    match: (id) => rounds.flatMap((r) => r.matches).find((m) => m.id === id),
  }
}

// Where a player stands: their next match, how they went out, or champion.
export function playerStatus(bracket, playerId) {
  const all = bracket.rounds.flatMap((r) => r.matches)
  const mine = all.filter((m) => m.playerIds.includes(playerId))
  if (mine.length === 0) return { state: 'NOT_ENTERED' }

  if (bracket.champion === playerId) return { state: 'CHAMPION', match: mine.at(-1) }

  const lost = mine.find((m) => m.loserId === playerId)
  if (lost) return { state: 'OUT', match: lost, lostTo: lost.winnerId }

  const next = mine.find((m) => !m.winnerId)
  if (next) {
    const opponentId = next.playerIds.find((p) => p !== playerId) ?? null
    // Opponent not known yet: they'll be the winner of the feeding match.
    const waitingOn = opponentId ? null : bracket.match(next.feeds[next.playerIds.indexOf(null)])
    return { state: 'NEXT', match: next, opponentId, waitingOn }
  }
  // Won their latest match; the next one isn't set yet (shouldn't happen).
  return { state: 'WAITING', match: mine.at(-1) }
}

// Records a match result. Either player in the match, or an admin, can do it.
// A result can be corrected until the winner has played their next match.
// Returns the new results object, or throws with a plain-English message.
export function recordResult(results, bracket, { matchId: id, winnerId, result, date }, actor) {
  const match = bracket.match(id)
  if (!match) throw new Error('That match no longer exists.')
  const [a, b] = match.playerIds
  if (!a || !b) throw new Error('Both players need to be known before a result can be entered.')
  if (!actor.isAdmin && !match.playerIds.includes(actor.playerId)) {
    throw new Error('Only the two players in this match, or an admin, can enter the result.')
  }
  if (!match.playerIds.includes(winnerId)) throw new Error('Choose who won the match.')
  if (!RESULT_OPTIONS.includes(result)) throw new Error('Choose how the match finished, e.g. 3&2.')

  const nextRound = bracket.rounds[match.round + 1]
  const next = nextRound?.matches[Math.floor(match.index / 2)]
  if (next?.winnerId) {
    throw new Error(`The ${nextRound.name.toLowerCase().replace(/s$/, '')} has already been played, so this result can’t be changed. Ask an admin.`)
  }
  return { ...results, [id]: { winnerId, result, date, enteredBy: actor.playerId } }
}

// Prize money once the final is played: 75% to the winner, 25% to the
// runner-up, from the £5 entries.
export function matchPlayPrizeRows(bracket, date) {
  if (!bracket.champion) return []
  const pot = MATCHPLAY_ENTRY * DRAW_SIZE
  const first = Math.round(pot * FIRST_SHARE)
  return [
    { date, weekId: null, playerId: bracket.champion, type: LEDGER_TYPE.MATCHPLAY_WIN, amount: first, note: 'Champion' },
    { date, weekId: null, playerId: bracket.runnerUp, type: LEDGER_TYPE.MATCHPLAY_WIN, amount: pot - first, note: 'Runner-up' },
  ]
}

export function matchPlayEntryRows(draw, date) {
  return draw.map((playerId) => ({
    date,
    weekId: null,
    playerId,
    type: LEDGER_TYPE.MATCHPLAY_ENTRY,
    amount: -MATCHPLAY_ENTRY,
  }))
}
