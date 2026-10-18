// Checks the half-way demo season is what it says, and that the money adds
// up: every penny is either in someone's balance or sitting in a pot.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createDemoSeason, DEMO_PLAYER_ID } from './demoMidSeason.js'
import { buildSeason } from '../lib/season.js'
import { buildBracket, playerStatus, DRAW_SIZE } from '../lib/matchPlay.js'
import { BUY_IN, LEDGER_TYPE, MATCHPLAY_ENTRY } from '../lib/sweep.js'
import { getTeamPoints } from '../ryder/lib/tournament.js'
import { ryderPot } from '../ryder/lib/prizes.js'

const demo = createDemoSeason()
const season = buildSeason({ players: demo.players, weeks: demo.weeks, extraLedger: demo.extraLedger })
const bracket = buildBracket(demo.matchPlay)

test('14 sweeps played', () => {
  assert.equal(season.weeks.length, 14)
})

test('match play is half way: rounds 1 and 2 done, quarter-finals under way', () => {
  const done = bracket.rounds.map((r) => r.matches.filter((m) => m.winnerId).length)
  assert.deepEqual(done, [16, 8, 1, 0, 0])
  assert.equal(playerStatus(bracket, DEMO_PLAYER_ID).state, 'NEXT')
})

test('Ryder Cup: day 1 (6 fourballs) played, days 2 and 3 to come', () => {
  const { matches } = demo.ryderCup
  assert.equal(matches.length, 24)
  const points = getTeamPoints(matches, 18)
  assert.equal(points.HOME + points.CHALLENGERS, 6)
  assert.ok(matches.filter((m) => m.day > 1).every((m) => m.holes.length === 0))
})

test('the money adds up: balances = buy-ins + paid in − paid out − money still in pots', () => {
  const sum = (type) => season.ledger.filter((r) => r.type === type).reduce((n, r) => n + r.amount, 0)
  const balances = demo.players.reduce((n, p) => n + season.balanceOf(p.id), 0)
  const inPots = season.twosRollover.pot + MATCHPLAY_ENTRY * DRAW_SIZE + ryderPot(demo.ryderCup)
  assert.equal(balances, demo.players.length * BUY_IN + sum(LEDGER_TYPE.DEPOSIT) + sum(LEDGER_TYPE.WITHDRAWAL) - inPots)
})
