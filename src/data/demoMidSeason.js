// DEMONSTRATION DATA: a made-up half-way point in the 2026 season.
//   * 14 Saturday sweeps (4 Apr – 4 Jul), alternating medal and stableford
//   * the match-play knockout half way through (quarter-finals under way)
//   * Ryder Cup day 1 (fourballs) played; days 2 and 3 to come
// The members are the real list from the spreadsheet; every score, draw and
// payment is invented. It's generated from a fixed seed so it's the same on
// every load.

import { buildSeason } from '../lib/season.js'
import { makeDraw, matchId, matchPlayEntryRows } from '../lib/matchPlay.js'
import { computeMatchState } from '../ryder/lib/scoring.js'
import { FORMAT } from '../ryder/lib/tournament.js'
import { LEDGER_TYPE, NO_RETURN, RYDER_ENTRY, SCORING } from '../lib/sweep.js'
import { players } from './season2026.js'
import { pick, seededRandom, shuffle } from './random.js'

export const DEMO_PLAYER_ID = 34 // Tom Hamilton
const TOM = DEMO_PLAYER_ID

// One per Saturday from 4 Apr. Even weeks are medal (strokes), odd weeks stableford.
const COMPETITIONS = [
  'April Medal', 'Spring Stableford', 'Kirkstyle Trophy', 'Club Stableford', 'May Medal',
  'Anderson Trophy', 'Jubilee Cup', 'Summer Stableford', 'Rosebank Quaich', 'Captain’s Stableford',
  'June Medal', 'Midsummer Stableford', 'Clyde Valley Trophy', 'July Stableford',
]
const PAR_THREES = [2, 5, 9, 12, 16]

