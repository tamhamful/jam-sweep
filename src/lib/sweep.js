// The Jam Sweep money and points rules. Screens read from here rather than
// working anything out themselves, so there is one source of truth.
//
// All money is in pence (whole numbers) so it never picks up rounding errors:
// 200 = £2.00. The rules themselves are written up in SPEC.md.

export const SWEEP_ENTRY = 200
export const TWOS_ENTRY = 100
export const BUY_IN = 3000
export const MATCHPLAY_ENTRY = 500
export const RYDER_ENTRY = 500
export const FIRST_SHARE = 0.75

export const SCORING = {
  STROKES: 'STROKES', // medal / net strokes: lowest wins
  STABLEFORD: 'STABLEFORD', // highest wins
}

export const NO_RETURN = 'NR'

export const LEDGER_TYPE = {
  BUY_IN: 'BUY_IN',
  SWEEP_ENTRY: 'SWEEP_ENTRY',
  TWOS_ENTRY: 'TWOS_ENTRY',
  MATCHPLAY_ENTRY: 'MATCHPLAY_ENTRY',
  RYDER_ENTRY: 'RYDER_ENTRY',
  SWEEP_WIN: 'SWEEP_WIN',
  TWOS_WIN: 'TWOS_WIN',
  MATCHPLAY_WIN: 'MATCHPLAY_WIN',
  RYDER_WIN: 'RYDER_WIN',
  DEPOSIT: 'DEPOSIT', // money paid in to the money admin
  WITHDRAWAL: 'WITHDRAWAL', // money paid out by the money admin
}

// What each kind of ledger row is called on screen.
export const LEDGER_LABEL = {
  BUY_IN: 'Season buy-in',
  SWEEP_ENTRY: 'Sweep entry',
  TWOS_ENTRY: 'Magic Twos entry',
  MATCHPLAY_ENTRY: 'Match play entry',
  RYDER_ENTRY: 'Ryder Cup entry',
  SWEEP_WIN: 'Sweep winnings',
  TWOS_WIN: 'Magic Twos winnings',
  MATCHPLAY_WIN: 'Match play winnings',
  RYDER_WIN: 'Ryder Cup winnings',
  DEPOSIT: 'Paid in',
  WITHDRAWAL: 'Paid out',
}

// ---------- Weekly sweep ----------

// Puts hand-entered scores in finishing order: best score first, NRs last.
// Players on the same score keep the order they were entered in, and are
// reported in `ties` so the admin can sort them out on countback. (Results
// imported from HowDidiDo are already in countback order and skip this.)
export function rankByScore(entries, scoring) {
  const better = scoring === SCORING.STABLEFORD ? (a, b) => b - a : (a, b) => a - b
  const returned = entries.filter((e) => e.score !== NO_RETURN)
  const noReturn = entries.filter((e) => e.score === NO_RETURN)
  const ordered = [...returned].sort((a, b) => better(a.score, b.score))

  const ties = []
  for (let i = 1; i < ordered.length; i++) {
    if (ordered[i].score === ordered[i - 1].score) {
      const last = ties.at(-1)
      if (last && last.score === ordered[i].score) last.playerIds.push(ordered[i].playerId)
      else ties.push({ score: ordered[i].score, playerIds: [ordered[i - 1].playerId, ordered[i].playerId] })
    }
  }
  return { ordered: [...ordered, ...noReturn], ties }
}

// Works out a week's sweep from the entries in finishing order (best first).
// Everyone in the list played, so everyone pays the entry, NRs included.
// Returns the pot and, for each player, their position (null for an NR)
// and what they won.
export function settleSweep(entriesInOrder) {
  if (entriesInOrder.length === 0) throw new Error('There are no players in this week’s results.')

  const seen = new Set()
  for (const e of entriesInOrder) {
    if (seen.has(e.playerId)) throw new Error('A player appears twice in this week’s results.')
    seen.add(e.playerId)
  }

  const returned = entriesInOrder.filter((e) => e.score !== NO_RETURN)
  const noReturn = entriesInOrder.filter((e) => e.score === NO_RETURN)
  if (returned.length === 0) throw new Error('Nobody returned a score this week.')

  const pot = SWEEP_ENTRY * entriesInOrder.length
  // With only one returned score, that player takes the whole pot.
  const first = returned.length === 1 ? pot : Math.round(pot * FIRST_SHARE)
  const second = pot - first

  const results = [
    ...returned.map((e, i) => ({
      playerId: e.playerId,
      score: e.score,
      position: i + 1,
      winnings: i === 0 ? first : i === 1 ? second : 0,
    })),
    ...noReturn.map((e) => ({ playerId: e.playerId, score: NO_RETURN, position: null, winnings: 0 })),
  ]
  return { pot, results }
}

