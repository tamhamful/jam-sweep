// The text that "Share results" puts on the clipboard, ready to paste into
// the WhatsApp group.

import { formatMoney, ordinal, SCORING } from './sweep.js'

const formatDate = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

export function shareText(week, season) {
  const name = season.playerName
  const unit = week.scoring === SCORING.STABLEFORD ? ' pts' : ''
  const lines = [`⛳ Jam Sweep · ${week.competition} · ${formatDate(week.date)}`, '']

  for (const r of week.sweep.results.filter((r) => r.position && r.position <= 3)) {
    const prize = r.winnings ? ` · ${formatMoney(r.winnings)}` : ''
    lines.push(`${ordinal(r.position)} ${name(r.playerId)} (${r.score}${unit})${prize}`)
  }
  lines.push('', `${week.sweep.results.length} played · pot ${formatMoney(week.sweep.pot)}`)

  if (week.twos.winnerIds.length) {
    const who = week.twos.winnerIds.map(name).join(', ')
    lines.push(`Magic Twos (hole ${week.twosHole}): ${who} · ${formatMoney(week.twos.share)} each`)
  } else {
    lines.push(`Magic Twos (hole ${week.twosHole}): no winner · ${formatMoney(week.twos.rollsOver)} rolls over`)
  }
  return lines.join('\n')
}

export { formatDate }
