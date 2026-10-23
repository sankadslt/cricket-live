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

// ---- ball marks (same rules as the server) ----
const TOK = /^(?:(\d)|(W)|(Wd)(\d?)|(Nb)(\d?)|(B)(\d)|(L)(\d))(!)?$/i;
// what one ball means: legal = uses up a ball of the over, run = runs physically run (changes strike if odd),
// bat = runs for the batter, extra = runs for extras, faced = the batter faced the ball (not for a wide)
export function tokenInfo(t, R) {
  const m = TOK.exec(String(t).trim()); if (!m) return null;
  const o = { legal: true, run: 0, bat: 0, extra: 0, wicket: !!m[2], faced: true };
  if (m[1] !== undefined) { o.run = o.bat = +m[1] }
  else if (m[3]) { const n = +m[4] || 0; o.extra = R.wideRuns + n; o.run = n; o.legal = !!(R.wideBall || m[11]); o.faced = false }
  else if (m[5]) { const n = +m[6] || 0; o.extra = R.noBallRuns; o.bat = n; o.run = n; o.legal = !!(R.noBallBall || m[11]) }
  else if (m[7]) { o.extra = +m[8]; o.run = +m[8] }
  else if (m[9]) { o.extra = +m[10]; o.run = +m[10] }
  return o;
}
// totals of a paper draft ({bat:{name:{seq,out}}, bowl:{name:[marks]}}) so the screen can stop extra balls at once
export function localSum(bat, bowl, R) {
  let b = 0, ex = 0, balls = 0, wk = 0;
  for (const x of Object.values(bat)) { b += x.seq.reduce((a, t) => a + (t === 'W' ? 0 : +t), 0); if (x.out !== 'not out') wk++ }
  for (const marks of Object.values(bowl)) for (const t of marks) { const i = tokenInfo(t, R); if (!i) continue; ex += i.extra; if (i.legal) balls++ }
  return { runs: b + ex, balls, wickets: wk, bat: b, extras: ex };
}
// on the last ball of the 2nd innings a wide / no ball can be made to count (rule "lastBallCounts"): the mark gets a "!"
export const lastBallMark = (t, R, innIndex, balls, total) => R.lastBallCounts && innIndex === 1 && /^(Wd|Nb)/i.test(t) && !t.endsWith('!') && balls === total - 1 ? t + '!' : t;
// strike rotation. sl = {s: striker, n: non-striker}. Odd runs swap the batters; the end of an over swaps them again.
export function afterBall(sl, token, R, out, overDone) {
  const info = tokenInfo(token, R) || { run: 0 }; let { s, n } = sl;
  if (info.run % 2 === 1) [s, n] = [n, s];
  if (out) { if (s === out) s = ''; else if (n === out) n = '' }
  if (overDone) [s, n] = [n, s];
  return { s, n };
}
// who is bowling the current over / left in it / who bowled the last one. log = [{bowler, token}]
export function overStateOf(log, bpo, R) {
  let bowler = '', legal = 0, last = '';
  for (const b of log) { if (!bowler) { bowler = b.bowler; legal = 0 } if (tokenInfo(b.token, R)?.legal) legal++; if (legal >= bpo) { last = bowler; bowler = ''; legal = 0 } }
  return { bowler, left: bowler ? bpo - legal : 0, last };
}
