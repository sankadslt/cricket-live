# MongoDB collections (4)

## users  (staff logins)
`username` (unique), `passwordHash`, `role` (`super` | `scorer`), `name`, `serviceNo`

## teams
`name`, `category` (`boys` | `girls`), `players[] { name, serviceNo, role }`

## rounds  (Round 1..n of a category, each with its own rules)
`category`, `no`, `name`, `format` (`league` | `knockout`), `overs`, `ballsPerOver`,
`rules { wideRuns, noBallRuns, wideBall, noBallBall }`, `points { win, tie, loss }`,
`groups[] { name, teams[] }` (league), `teams[]` (knockout draw order)

## matches
`no` (unique), `category`, `round`, `group`, `label` (Group A / Playoff / Semi-final / Final), `koRound`,
`teamA`, `teamB` (empty until known), `srcA`, `srcB` (match whose winner plays here),
`date`, `time`, `pitch`, `status` (`scheduled` | `live` | `done`), `scorer` (user), `scoringMode` (`live` | `paper`), `rulesMode` (`default` | `special`),
`toss { winner, elected }`, `tieWinner`, `overs`, `ballsPerOver`, `rules`,
`innings[2] { team, batters[ {name, seq[], runs, balls, fours, sixes, out, fielder, bowler} ], bowlers[ {name, marks[]} ], source, closed }`,
`log[]` (live ball log: inn, striker, bowler, token, out, kind, fielder)

Ball marks: `0-6` runs off the bat, `W` wicket, `Wd`/`Wd2` wide (+runs), `Nb`/`Nb4` no ball (+bat runs), `B1` bye, `L1` leg bye.
