// Tests for the sweep money and points rules. Run with: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  NO_RETURN,
  SCORING,
  formatMoney,
  orderOfMerit,
  rankByScore,
  rankTable,
  settleSweep,
  settleTwos,
} from './sweep.js'
import { buildSeason } from './season.js'
import { players, weeks } from '../data/season2026.js'

const entries = (list) => list.map(([playerId, score]) => ({ playerId, score }))
const season = buildSeason({ players, weeks })
const week = (id) => season.weeks.find((w) => w.id === id)
const winningsIn = (w) => w.sweep.results.filter((r) => r.winnings).map((r) => [r.playerId, r.winnings])

test('3 Oct (strokes): 8 players, £16 pot, Joe Muir £12, Jimmy Blair £4, as on the sheet', () => {
  const w = week('2026-10-03')
  assert.equal(w.sweep.pot, 1600)
  assert.deepEqual(winningsIn(w), [[30, 1200], [32, 400]])
})

test('10 Oct (stableford): 11 players, £22 pot, Joe Muir £16.50, Callum Duffy £5.50, as on the sheet', () => {
  const w = week('2026-10-10')
  assert.equal(w.sweep.pot, 2200)
  assert.deepEqual(winningsIn(w), [[30, 1650], [39, 550]])
})

test('an NR pays in but finishes last with no position', () => {
  const nr = week('2026-10-03').sweep.results.find((r) => r.playerId === 20)
  assert.equal(nr.score, NO_RETURN)
  assert.equal(nr.position, null)
  assert.equal(week('2026-10-03').sweep.results.at(-1).playerId, 20)
})

test('only one player: they take the whole pot', () => {
  const { pot, results } = settleSweep(entries([[1, 70]]))
  assert.equal(pot, 200)
  assert.equal(results[0].winnings, 200)
})

test('one returned score and an NR: the returned score takes the whole £4', () => {
  const { results } = settleSweep(entries([[1, 70], [2, NO_RETURN]]))
  assert.deepEqual(results.map((r) => r.winnings), [400, 0])
})

test('two players: £3 and £1', () => {
  const { results } = settleSweep(entries([[1, 70], [2, 72]]))
  assert.deepEqual(results.map((r) => r.winnings), [300, 100])
})

test('the same player twice is refused', () => {
  assert.throws(() => settleSweep(entries([[1, 70], [1, 72]])), /twice/)
})

test('rankByScore: lowest first for strokes, highest first for stableford, NRs last', () => {
  const list = entries([[1, 72], [2, NO_RETURN], [3, 70]])
  assert.deepEqual(rankByScore(list, SCORING.STROKES).ordered.map((e) => e.playerId), [3, 1, 2])
  assert.deepEqual(rankByScore(list, SCORING.STABLEFORD).ordered.map((e) => e.playerId), [1, 3, 2])
})

test('rankByScore reports level scores so the admin can apply countback', () => {
  const { ties } = rankByScore(entries([[1, 34], [2, 37], [3, 34], [4, 34]]), SCORING.STABLEFORD)
  assert.deepEqual(ties, [{ score: 34, playerIds: [1, 3, 4] }])
})

test('Magic Twos: £40 with no winner rolls over, making £80 the next week', () => {
  assert.equal(week('2026-10-03').twos.pot, 4000)
  assert.equal(week('2026-10-03').twos.rollsOver, 4000)
  assert.equal(week('2026-10-10').twos.pot, 8000)
  assert.deepEqual(season.twosRollover, { pot: 8000, weeks: 2 })
})

test('Magic Twos: shared equally, odd pence roll over', () => {
  const ids = Array.from({ length: 40 }, (_, i) => i + 1)
  assert.deepEqual(settleTwos({ memberIds: ids, carriedIn: 4000, winnerIds: [1, 2] }), {
    pot: 8000, share: 4000, winnerIds: [1, 2], rollsOver: 0,
  })
  const three = settleTwos({ memberIds: ids, carriedIn: 4000, winnerIds: [1, 2, 3] })
  assert.equal(three.share, 2666)
  assert.equal(three.rollsOver, 2)
})

test('balances: £30 buy-in, less £2 per round played and £1 Magic Twos each week, plus winnings', () => {
  // Joe Muir played both weeks and won £12 + £16.50
  assert.equal(season.balanceOf(30), 3000 - 400 - 200 + 1200 + 1650)
  // Tom Hamilton didn't play either week: only the Magic Twos
  assert.equal(season.balanceOf(34), 3000 - 200)
})

test('Order of Merit: 5 / 3 / 1, plus 5 each for a Magic Twos winner', () => {
  const points = orderOfMerit([
    { sweep: { results: [{ playerId: 1, position: 1 }, { playerId: 2, position: 2 }, { playerId: 3, position: 3 }] }, twos: { winnerIds: [2, 4] } },
  ])
  assert.deepEqual(Object.fromEntries(points), { 1: 5, 2: 8, 3: 1, 4: 5 })
})

test('Order of Merit from the demo weeks: Joe Muir 10, Callum Duffy 3, Jimmy Blair 3', () => {
  const byId = Object.fromEntries(season.merit.map((r) => [r.playerId, r]))
  assert.equal(byId[30].value, 10)
  assert.equal(byId[39].value, 3)
  assert.equal(byId[32].value, 3)
  assert.equal(byId[39].rank, 2)
  assert.equal(byId[39].tied, true)
})

test('rankTable leaves out players on zero and shares ranks', () => {
  const rows = rankTable(new Map([[1, 5], [2, 0], [3, 5], [4, 1]]))
  assert.deepEqual(rows.map((r) => [r.playerId, r.rank]), [[1, 1], [3, 1], [4, 3]])
})

test('money is shown in pounds, with a proper minus sign when owed', () => {
  assert.equal(formatMoney(1650), '£16.50')
  assert.equal(formatMoney(-400), '−£4.00')
})
