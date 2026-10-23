import { Avatar } from './ui';
import BallChips from './BallChips';
import { ov, sr, econ, dismissal, plural } from '../lib/cricket';

// Batting table of one innings: runs, balls, 4s, 6s, strike rate and HOW the batter got out
export function Batting({ I, bpo }) {
  const s = I.sum;
  return <div className="card"><div className="row"><b>{I.team.name} — batting</b><b className="ts">{s.runs}/{s.wickets} <small>({ov(s.balls, bpo)} ov)</small></b></div>
    {I.batters.map(b => <div className="brow" key={b.name}><Avatar name={b.name} size={38} />
      <div className="bn"><b>{b.name}</b><div className={'mut out-' + (b.out === 'not out' ? 'no' : 'yes')}>{dismissal(b)}</div></div>
      <div className="bs"><b>{b.runs}</b><small> ({b.balls})</small></div>
      <div className="bm"><span>SR {sr(b.runs, b.balls)}</span><span className="f4">4s {b.fours}</span><span className="s6">6s {b.sixes}</span></div></div>)}
    {!I.batters.length && <p className="mut">No batters yet.</p>}
    <div className="extras"><b>Extras {s.extras.total}</b><span> wides {s.extras.wd} · no balls {s.extras.nb} · byes {s.extras.bye} · leg byes {s.extras.lb}</span></div>
    <div className="total"><span>Total</span><b>{s.runs}/{s.wickets}</b><span className="mut">({ov(s.balls, bpo)} overs)</span></div></div>;
}

// Bowling figures per bowler + each over ball by ball
export function Bowling({ I, team, bpo }) {
  return <div className="card"><div className="row"><b>{team.name} — bowling</b></div>
    {I.sum.bowl.map(w => <div key={w.name}><div className="brow"><Avatar name={w.name} size={38} /><div className="bn"><b>{w.name}</b><div className="mut">Economy {econ(w.runs, w.balls, bpo)} · wides {w.wd} · no balls {w.nb}</div></div>
      <div className="bs"><b>{w.wk}/{w.runs}</b><small> ({ov(w.balls, bpo)})</small></div></div>
      <div className="overs">{w.overs.map(o => <div className="orow" key={o.no}><b>Over {o.no}</b><BallChips marks={o.marks} /><span className="mut">{plural(o.runs, 'run')} · {plural(o.wickets, 'wkt')}</span></div>)}</div></div>)}
    {!I.sum.bowl.length && <p className="mut">No bowlers yet.</p>}</div>;
}

// Shows the two sides of the scorebook and that they agree:
//   batters' runs + extras  =  bowlers' runs (bat runs + wides + no balls) + byes + leg byes  =  total
export function Reconcile({ I, open }) {
  const s = I.sum, e = s.extras, bowlBat = s.bat - s.diff, bowlSide = bowlBat + e.wd + e.nb + e.bye + e.lb, ok = !s.mismatch && s.bat + e.total === bowlSide;
  return <details className={'card rec ' + (ok ? 'ok' : 'bad')} open={open || !ok}><summary><b>{I.team.name} — score check</b><span className={'chip ' + (ok ? 'done' : 'live')}>{ok ? '✓ Matches' : '✗ Does not match'}</span></summary>
    <div className="rec-sum">Batsmen {s.bat} + Extras {e.total} = <b>{s.bat + e.total}</b> &nbsp;·&nbsp; Bowlers {bowlBat + e.wd + e.nb} + Byes / Leg byes {e.bye + e.lb} = <b>{bowlSide}</b></div>
    <div className="rec-g">
      <div><h4>Batters' side</h4>
        <div className="rrow"><span>Runs scored by batters</span><b>{s.bat}</b></div>
        <div className="rrow"><span>+ Wides</span><b>{e.wd}</b></div><div className="rrow"><span>+ No balls</span><b>{e.nb}</b></div>
        <div className="rrow"><span>+ Byes</span><b>{e.bye}</b></div><div className="rrow"><span>+ Leg byes</span><b>{e.lb}</b></div>
        <div className="rrow tot"><span>= Team total</span><b>{s.bat + e.total}</b></div></div>
      <div><h4>Bowlers' side</h4>
        <div className="rrow"><span>Runs off the bat (given by bowlers)</span><b>{bowlBat}</b></div>
        <div className="rrow"><span>+ Wides</span><b>{e.wd}</b></div><div className="rrow"><span>+ No balls</span><b>{e.nb}</b></div>
        <div className="rrow"><span>+ Byes</span><b>{e.bye}</b></div><div className="rrow"><span>+ Leg byes</span><b>{e.lb}</b></div>
        <div className="rrow tot"><span>= Team total</span><b>{bowlSide}</b></div></div></div>
    {!ok && <p className="warn">Batters' runs and bowlers' runs differ by {Math.abs(s.diff)}. Check the marks.</p>}
    {s.wkMismatch && <p className="warn">Wickets do not match between the batters and the bowlers.</p>}
  </details>;
}