// ---------- Magic Twos ----------

// The Magic Twos for one week. Every member pays, but only in weeks with a
// sweep result. The pot is split equally between everyone who got a two;
// any odd pence left over from the split roll over with the pot. With no
// winner, the whole pot rolls over.
export function settleTwos({ memberIds, carriedIn = 0, winnerIds = [] }) {
  const pot = carriedIn + TWOS_ENTRY * memberIds.length
  if (winnerIds.length === 0) return { pot, share: 0, winnerIds: [], rollsOver: pot }
  const share = Math.floor(pot / winnerIds.length)
  return { pot, share, winnerIds, rollsOver: pot - share * winnerIds.length }
}

// ---------- Ledger ----------

// The ledger rows a confirmed week creates.
export function weekLedger(week, sweep, twos, memberIds) {
  const rows = []
  const add = (playerId, type, amount, extra) =>
    rows.push({ date: week.date, weekId: week.id, playerId, type, amount, ...extra })
  for (const r of sweep.results) add(r.playerId, LEDGER_TYPE.SWEEP_ENTRY, -SWEEP_ENTRY)
  for (const id of memberIds) add(id, LEDGER_TYPE.TWOS_ENTRY, -TWOS_ENTRY)
  for (const r of sweep.results) {
    if (r.winnings > 0) add(r.playerId, LEDGER_TYPE.SWEEP_WIN, r.winnings, { position: r.position })
  }
  for (const id of twos.winnerIds) add(id, LEDGER_TYPE.TWOS_WIN, twos.share)
  return rows
}

// A player's balance is always the sum of their ledger rows.
export function balanceOf(ledger, playerId) {
  return ledger.filter((r) => r.playerId === playerId).reduce((sum, r) => sum + r.amount, 0)
}

export const WINNING_TYPES = new Set([
  LEDGER_TYPE.SWEEP_WIN,
  LEDGER_TYPE.TWOS_WIN,
  LEDGER_TYPE.MATCHPLAY_WIN,
  LEDGER_TYPE.RYDER_WIN,
])

export function winningsOf(ledger, playerId) {
  return ledger
    .filter((r) => r.playerId === playerId && WINNING_TYPES.has(r.type))
    .reduce((sum, r) => sum + r.amount, 0)
}

// ---------- Leaderboards ----------

export const MERIT_POINTS = { 1: 5, 2: 3, 3: 1 }
export const TWOS_POINTS = 5

// Order of Merit points from the settled weeks. Match play doesn't count.
export function orderOfMerit(weeks) {
  const points = new Map()
  const add = (id, n) => points.set(id, (points.get(id) ?? 0) + n)
  for (const w of weeks) {
    for (const r of w.sweep.results) if (MERIT_POINTS[r.position]) add(r.playerId, MERIT_POINTS[r.position])
    for (const id of w.twos.winnerIds) add(id, TWOS_POINTS)
  }
  return points
}

// Sorts a Map of playerId -> number into a table, highest first. Players on
// the same number share a rank ("=2nd").
export function rankTable(values) {
  const rows = [...values.entries()]
    .filter(([, value]) => value > 0)
    .map(([playerId, value]) => ({ playerId, value }))
    .sort((a, b) => b.value - a.value)
  rows.forEach((row, i) => {
    row.rank = i > 0 && row.value === rows[i - 1].value ? rows[i - 1].rank : i + 1
  })
  rows.forEach((row) => {
    row.tied = rows.filter((r) => r.rank === row.rank).length > 1
  })
  return rows
}

// ---------- Display ----------

export function formatMoney(pence) {
  const sign = pence < 0 ? '−' : ''
  return `${sign}£${(Math.abs(pence) / 100).toFixed(2)}`
}

export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
