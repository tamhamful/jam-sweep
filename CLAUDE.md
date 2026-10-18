# Jam Sweep (Carluke Golf Club)

A phone-first app that replaces the weekly Jam Sweep spreadsheet: money
tracking, weekly results, Magic Twos, a match-play knockout, a Ryder Cup–style
event and leaderboards.

- **`SPEC.md` is the source of truth** for the rules. Keep it updated whenever
  a rule is confirmed or changed, and don't code a rule that is still marked
  **[?]** there without asking.
- Example data from the 2026 spreadsheet is in `data/2026-spreadsheet/`. Use
  it for test cases. For example, 10 Oct has 11 players, a £22 pot and pays
  £16.50 / £5.50.

## Working with Tom

- Tom isn't a developer. Explain things in plain English, without jargon, and
  give exact clicks and steps for anything he needs to do in Supabase, Vercel
  or GitHub.

## Build approach

- Use the same setup as `C:\Users\tom_h\work-golf-cup`: React + Vite,
  Supabase and Vercel.
  - Reuse its match-play scoring engine (`src/lib/scoring.js`) and its
    pattern of database functions that re-check the rules.
  - Extend the engine for 2 v 2 matches (fourballs and foursomes).
- Money is **tracking only**. Every change to a balance is a ledger row, and
  balances are always worked out from the ledger, never stored on their own.
- Store amounts in pence (whole numbers) so they never pick up rounding
  errors.
- Put the rules (pot, payouts, Order of Merit points, rollover) in plain
  functions with tests (`npm test`).
- Never put the Supabase secret / service_role key in the app or in Git.
