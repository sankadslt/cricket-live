// Small helpers for showing cricket numbers. The real calculations are on the server (server/utils/cricket.js).
export const ov = (b, p = 6) => Math.floor(b / p) + '.' + (b % p);
export const ini = n => (n || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
export const sr = (r, b) => b ? (r * 100 / b).toFixed(1) : '0.0';
export const econ = (runs, balls, bpo) => balls ? (runs / (balls / bpo)).toFixed(2) : '0.00';
export const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
export const OUTS = [
  ['bowled', 'Bowled'], ['caught', 'Caught'], ['lbw', 'LBW'], ['run out', 'Run out'], ['stumped', 'Stumped'], ['hit wicket', 'Hit wicket'],
];
// "c Fielder b Bowler" style text for a dismissed batter
export function dismissal(b) {
  const o = b.out;
  if (!o || o === 'not out') return 'not out';
  if (o === 'bowled') return `b ${b.bowler}`;
  if (o === 'lbw') return `lbw b ${b.bowler}`;
  if (o === 'hit wicket') return `hit wicket b ${b.bowler}`;
  if (o === 'caught') return b.fielder && b.fielder === b.bowler ? `c & b ${b.bowler}` : `c ${b.fielder || '?'} b ${b.bowler}`;
  if (o === 'stumped') return `st ${b.fielder || '?'} b ${b.bowler}`;
  if (o === 'run out') return `run out (${b.fielder || '?'})`;
  return o;
}
// is this innings finished? (all overs bowled, all out, or the chasing team passed the target)
export function inningsOver(m, i) {
  const I = m.innings[i]; if (!I) return false;
  const s = I.sum, total = m.overs * m.ballsPerOver;
  return s.balls >= total || s.wickets >= I.team.size - 1 || (i === 1 && s.runs > m.innings[0].sum.runs);
}
export const dateText = d => { if (!d) return 'Date to be announced'; const x = new Date(d + 'T00:00:00'); return isNaN(x) ? d : x.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) };
