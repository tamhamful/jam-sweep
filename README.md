# Jam Sweep

Phone-first app for the Jam Sweep at Carluke Golf Club. It covers money
tracking, weekly results, Magic Twos, match play, the Ryder Cup and the
leaderboards. The rules are in [`SPEC.md`](SPEC.md).

At the moment it runs on demo data: two weeks taken from the 2026
spreadsheet. Sign-in and the database (Supabase) come next.

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
