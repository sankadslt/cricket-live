# SLT Games 2026 Cricket (MERN)

MongoDB + Express + React (Vite) + Node. English / Sinhala. Boys and Girls are kept separate everywhere. SLT green/blue theme, mobile friendly.

## Two admin roles
| Role | Can do |
|---|---|
| **Super admin** (`super`) | everything: teams, rounds & rules, fixtures, schedule, users, scoring |
| **Scorer** (`scorer`) | only marks scores (live or from a hand-written sheet) |

The first super admin is created from `ADMIN_USER` / `ADMIN_PASS` in `server/.env`. Create scorers in **Admin > Users**.

## How the tournament is set up (Admin > Home shows these steps)
1. **Teams** – register teams and players (service no. is shown only to logged-in staff).
2. **Rounds** – any number: Round 1, Round 2 … n. Each round has its **own rules** (overs, balls per over, wide / no-ball runs and whether they count as a ball, points) and a format:
   - **League**: choose the number of groups and the teams of each group. Everyone in a group plays everyone once. Points table per group (points, then NRR).
   - **Knockout**: choose teams in draw order (or "Fill from the previous league round: top N"). Byes are added automatically. Winners move to the next match by themselves.
3. **Generate fixtures** for each round: the question appears right after you save a round, or use the button on the round card / in Schedule (you can also add one league match by hand in Schedule).
4. **Schedule** – date, time, pitch per match, or "Fill automatically" over several pitches.
5. **Scoring** – see below.

## Scoring (super admin or scorer)
Wizard: who scores → toss → live or hand-written sheet → rules (round default, or special for this match).
- **Live**: pick batter + bowler, tap the ball (normal / wide / no ball / bye / leg bye + runs). **OUT** asks *how* (bowled, caught, lbw, run out, stumped, hit wicket) and *who* (fielder / keeper; bowler is automatic). Undo is always available.
- **Hand-written sheet**: tap every ball of each batter, choose how out + bowler + fielder, then tap each bowler's balls. Totals are checked live.
- **Score check** (live, sheet and public scorecard): batters' runs + extras = bowlers' runs (bat + wides + no balls) + byes + leg byes = team total. A sheet cannot be saved until both sides match.
- **Second innings** shows the target and "X need N runs from B balls"; when the chase ends, "X won by …" is shown to the scorer and to the public.
- A tied **knockout** match asks for the tie-break winner.

## Scoring rules enforced by the system
- Both batters are chosen first (striker + non-striker). **Strike changes by itself**: odd runs (including runs run on wides, no balls, byes, leg byes) and the end of every over. After a wicket the next batter is chosen.
- **One bowler bowls the whole over** and cannot bowl two overs in a row (live scoring and quick entry).
- A wicket ball counts as a ball faced by the batter who got out (shown as W in his balls).
- No more balls than overs x balls per over; **no runs can be added once the chasing team has won** or the innings is over.
- Round / match rule **"Last ball of the 2nd innings counts"**: when on, a wide / no ball on the very last ball is not re-bowled; it counts as the last ball and its runs are added.
- Score check: Batsmen runs + Extras = Total = Bowlers' runs (bat + wides + no balls) + byes + leg byes.

## Public pages
Fixtures (live / upcoming / done, auto refresh) · **Draw** (decision-tree picture of the whole tournament with a *Download image* button, round-by-round view, "What's next", tap a team to highlight) · Points · Top 10 (runs, wickets, sixes, fours) · Teams · Match scorecard (batting with how out, bowling, overs, best players, rules).

## Folder structure
```
server/
  index.js                 starts the API (serves client/dist in production)
  models/                  User, Team, Round, Match
  routes/ + controllers/   one file per feature: auth, users, teams, rounds, matches, live, paper, stats
  utils/cricket.js         cricket maths (extras, overs, results, NRR, top 10)
  utils/draw.js            league fixtures, knockout bracket, qualifier order
  utils/finish.js          finishing a match, winner moves to the next match
  middleware/auth.js       login + roles (SUPER, STAFF)
client/src/
  pages/public/            Fixtures, Draw, Points, Top, Teams, MatchDetail
  pages/admin/             Login, Home, Teams, Rounds, Schedule, Users
  pages/scoring/           ScoringList, ScoringMatch (setup), Live, Paper
  components/              Layout, MatchCard, Bracket, Scorecard (batting, bowling, score check), BallPad ...
```

## Install and run
1. Install **Node.js 18+** and **MongoDB** (Community or a free Atlas cluster).
2. `cd server && cp .env.example .env` and edit `MONGO_URI`, a long `JWT_SECRET`, `ADMIN_USER`, `ADMIN_PASS`.
3. `npm install` in `server/` and in `client/`.
4. Development: `npm run dev` in `server/` (port 5000) and `npm run dev` in `client/` (port 5173, proxies /api). Open http://localhost:5173
5. Production: `npm run build` in `client/`, then `npm start` in `server/` and open http://localhost:5000

Upgrading from the earlier version: old `admin` users become `super` automatically; old `settings` / `scorers` collections are no longer used (drop them), and old matches without rounds should be recreated.
