// Tests for the Ryder Cup changes from the WGM app: 2 v 2 matches, who can
// score, pair rankings and prize money. Run with: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canScoreMatch, recordHole } from './scoring.js'
import { getPlayerRankings } from './rankings.js'
import { ryderOutcome, ryderPrizeRows } from './prizes.js'
import { sideNamer } from './tournament.js'

const players = [
  { id: 1, name: 'Tom Hamilton', teamId: 'HOME' },
  { id: 2, name: 'Joe Muir', teamId: 'HOME' },
  { id: 3, name: 'Derek Stewart', teamId: 'CHALLENGERS' },
  { id: 4, name: 'Gary Swan', teamId: 'CHALLENGERS' },
]
const fourball = { id: 'm1', number: 1, day: 1, perSide: 2, groupId: 'd1g1', homeIds: [1, 2], challengerIds: [3, 4], holes: [] }
const t = { name: 'Test Cup', players, matches: [fourball], holesPerMatch: 18, targetPoints: 0.5, teams: { HOME: { name: 'Team Blue' }, CHALLENGERS: { name: 'Team Gold' } } }

test('all four players in a fourball can score it; others cannot', () => {
  for (const id of [1, 2, 3, 4]) assert.equal(canScoreMatch(t, fourball, { playerId: id }), true)
  assert.equal(canScoreMatch(t, fourball, { playerId: 9 }), false)
})

test('a pair match is scored as one side against another', () => {
  let next = t
  for (let hole = 1; hole <= 10; hole++) next = recordHole(next, 'm1', hole, 'HOME', { playerId: 3 })
  assert.equal(next.matches[0].holes.length, 10) // 10 up with 8 to play: finished 10&8
  assert.throws(() => recordHole(next, 'm1', 11, 'HOME', { playerId: 1 }), /finished/)
})

test('both partners get the side’s holes and points in the rankings', () => {
  const played = { ...t, matches: [{ ...fourball, holes: Array(10).fill('HOME') }] }
  const rows = Object.fromEntries(getPlayerRankings(played).map((r) => [r.player.id, r]))
  assert.equal(rows[1].holesWon, 10)
  assert.equal(rows[2].holesWon, 10)
  assert.equal(rows[2].points, 1)
  assert.equal(rows[3].points, 0)
})

test('pairs are named by surname, singles by full name', () => {
  const name = sideNamer(players)
  assert.equal(name([1, 2]), 'Hamilton & Muir')
  assert.equal(name([3]), 'Derek Stewart')
})

test('the winning team shares the pot: £5 each from 4 players = £10 each for 2', () => {
  const won = { ...t, matches: [{ ...fourball, holes: Array(10).fill('HOME') }] }
  assert.equal(ryderOutcome(won).winner, 'HOME')
  assert.deepEqual(ryderPrizeRows(won, '2026-09-20').map((r) => [r.playerId, r.amount]), [[1, 1000], [2, 1000]])
})

test('a tie pays nobody (the pot rolls over to next year)', () => {
  const tied = { ...t, targetPoints: 1, matches: [{ ...fourball, holes: Array(18).fill('HALVED') }] }
  assert.deepEqual(ryderOutcome(tied), { winner: null, tied: true, complete: true })
  assert.deepEqual(ryderPrizeRows(tied, '2026-09-20'), [])
})
