// Demo data copied from the 2026 Jam Sweep spreadsheet
// (data/2026-spreadsheet/*.csv). Used until the app has a real database.
//
// Assumptions, because the sheet doesn't say:
//   * Week numbers: 3 Oct was blank on the sheet; taken as week 18.
//   * Magic Twos: nobody got a two in either week (3 Oct's £40 rolled to £80).
//   * Ties without countback (3 Oct, Derek Stewart and Steven Cowan on 73)
//     keep the spreadsheet's order.

import { SCORING } from '../lib/sweep.js'

export const players = [
  [1, 'William Johnston', 3], [2, 'Fraser Forrest', 1], [3, 'Alan Middleton', 1],
  [4, 'Graeme Grove', 3], [5, 'Steven McFarlane', 1], [6, 'Craig Barnstaple', 1],
  [7, 'Ian Ralston', 3], [8, 'Steven Meek', 1], [9, 'Derek Stewart', 1],
  [10, 'Iain MacGregor', 1], [11, 'Craig Logan', 1], [12, 'Stephen Clark', 2],
  [13, 'David Howieson', 1], [14, 'Alan Forrest', 3], [15, 'Alan Carruthers', 2],
  [16, 'Jamie Mowat', 1], [17, 'Baber Saleem', 3], [18, 'John Devine', 3],
  [19, 'Kris Ferguson', 1], [20, 'Fraser McLuggage', 2], [21, 'Jamie McFarlane', 1],
  [22, 'Scott Blackwood', 2], [23, 'Gerry Sheridan', 1], [24, 'Steven Cowan', 1],
  [25, 'Stephen Hopkirk', 3], [26, 'Stuart Howieson', 1], [27, 'Sean McIntyre', 3],
  [28, 'Stephen MacInnes', 1], [29, 'Scott Gould', 1], [30, 'Joe Muir', 1],
  [31, 'Gary Swan', 1], [32, 'Jimmy Blair', 2], [33, 'Jason Lee', 1],
  [34, 'Tom Hamilton', 3], [35, 'Jamie Greenock', 3], [36, 'Liam Steele', 2],
  [37, 'Gary Donnelly', 3], [38, 'Mark Roddie', 3], [39, 'Callum Duffy', 2],
  [40, 'Barry McIntosh', 2],
].map(([id, name, division]) => ({ id, name, division }))

export const weeks = [
  {
    id: '2026-10-03',
    date: '2026-10-03',
    weekNumber: 18,
    competition: 'Kirkstyle Trophy',
    scoring: SCORING.STROKES,
    twosHole: 16,
    twosWinnerIds: [],
    // [playerId, score] as entered on the sheet
    scores: [[9, 73], [16, 75], [17, 76], [20, 'NR'], [24, 73], [30, 69], [32, 70], [39, 74]],
  },
  {
    id: '2026-10-10',
    date: '2026-10-10',
    weekNumber: 19,
    competition: 'Anderson Trophy',
    scoring: SCORING.STABLEFORD,
    twosHole: 5,
    twosWinnerIds: [],
    // In countback order where scores are level (Callum Duffy 2nd ahead of Steven Cowan on 34)
    scores: [[10, 25], [16, 29], [17, 24], [19, 27], [23, 22], [39, 34], [24, 34], [28, 23], [29, 31], [30, 37], [31, 33]],
  },
]

// The player shown on the home screen until sign-in is built.
export const DEMO_PLAYER_ID = 34