const addDays = (iso, days) => {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// ---------- Weekly sweeps ----------

function makeWeeks(random) {
  // How keen each member is: some play most weeks, some rarely.
  const keenness = Object.fromEntries(players.map((p) => [p.id, 0.15 + random() * 0.5]))
  keenness[TOM] = 0.6

  return COMPETITIONS.map((competition, i) => {
    const scoring = i % 2 === 0 ? SCORING.STROKES : SCORING.STABLEFORD
    let ids = players.filter((p) => random() < keenness[p.id]).map((p) => p.id)
    if (i === 8 || i === 10) ids = [...new Set([...ids, TOM])] // Tom plays weeks 9 and 11
    while (ids.length < 6) ids = [...new Set([...ids, pick(random, players).id])]

    const scores = shuffle(random, ids).map((id) => {
      if (random() < 0.05) return [id, NO_RETURN]
      const swing = Math.round((random() + random() + random() - 1.5) * 6)
      return [id, scoring === SCORING.STROKES ? 72 + swing : 36 - swing]
    })

    // Week 9: Tom has the round of his life.
    if (i === 8) {
      const best = scores.filter(([, s]) => s !== NO_RETURN).map(([, s]) => s)
      const winning = scoring === SCORING.STROKES ? Math.min(...best) - 2 : Math.max(...best) + 2
      scores.splice(scores.findIndex(([id]) => id === TOM), 1)
      scores.unshift([TOM, winning])
    }

    // Magic Twos: won in weeks 3, 7 (shared) and 11 (Tom); otherwise it rolls.
    const played = scores.filter(([, s]) => s !== NO_RETURN).map(([id]) => id).filter((id) => id !== TOM)
    const twosWinnerIds = i === 2 ? [played[0]] : i === 6 ? [played[1], played[2]] : i === 10 ? [TOM] : []

    const date = addDays('2026-04-04', i * 7)
    return {
      id: date,
      date,
      weekNumber: i + 1,
      competition,
      scoring,
      twosHole: PAR_THREES[i % PAR_THREES.length],
      twosWinnerIds,
      scores,
    }
  })
}

// ---------- Match play ----------

const MATCHPLAY_DEADLINES = ['2026-05-17', '2026-06-28', '2026-08-09', '2026-09-06', '2026-10-04']
const RESULTS = ['1 UP', '2&1', '3&2', '3&2', '4&3', '2&1', '5&4', '1 UP', 'At the 19th']

function makeMatchPlay(random) {
  const sittingOut = new Set([1, 4, 7, 14, 18, 25, 27, 38])
  const entrants = players.map((p) => p.id).filter((id) => !sittingOut.has(id))
  const draw = makeDraw(entrants, random)

  const results = {}
  let alive = draw
  // Rounds 1 and 2 finished; Tom wins both of his.
  for (let round = 0; round < 2; round++) {
    const next = []
    for (let i = 0; i < alive.length / 2; i++) {
      const pair = [alive[i * 2], alive[i * 2 + 1]]
      const winnerId = pair.includes(TOM) ? TOM : pick(random, pair)
      const date = addDays(MATCHPLAY_DEADLINES[round], -Math.floor(random() * 25) - 1)
      results[matchId(round, i)] = { winnerId, result: pick(random, RESULTS), date, enteredBy: winnerId }
      next.push(winnerId)
    }
    alive = next
  }
  // One quarter-final played so far, not Tom's.
  const qf = [0, 1, 2, 3].find((i) => ![alive[i * 2], alive[i * 2 + 1]].includes(TOM))
  results[matchId(2, qf)] = { winnerId: alive[qf * 2 + 1], result: '2&1', date: '2026-07-02', enteredBy: alive[qf * 2] }

  return { draw, results, deadlines: MATCHPLAY_DEADLINES, entryDate: '2026-04-25' }
}

// ---------- Ryder Cup ----------

const RYDER_DAYS = {
  1: { format: 'FOURBALLS', date: '2026-05-24' },
  2: { format: 'FOURSOMES', date: '2026-08-16' },
  3: { format: 'SINGLES', date: '2026-09-20' },
}

// Plays out a match hole by hole until it's decided.
function playMatch(random, holesPerMatch = 18) {
  const holes = []
  while (computeMatchState(holes, holesPerMatch).status !== 'COMPLETE') {
    const r = random()
    holes.push(r < 0.36 ? 'HOME' : r < 0.72 ? 'CHALLENGERS' : 'HALVED')
  }
  return holes
}

function makeRyderCup(random) {
  const blueCaptain = 30 // Joe Muir
  const goldCaptain = 9 // Derek Stewart
  const others = shuffle(
    random,
    players.map((p) => p.id).filter((id) => ![TOM, blueCaptain, goldCaptain].includes(id)),
  ).slice(0, 21)
  const blue = [blueCaptain, TOM, ...others.slice(0, 10)]
  const gold = [goldCaptain, ...others.slice(10, 21)]

  const teamOf = Object.fromEntries([...blue.map((id) => [id, 'HOME']), ...gold.map((id) => [id, 'CHALLENGERS'])])
  const ryderPlayers = [...blue, ...gold].map((id) => ({
    id,
    name: players.find((p) => p.id === id).name,
    teamId: teamOf[id],
  }))

  const matches = []
  const addDay = (day, perSide) => {
    const b = shuffle(random, blue)
    const g = shuffle(random, gold)
    const count = 12 / perSide
    for (let i = 0; i < count; i++) {
      const number = matches.length + 1
      // Pairs go out as their own group of four; singles two matches to a group.
      const group = perSide === 2 ? i + 1 : Math.floor(i / 2) + 1
      matches.push({
        id: `m${number}`,
        number,
        day,
        perSide,
        groupId: `d${day}g${group}`,
        homeIds: b.slice(i * perSide, (i + 1) * perSide),
        challengerIds: g.slice(i * perSide, (i + 1) * perSide),
        holes: [],
        holeTimes: [],
      })
    }
  }
  for (const day of [1, 2, 3]) addDay(day, FORMAT[RYDER_DAYS[day].format].perSide)

  // Day 1 played: tee times ten minutes apart from 08:30, about 12 minutes a hole.
  matches
    .filter((m) => m.day === 1)
    .forEach((m, i) => {
      m.holes = playMatch(random)
      const start = new Date(`${RYDER_DAYS[1].date}T08:30:00`).getTime() + i * 10 * 60000
      m.holeTimes = m.holes.map((_, h) => new Date(start + (h + 1) * 12 * 60000).toISOString())
    })

  return {
    name: 'Jam Sweep Ryder Cup',
    isDemo: true,
    days: [1, 2, 3],
    dayInfo: RYDER_DAYS,
    currentDay: 2,
    targetPoints: 12.5,
    holesPerMatch: 18,
    entryDate: '2026-05-02',
    teams: {
      HOME: { id: 'HOME', name: 'Team Blue', captainId: blueCaptain },
      CHALLENGERS: { id: 'CHALLENGERS', name: 'Team Gold', captainId: goldCaptain },
    },
    players: ryderPlayers,
    matches,
  }
}

// ---------- Money paid in and out ----------

// Members top up when they're in the red; a couple of big winners take some
// money out. Worked out in turn, because each payment depends on the balance
// at the time.
function makePayments(weeks, entryRows) {
  const payments = []
  const balanceOn = (id, date) => {
    const season = buildSeason({ players, weeks, extraLedger: [...entryRows, ...payments] })
    return season.ledger.filter((r) => r.playerId === id && r.date <= date).reduce((s, r) => s + r.amount, 0)
  }
  for (const date of ['2026-05-16', '2026-06-20']) {
    const season = buildSeason({ players, weeks, extraLedger: [...entryRows, ...payments] })
    for (const p of players) {
      if (p.id % 4 === 0 && p.id !== TOM) continue // some never get round to it
      const balance = season.ledger.filter((r) => r.playerId === p.id && r.date <= date).reduce((s, r) => s + r.amount, 0)
      if (balance < 0) payments.push({ date, weekId: null, playerId: p.id, type: LEDGER_TYPE.DEPOSIT, amount: 2000 })
    }
  }
  const season = buildSeason({ players, weeks, extraLedger: [...entryRows, ...payments] })
  for (const row of season.winnings.slice(0, 2)) {
    if (balanceOn(row.playerId, '2026-06-27') > 4000) {
      payments.push({ date: '2026-06-27', weekId: null, playerId: row.playerId, type: LEDGER_TYPE.WITHDRAWAL, amount: -2500 })
    }
  }
  return payments
}

export function createDemoSeason() {
  const random = seededRandom(2026)
  const weeks = makeWeeks(random)
  const matchPlay = makeMatchPlay(random)
  const ryderCup = makeRyderCup(random)

  const entryRows = [
    ...matchPlayEntryRows(matchPlay.draw, matchPlay.entryDate),
    ...ryderCup.players.map((p) => ({
      date: ryderCup.entryDate,
      weekId: null,
      playerId: p.id,
      type: LEDGER_TYPE.RYDER_ENTRY,
      amount: -RYDER_ENTRY,
    })),
  ]
  const payments = makePayments(weeks, entryRows)

  return { players, weeks, extraLedger: [...entryRows, ...payments], matchPlay, ryderCup, today: '2026-07-06' }
}
