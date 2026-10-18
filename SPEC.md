# Jam Sweep — Spec (draft 3, 18 Oct 2026)

A phone-first web app for the Jam Sweep at Carluke Golf Club. It replaces the
weekly spreadsheet. The app tracks money but never takes payments. It covers
weekly results, Magic Twos, a match-play knockout, a Ryder Cup–style event and
two leaderboards.

Items marked **[?]** are still open. They are listed under "Open questions" at
the end.

Example data from the 2026 spreadsheet is in `data/2026-spreadsheet/`.

---

## 1. People and sign-in

- About 40 members. Each member has a **division (1, 2 or 3)** **[?]**.
- Every member has an account and signs in with an **emailed link** (no passwords).
- **Members** see only their own balance and ledger, plus all public results.
- **Admins** (3–4 people) see everything, including every balance.
- Admins manage the player list: add, remove, change division, change email.
- Every admin change is recorded in an **audit log** (who, what, when).

## 2. Season

- Runs **April to October**. Weeks are numbered (e.g. 10 Oct 2026 = week 19).
- Past seasons are kept as read-only history.

## 3. Money (tracking only)

- **£30 buy-in** each season, including for late joiners.
- Each member has a **balance**. Entries take money off it; winnings add money to it.
- A balance **can go negative**, which means the member owes money.
- Paying money in and out happens **outside the app**. Admins record each payment in the app.
- **Season end:** the balance **carries over** and the next £30 is added on top. A member can **withdraw** their balance; the admin records the withdrawal.
- Every movement of money is a line in the **ledger**: date, type, amount, reason and running balance.

| Type                 | Amount |
|----------------------|--------|
| Buy-in               | +£30   |
| Weekly sweep entry   | −£2    |
| Magic Twos entry     | −£1    |
| Match-play entry     | −£5    |
| Ryder Cup entry      | −£5    |
| Winnings             | +£x    |
| Top-up / withdrawal  | ±£x (recorded by an admin) |
| Adjustment           | ±£x (admin, a reason is required) |

- **Admin "who's owed / who owes" screen.** It lists:
  - who is in the red, and by how much;
  - winnings not yet paid;
  - the season-end list.
- Note: a regular player spends about **£3 a week**, so £30 lasts about 10 weeks. Expect plenty of negative balances by mid-season. This screen is how the money admin chases top-ups.

## 4. Weekly sweep

- Each week has a **date**, a **week number**, a **competition name** (e.g. Kirkstyle Trophy) and a **scoring type**:
  - **Medal / net strokes:** lowest score wins.
  - **Stableford:** highest score wins.
- Results come from a **HowDidiDo file that an admin uploads**. The file format is still to be confirmed, and screenshot import may come later.
- **Interim:** until the HowDidiDo format is known, an admin can enter scores by hand, in the same layout as the spreadsheet.
- The app matches names in the file to sweep members. It ignores club members who are not in the sweep.
- **Who played that week = whoever appears in the results**, including **NR** (no return). Each of them is charged £2.
- **Positions:**
  - The order is taken straight from HowDidiDo, which already applies countback. Example: on 10 Oct, Callum Duffy and Steven Cowan both scored 34 points, and Callum was 2nd on countback.
  - An NR always finishes last.
- **Pot = £2 × the number of players.** 1st gets 75% and 2nd gets 25%. If only one person plays, they take the whole pot.
  - 3 Oct: 8 players, £16 pot → £12.00 / £4.00
  - 10 Oct: 11 players, £22 pot → £16.50 / £5.50
- The admin sees a **preview** and then confirms. No money moves until the admin confirms.
- 1st and 2nd are highlighted on the results.
- **Export** each week to a spreadsheet or image for the club noticeboard.

## 5. Magic Twos

