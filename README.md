# Jam Sweep

Phone-first app for the Jam Sweep at Carluke Golf Club. It covers money
tracking, weekly results, Magic Twos, match play, the Ryder Cup and the
leaderboards. The rules are in [`SPEC.md`](SPEC.md).

At the moment it runs on a made-up half-way point in the 2026 season (14 sweeps, match play at the quarter-finals, Ryder Cup day 1 played), built from the real member list. The "viewing as" box at the top switches between members. Scores you enter last until the page is reloaded.

## Running it on this computer

```bash
npm install
npm run dev
```

Then open the address it prints, for example http://localhost:5173.

## Checks

```bash
npm test
npm run lint
npm run build
```
