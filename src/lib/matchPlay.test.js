// Tests for the match-play knockout. Run with: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildBracket, makeDraw, matchPlayPrizeRows, playerStatus, recordResult } from './matchPlay.js'

const draw = Array.from({ length: 32 }, (_, i) => i + 1) // 1 v 2, 3 v 4 …
const player = (playerId) => ({ playerId, isAdmin: false })

// Plays every match in a round, the lower id winning.
function playRound(results, round) {
  const bracket = buildBracket({ draw, results })
  let out = results
  for (const m of bracket.rounds[round].matches) {
    out = recordResult(out, buildBracket({ draw, results: out }), { matchId: m.id, winnerId: Math.min(...m.playerIds), result: '2&1' }, player(m.playerIds[0]))
  }
  return out
}

test('the draw needs 32 different players and keeps them all', () => {
  assert.throws(() => makeDraw(draw.slice(1)), /exactly 32/)
  assert.throws(() => makeDraw([...draw.slice(1), 2]), /twice/)
  assert.deepEqual([...makeDraw(draw)].sort((a, b) => a - b), draw)
})

test('round 1 pairs the draw in order; later rounds come from the winners', () => {
  let results = playRound({}, 0)
  const bracket = buildBracket({ draw, results })
  assert.deepEqual(bracket.rounds[0].matches[0].playerIds, [1, 2])
  assert.deepEqual(bracket.rounds[1].matches[0].playerIds, [1, 3])
  assert.equal(bracket.rounds[2].matches[0].playerIds[0], null)
  results = playRound(results, 1)
  assert.deepEqual(buildBracket({ draw, results }).rounds[2].matches[0].playerIds, [1, 5])
})

test('player status: next match, waiting on an opponent, knocked out', () => {
  const results = recordResult({}, buildBracket({ draw }), { matchId: 'r0m0', winnerId: 1, result: '3&2' }, player(2))
  const bracket = buildBracket({ draw, results })
  const one = playerStatus(bracket, 1)
  assert.equal(one.state, 'NEXT')
  assert.equal(one.opponentId, null)
  assert.deepEqual(one.waitingOn.playerIds, [3, 4])
  assert.deepEqual(playerStatus(bracket, 2), { state: 'OUT', match: bracket.match('r0m0'), lostTo: 1 })
  assert.equal(playerStatus(bracket, 99).state, 'NOT_ENTERED')
})

test('only the two players (or an admin) can enter a result, and it must be valid', () => {
  const bracket = buildBracket({ draw })
  const entry = { matchId: 'r0m0', winnerId: 1, result: '3&2' }
  assert.throws(() => recordResult({}, bracket, entry, player(5)), /Only the two players/)
  assert.doesNotThrow(() => recordResult({}, bracket, entry, { playerId: null, isAdmin: true }))
  assert.throws(() => recordResult({}, bracket, { ...entry, winnerId: 3 }, player(1)), /who won/)
  assert.throws(() => recordResult({}, bracket, { ...entry, result: 'Halved' }, player(1)), /how the match finished/)
  assert.throws(() => recordResult({}, bracket, { matchId: 'r1m0', winnerId: 1, result: '1 UP' }, player(1)), /Both players/)
})

test('a result can’t be changed once the winner has played the next round', () => {
  const results = playRound(playRound({}, 0), 1)
  const bracket = buildBracket({ draw, results })
  assert.throws(
    () => recordResult(results, bracket, { matchId: 'r0m0', winnerId: 2, result: '1 UP' }, player(2)),
    /already been played/,
  )
})

test('the final pays £120 to the champion and £40 to the runner-up', () => {
  let results = {}
  for (let round = 0; round < 5; round++) results = playRound(results, round)
  const bracket = buildBracket({ draw, results })
  assert.equal(bracket.champion, 1)
  assert.equal(playerStatus(bracket, 1).state, 'CHAMPION')
  const rows = matchPlayPrizeRows(bracket, '2026-10-04')
  assert.deepEqual(rows.map((r) => [r.playerId, r.amount]), [[1, 12000], [bracket.runnerUp, 4000]])
  assert.deepEqual(matchPlayPrizeRows(buildBracket({ draw }), '2026-10-04'), [])
})