- The admin picks the hole for each week, e.g. hole 16 or hole 5.
- **Every member** pays £1, but **only in weeks that have a sweep result**.
- Anyone who scores a 2 on that hole wins. If several people do, the pot is **split equally**.
- If nobody wins, the pot **rolls over**, including into next season. Example: £40 → £80.
- A **rollover call-out box** on the home page shows the current pot and how many weeks it has rolled.
- **Who scored a 2:** taken from the HowDidiDo file if it has hole-by-hole scores. If not, the admin ticks the winners.

## 6. Match-play knockout

- **32 players, random draw.** The app makes the draw and an admin confirms it. There are no byes.
- £5 entry is taken from each player's balance, making a £160 pot. The winner gets **75%** (£120) and the runner-up gets **25%** (£40).
- The admin sets a **deadline for each round**.
- **Either player** can enter the final result, e.g. "3&2". Handicaps are agreed on the day.
- Bracket view, plus reminders when a match deadline is near.

## 7. Ryder Cup

- **The admin chooses the 24 players** (12 per side). Each pays a £5 entry from their balance, making a £120 pot.
- The admin names two captains, and the captains pick their teams.
- **Three days, spread across the season:**
  - **Day 1: Fourballs.** 6 matches, 2 v 2, best ball.
  - **Day 2: Foursomes.** 6 matches, 2 v 2, alternate shot.
  - **Day 3: Singles.** 12 matches.
- 24 points are available in total. **12½ wins.** A halved match is worth ½.
- **Prize:** the £120 is split equally among the **winning team** (£10 each).
- **A 12–12 tie** means the pot **rolls over to next year's** Ryder Cup.
- Players score **live, hole by hole**. Live leaderboard, match board and ticker.
- Built from the **WGM Golf Cup** scoring engine. That engine is singles only, so it needs extending to 2 v 2.

## 8. Leaderboards

**Order of Merit** (match play does not count):

| Result              | Points |
|---------------------|--------|
| Weekly 1st          | 5      |
| Weekly 2nd          | 3      |
| Weekly 3rd          | 1      |
| Winning Magic Twos  | 5 each, even when shared |

**Winnings leaderboard:** total £ won this season from the weekly sweep, Magic Twos, match play and the Ryder Cup.

## 9. Home page

- **Personal dashboard:**
  - balance (shown in red if negative);
  - season winnings;
  - Order of Merit position;
  - winnings ranking.
- **Magic Twos rollover call-out box.**
- **Tiles:** Results · Match Play · Ryder Cup · Leaderboards.
- **Admin entry point**, visible to admins only.

## 10. Sharing

- A one-tap **"Share results"** button for each week. It produces a tidy summary to paste into WhatsApp.
- The same for match-play rounds and the Ryder Cup score.

## 11. Season-end summary

- Final Order of Merit and winnings table.
- Each member's closing balance, carried forward, plus any withdrawals.
- Awards: most twos, most wins, Ryder Cup winners and match-play champion.

## 12. Look and feel

- Name: **Jam Sweep**.
- **Logo: option C, the club badge.** A "JS" monogram inside a fairway-green circle with a brass ring (`public/logo.svg`).
- **Colours**, used consistently everywhere:
  - **Fairway** `#123B2C`: main colour, header and buttons.
  - **Brass** `#C9A54C`: winners, highlights and the Magic Twos.
  - **Chalk** `#F5F2EA`: page background.
  - **Ink** `#1A1F1C`: text.
  - **Owed** `#B4372E`: negative balances only.

## 13. Technology

The same setup as the WGM Golf Cup:

- **React + Vite** for the app. Phone-first, and it can be installed on the home screen.
- **Supabase** for the database, sign-in links and live updates.
- **Vercel** for free hosting. Pushing to GitHub updates the live site.

---

## Open questions

1. **Divisions:** what are divisions 1, 2 and 3 used for? Are there division prizes or separate tables, or are they just information?
2. **This season's history:** should the 2026 spreadsheet be imported so the app starts with real history? That needs the full spreadsheet, not just two weeks.
3. **Magic Twos, 10 Oct:** did anyone get a two on hole 5?
4. **HowDidiDo file:** an example export or screenshot is still to come.
