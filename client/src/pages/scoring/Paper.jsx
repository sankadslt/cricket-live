import { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import { useApp } from '../../context/AppContext';
import useGet from '../../lib/useGet';
import BallChips from '../../components/BallChips';
import BallPad from '../../components/BallPad';
import RunPad from '../../components/RunPad';
import Modal from '../../components/Modal';
import { Pick, Loading, Badge } from '../../components/ui';
import { Reconcile } from '../../components/Scorecard';
import { ov, dismissal, OUTS, plural } from '../../lib/cricket';

const OUTP = [['not out', 'Not out'], ...OUTS];
// Scoring from the hand-written sheet: 1) each batter's balls, how out, who  2) each bowler's balls  3) check totals  4) save the innings
export default function Paper({ m0, onDone }) {
  const { act, ask, toast } = useApp(), [teams] = useGet('/teams?category=' + m0.category);
  const [m, setM] = useState(m0), [i, setI] = useState(m0.innings[0].closed ? (m0.innings[1].closed ? 1 : 1) : 0);
  const [dr, setDr] = useState(() => m0.innings.map(I => ({
    bat: Object.fromEntries(I.batters.map(b => [b.name, { seq: [...b.seq], out: b.out || 'not out', bowler: b.bowler || '', fielder: b.fielder || '' }])),
    bowl: Object.fromEntries(I.bowlers.map(w => [w.name, [...w.marks]])) })));
  const [open, setOpen] = useState(''), [sum, setSum] = useState(null), [err, setErr] = useState(''), [tie, setTie] = useState(false), [busy, setBusy] = useState(false);
  const d = dr[i], I = m.innings[i], O = m.innings[1 - i];
  const body = () => ({
    batters: Object.entries(d.bat).filter(([, b]) => b.seq.length || b.out !== 'not out').map(([name, b]) => ({ name, ...b })),
    bowlers: Object.entries(d.bowl).filter(([, w]) => w.length).map(([name, marks]) => ({ name, marks })) });
  const key = JSON.stringify([i, d]);
  const seq = useRef(0);
  useEffect(() => {   // live check of the totals while marking
    const n = ++seq.current, h = setTimeout(async () => {
      try { const r = await api(`/paper/${m._id}/innings/${i}/preview`, 'POST', body()); if (n === seq.current) { setSum(r); setErr('') } } catch (e) { if (n === seq.current) setErr(e.message) } }, 350);
    return () => clearTimeout(h);   // eslint-disable-next-line
  }, [key]);
  if (!teams) return <Loading />;
  const players = id => teams.find(x => x._id === id)?.players || [];
  const bats = players(I.team._id), bowls = players(O.team._id);
  const setD = fn => setDr(dr.map((x, j) => j === i ? fn(x) : x));
  const B = n => d.bat[n] || { seq: [], out: 'not out', bowler: '', fielder: '' };
  const setB = (n, o) => setD(x => ({ ...x, bat: { ...x.bat, [n]: { ...B(n), ...o } } }));
  const addBall = (n, t) => setB(n, { seq: [...B(n).seq, t] });
  const undoBall = n => setB(n, { seq: B(n).seq.slice(0, -1) });
  const addMark = (n, t) => setD(x => ({ ...x, bowl: { ...x.bowl, [n]: [...(x.bowl[n] || []), t] } }));
  const undoMark = n => setD(x => ({ ...x, bowl: { ...x.bowl, [n]: (x.bowl[n] || []).slice(0, -1) } }));
  const dropBowler = n => setD(x => { const b = { ...x.bowl }; delete b[n]; return { ...x, bowl: b } });
  const total = m.overs * m.ballsPerOver, bpo = m.ballsPerOver;
  const first = m.innings[0].closed ? m.innings[0].sum : null, target = first ? first.runs + 1 : null;
  const view = sum && { team: I.team, sum };

  // result text while marking the 2nd innings
  let chase = null;
  if (i === 1 && sum && first) {
    const left = total - sum.balls, fin = sum.balls >= total || sum.wickets >= I.team.size - 1;
    if (sum.runs >= target) chase = { win: true, text: `${I.team.name} won by ${plural(Math.max(I.team.size - 1 - sum.wickets, 0), 'wicket')}${left > 0 ? ` (${plural(left, 'ball')} left)` : ''}` };
    else if (fin) chase = { win: true, text: sum.runs === first.runs ? 'Match tied' : `${O.team.name} won by ${plural(first.runs - sum.runs, 'run')}` };
    else chase = { win: false, text: `${I.team.name} need ${plural(target - sum.runs, 'more run')} to win from ${plural(left, 'ball')}` };
  }
  const save = async () => {
    if (sum.wkMismatch && !await ask({ title: 'Wickets do not match', text: 'The wickets given to bowlers differ from the batters marked out. Save anyway?', ok: 'Save anyway' })) return;
    setBusy(true); const r = await act(() => api(`/paper/${m._id}/innings/${i}`, 'PUT', body()), `Innings ${i + 1} saved`); setBusy(false);
    if (r?._id) { setM(r); if (i === 0) { setI(1); setOpen(''); toast('Now enter the 2nd innings') } }
  };
  const finish = async tw => {
    if (!tw && m.outcome?.over && !m.outcome.winner && m.round?.format === 'knockout') return setTie(true);
    if (!tw && !await ask({ title: 'Finish the match?', text: m.outcome?.text, ok: 'Finish match' })) return;
    const r = await act(() => api(`/paper/${m._id}/finish`, 'POST', { tieWinner: tw }), 'Match finished'); if (r) { setTie(false); onDone() }
  };
  const bothSaved = m.innings.every(x => x.closed);
  const pl = ps => ps.map(p => ({ v: p.name, l: p.name }));
  const runsOf = n => B(n).seq.reduce((a, x) => a + +x, 0);

  return <>
    <div className="seg2" role="tablist">{m.innings.map((x, j) => <button key={j} role="tab" aria-pressed={i === j} className={i === j ? 'on' : ''} disabled={j === 1 && !m.innings[0].closed} onClick={() => { setI(j); setOpen('') }}>
      {j + 1}{j ? 'nd' : 'st'} innings · {x.team.name} {x.closed && '✓'}</button>)}</div>
    {bothSaved && <div className="card wonbanner"><div className="bigstatus won">🏆 {m.outcome?.text}</div><button className="p lg" onClick={() => finish()}>✓ Finish match & publish result</button></div>}

    <div className="scorebar"><div className="row"><span>{I.team.name} batting</span>{I.closed && <span className="chip done">Saved</span>}</div>
      <div className="bigscore">{sum ? `${sum.runs}/${sum.wickets}` : '–'} <small>({sum ? ov(sum.balls, bpo) : '0.0'}/{m.overs} ov)</small></div>
      {i === 1 && first && <div className="chasebar">Target {target} · {chase && <b>{chase.text}</b>}</div>}
      {i === 1 && !first && <div className="warn">Save the 1st innings first.</div>}</div>
    {chase?.win && <div className="card wonbanner"><div className="bigstatus won">🏆 {chase.text}</div></div>}

    <div className="card"><h4>1 · Batters of {I.team.name} <small className="mut">tap a batter, then tap each ball they faced</small></h4>
      {bats.map(p => { const b = B(p.name), r = runsOf(p.name), isOpen = open === p.name, used = b.seq.length || b.out !== 'not out'; return <div key={p.name} className={'prec' + (isOpen ? ' open' : '')}>
        <button className="phead" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? '' : p.name)}><Badge name={p.name} size={30} /><span className="tn">{p.name}<small className="mut">{used ? dismissal({ ...b, out: b.out }) : 'did not bat'}</small></span><b>{used ? `${r} (${b.seq.length})` : '—'}</b><span>{isOpen ? '▴' : '▾'}</span></button>
        {isOpen && <div className="pbody">
          <RunPad onTap={t => addBall(p.name, t)} /><div className="row"><BallChips marks={b.seq} /><button onClick={() => undoBall(p.name)} disabled={!b.seq.length}>⌫ Undo ball</button></div>
          <span className="lbl">How out?</span><Pick cls="small" value={b.out} onChange={v => setB(p.name, { out: v, bowler: v === 'run out' || v === 'not out' ? '' : b.bowler, fielder: ['caught', 'stumped', 'run out'].includes(v) ? b.fielder : '' })} items={OUTP.map(([v, l]) => ({ v, l }))} />
          {b.out !== 'not out' && b.out !== 'run out' && <><span className="lbl">Bowler who took the wicket</span><Pick cls="small" value={b.bowler} onChange={v => setB(p.name, { bowler: v })} items={pl(bowls)} /></>}
          {['caught', 'stumped', 'run out'].includes(b.out) && <><span className="lbl">{b.out === 'caught' ? 'Caught by' : b.out === 'stumped' ? 'Stumped by' : 'Run out by (fielder)'}</span><Pick cls="small" value={b.fielder} onChange={v => setB(p.name, { fielder: v })} items={pl(bowls)} /></>}
        </div>}</div> })}</div>

    <div className="card"><h4>2 · Bowlers of {O.team.name} <small className="mut">add the bowlers and tap every ball they bowled</small></h4>
      {Object.entries(d.bowl).map(([n, marks]) => { const w = sum?.bowl.find(x => x.name === n); return <div className="prec open" key={n}>
        <div className="phead"><Badge name={n} size={30} /><span className="tn">{n}<small className="mut">{w ? `${ov(w.balls, bpo)} ov · ${w.runs} runs · ${w.wk} wkt` : ''}</small></span><button className="danger-o" onClick={() => dropBowler(n)} aria-label={'Remove ' + n}>✕</button></div>
        <div className="pbody"><BallChips marks={marks} /><BallPad rules={m.rules} onBall={t => addMark(n, t)} onWicket={() => addMark(n, 'W')} /><button onClick={() => undoMark(n)} disabled={!marks.length}>⌫ Undo ball</button></div></div> })}
      <span className="lbl">Add a bowler</span><div className="pick small">{bowls.filter(p => !(p.name in d.bowl)).map(p => <button key={p.name} className="pk" onClick={() => setD(x => ({ ...x, bowl: { ...x.bowl, [p.name]: [] } }))}>+ {p.name}</button>)}</div></div>

    <div className="card"><h4>3 · Check</h4>{err && <div className="warn">⚠ {err}</div>}
      {view && <><div className="total"><span>Batters {sum.bat} + extras {sum.extras.total}</span><b>= {sum.runs}/{sum.wickets}</b></div><Reconcile I={view} open /></>}
      {sum && sum.mismatch && <div className="warn">The runs of the batters and the runs given by the bowlers must be equal. Difference: {Math.abs(sum.diff)}. Fix the marks, then save.</div>}
      <button className="p lg" disabled={!sum || sum.mismatch || !!err || busy || (i === 1 && !first)} onClick={save}>{I.closed ? 'Save changes to innings ' + (i + 1) : `Save innings ${i + 1}`}</button></div>
    {tie && <Modal title="Match tied: who wins the tie-break?" onClose={() => setTie(false)}><Pick cls="big2" value="" onChange={v => finish(v)} items={m.innings.map(x => ({ v: x.team._id, l: x.team.name }))} /></Modal>}
  </>;
}
