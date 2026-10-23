import { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import { useApp } from '../../context/AppContext';
import useGet from '../../lib/useGet';
import BallChips from '../../components/BallChips';
import BallPad from '../../components/BallPad';
import RunPad from '../../components/RunPad';
import Crease from '../../components/Crease';
import WicketModal from '../../components/WicketModal';
import Modal from '../../components/Modal';
import { Pick, Loading, Badge } from '../../components/ui';
import { Reconcile } from '../../components/Scorecard';
import { ov, dismissal, OUTS, plural, tokenInfo, localSum, lastBallMark, afterBall, overStateOf } from '../../lib/cricket';

const OUTP = [['not out', 'Not out'], ...OUTS], KILL = ['bowled', 'caught', 'lbw', 'stumped', 'hit wicket'];
const empty = () => ({ sl: { s: '', n: '' }, bsel: '', log: [] });

// Scoring from the hand-written sheet.
//  A) Quick entry: follow the sheet ball by ball (two batters, bowler, tap) and strike changes by itself, or
//  B) fill each batter / each bowler by hand. Both fill the same sheet. Totals are checked, extra balls / runs are blocked.
export default function Paper({ m0, onDone }) {
  const { act, ask, toast } = useApp(), [teams] = useGet('/teams?category=' + m0.category);
  const [m, setM] = useState(m0), [i, setI] = useState(m0.innings[0].closed ? 1 : 0);
  const [dr, setDr] = useState(() => m0.innings.map(I => ({
    bat: Object.fromEntries(I.batters.map(b => [b.name, { seq: [...b.seq], out: b.out || 'not out', bowler: b.bowler || '', fielder: b.fielder || '' }])),
    bowl: Object.fromEntries(I.bowlers.map(w => [w.name, [...w.marks]])) })));
  const [hs, setHs] = useState([empty(), empty()]), [hist, setHist] = useState([]), [wk, setWk] = useState(false);
  const [open, setOpen] = useState(''), [sum, setSum] = useState(null), [err, setErr] = useState(''), [tie, setTie] = useState(false), [busy, setBusy] = useState(false);
  const d = dr[i], I = m.innings[i], O = m.innings[1 - i], R = m.rules, bpo = m.ballsPerOver, total = m.overs * bpo, h = hs[i];
  const body = () => ({
    batters: Object.entries(d.bat).filter(([, b]) => b.seq.length || b.out !== 'not out').map(([name, b]) => ({ name, ...b })),
    bowlers: Object.entries(d.bowl).filter(([, w]) => w.length).map(([name, marks]) => ({ name, marks })) });
  const key = JSON.stringify([i, d]), seq = useRef(0);
  useEffect(() => {   // check the totals with the server while marking
    const n = ++seq.current, t = setTimeout(async () => {
      try { const r = await api(`/paper/${m._id}/innings/${i}/preview`, 'POST', body()); if (n === seq.current) { setSum(r); setErr('') } } catch (e) { if (n === seq.current) setErr(e.message) } }, 350);
    return () => clearTimeout(t);   // eslint-disable-next-line
  }, [key]);
  if (!teams) return <Loading />;

  const players = id => teams.find(x => x._id === id)?.players || [];
  const bats = players(I.team._id), bowls = players(O.team._id);
  const first = m.innings[0].closed ? m.innings[0].sum : null, target = first ? first.runs + 1 : null;
  const loc = localSum(d.bat, d.bowl, R);
  const ended = loc.balls >= total || loc.wickets >= I.team.size - 1, won = i === 1 && !!first && loc.runs >= target, blocked = ended || won;

  // ---- editing helpers ----
  const setD = fn => { setHist([]); setDr(dr.map((x, j) => j === i ? fn(x) : x)) };
  const B = n => d.bat[n] || { seq: [], out: 'not out', bowler: '', fielder: '' };
  const setB = (n, o) => setD(x => ({ ...x, bat: { ...x.bat, [n]: { ...B(n), ...o } } }));
  const stop = () => toast(won ? `${I.team.name} have reached the target. No more runs can be added.` : 'The innings is complete (all overs bowled or all out). No more balls can be added.', 'err');
  const addBall = (n, t) => { if (blocked) return stop(); if (B(n).seq.slice(-1)[0] === 'W') return toast(n + ' is already out', 'err'); setB(n, { seq: [...B(n).seq, t] }) };
  const undoBall = n => { const q = B(n).seq.slice(0, -1); setB(n, { seq: q, out: B(n).seq.slice(-1)[0] === 'W' ? 'not out' : B(n).out, bowler: B(n).seq.slice(-1)[0] === 'W' ? '' : B(n).bowler, fielder: B(n).seq.slice(-1)[0] === 'W' ? '' : B(n).fielder }) };
  const setOut = (n, v) => {   // the ball he got out on counts as a ball he faced ("W")
    const b = B(n); const q = [...b.seq]; if (q.slice(-1)[0] === 'W') q.pop();
    if (KILL.includes(v)) { if (loc.balls >= total && b.out === 'not out') return stop(); q.push('W') }
    setB(n, { out: v, seq: q, bowler: v === 'run out' || v === 'not out' ? '' : b.bowler, fielder: ['caught', 'stumped', 'run out'].includes(v) ? b.fielder : '' });
  };
  const addMark = (n, t) => { if (blocked) return stop(); setD(x => ({ ...x, bowl: { ...x.bowl, [n]: [...(x.bowl[n] || []), lastBallMark(t, R, i, loc.balls, total)] } })) };
  const undoMark = n => setD(x => ({ ...x, bowl: { ...x.bowl, [n]: (x.bowl[n] || []).slice(0, -1) } }));
  const dropBowler = n => setD(x => { const b = { ...x.bowl }; delete b[n]; return { ...x, bowl: b } });

  // ---- A) quick entry ----
  const os = overStateOf(h.log, bpo, R), lock = os.bowler, hb = lock || h.bsel;
  const setH = o => setHs(hs.map((x, j) => j === i ? { ...x, ...o } : x));
  const avail = bats.filter(p => B(p.name).out === 'not out');
  const stat = n => d.bat[n] ? `${d.bat[n].seq.reduce((a, t) => a + (t === 'W' ? 0 : +t), 0)} (${d.bat[n].seq.length})` : 'yet to bat';
  const ball = (token0, w) => {
    if (blocked) return stop();
    if (!h.sl.s || !h.sl.n) return toast('Choose both batters first', 'err');
    if (!hb) return toast('Choose the bowler first', 'err');
    const token = lastBallMark(token0, R, i, loc.balls, total), info = tokenInfo(token, R);
    setHist([...hist, { dr, hs }]);
    const log = [...h.log, { bowler: hb, token }], ns = overStateOf(log, bpo, R), overDone = !!os.bowler && !ns.bowler || (!os.bowler && !ns.bowler && info.legal && bpo === 1);
    setDr(dr.map((x, j) => {
      if (j !== i) return x; const bat = { ...x.bat }, bowl = { ...x.bowl }; const get = n => bat[n] || { seq: [], out: 'not out', bowler: '', fielder: '' };
      bowl[hb] = [...(bowl[hb] || []), token];
      if (info.faced) { const b = get(h.sl.s); bat[h.sl.s] = { ...b, seq: [...b.seq, info.wicket ? 'W' : String(info.bat)] } }
      if (w && w.kind !== 'run out') bat[h.sl.s] = { ...bat[h.sl.s], out: w.kind, bowler: hb, fielder: w.fielder || '' };
      if (w && w.kind === 'run out') bat[w.out] = { ...get(w.out), out: 'run out', bowler: '', fielder: w.fielder || '' };
      return { ...x, bat, bowl };
    }));
    const sl = afterBall(h.sl, token, R, w ? w.out : null, overDone);
    setHs(hs.map((x, j) => j === i ? { sl, bsel: overDone ? '' : x.bsel, log } : x));
    if (overDone) toast('Over complete. Strike changes. Choose the next bowler.');
  };
  const undoQuick = () => { const p = hist[hist.length - 1]; if (!p) return; setDr(p.dr); setHs(p.hs); setHist(hist.slice(0, -1)) };

  // ---- result while marking the 2nd innings ----
  let chase = null;
  if (i === 1 && first) {
    const left = total - loc.balls;
    if (won) chase = { win: true, text: `${I.team.name} won by ${plural(Math.max(I.team.size - 1 - loc.wickets, 0), 'wicket')}${left > 0 ? ` (${plural(left, 'ball')} left)` : ''}` };
    else if (ended) chase = { win: true, text: loc.runs === first.runs ? 'Match tied' : `${O.team.name} won by ${plural(first.runs - loc.runs, 'run')}` };
    else chase = { win: false, text: `${I.team.name} need ${plural(target - loc.runs, 'more run')} to win from ${plural(left, 'ball')}` };
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
  const view = sum && { team: I.team, sum };

  return <>
    <div className="seg2" role="tablist">{m.innings.map((x, j) => <button key={j} role="tab" aria-pressed={i === j} className={i === j ? 'on' : ''} disabled={j === 1 && !m.innings[0].closed} onClick={() => { setI(j); setOpen(''); setHist([]) }}>
      {j + 1}{j ? 'nd' : 'st'} innings · {x.team.name} {x.closed && '✓'}</button>)}</div>
    {bothSaved && <div className="card wonbanner"><div className="bigstatus won">🏆 {m.outcome?.text}</div><button className="p lg" onClick={() => finish()}>✓ Finish match & publish result</button></div>}

    <div className="scorebar"><div className="row"><span>{I.team.name} batting</span>{I.closed && <span className="chip done">Saved</span>}</div>
      <div className="bigscore">{loc.runs}/{loc.wickets} <small>({ov(loc.balls, bpo)}/{m.overs} ov)</small></div>
      {i === 1 && first && <div className="chasebar">Target {target} · {chase && <b>{chase.text}</b>}</div>}
      {i === 1 && !first && <div className="warn">Save the 1st innings first.</div>}</div>
    {chase?.win && <div className="card wonbanner"><div className="bigstatus won">🏆 {chase.text}</div></div>}
    {blocked && <div className="hint">{won ? 'The target is reached, so no more runs can be added to the batters.' : `All ${plural(total, 'ball')} are used or the team is all out. No more balls can be added.`} You can still undo or edit.</div>}

    <details className="card" open><summary><b>A · Quick entry: follow the sheet ball by ball</b></summary>
      <p className="mut small">Choose the two batters and the bowler, then tap each ball in the order of the sheet. Strike changes by itself. The batters' and bowlers' sheets below are filled for you.</p>
      <Crease sl={h.sl} setSl={sl => setH({ sl })} avail={avail} stat={stat} disabled={blocked} />
      <h4>2 · Bowler</h4>
      {lock && <div className="hint">🔒 <b>{lock}</b> is bowling this over ({os.left} ball{os.left === 1 ? '' : 's'} left).</div>}
      <Pick value={hb} onChange={v => setH({ bsel: v })} items={bowls.map(p => ({ v: p.name, l: p.name, off: lock ? p.name !== lock : p.name === os.last }))} />
      <h4>3 · Ball</h4>
      <BallPad rules={R} disabled={blocked} onBall={t => ball(t)} onWicket={() => { if (blocked) return stop(); if (!h.sl.s || !h.sl.n || !hb) return toast('Choose the batters and the bowler first', 'err'); setWk(true) }} />
      <button onClick={undoQuick} disabled={!hist.length}>↶ Undo last ball (quick entry)</button></details>

    <div className="card"><h4>B · Batters of {I.team.name} <small className="mut">tap a batter to fill or correct</small></h4>
      {bats.map(p => { const b = B(p.name), r = b.seq.reduce((a, t) => a + (t === 'W' ? 0 : +t), 0), isOpen = open === p.name, used = b.seq.length || b.out !== 'not out'; return <div key={p.name} className={'prec' + (isOpen ? ' open' : '')}>
        <button className="phead" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? '' : p.name)}><Badge name={p.name} size={30} /><span className="tn">{p.name}<small className="mut">{used ? dismissal(b) : 'did not bat'}</small></span><b>{used ? `${r} (${b.seq.length})` : '—'}</b><span>{isOpen ? '▴' : '▾'}</span></button>
        {isOpen && <div className="pbody">
          <RunPad disabled={blocked} onTap={t => addBall(p.name, t)} /><div className="row"><BallChips marks={b.seq} /><button onClick={() => undoBall(p.name)} disabled={!b.seq.length}>⌫ Undo ball</button></div>
          <span className="lbl">How out?</span><Pick cls="small" value={b.out} onChange={v => setOut(p.name, v)} items={OUTP.map(([v, l]) => ({ v, l }))} />
          {KILL.includes(b.out) && <div className="mut small">The ball he got out on is counted as a ball he faced (W).</div>}
          {b.out !== 'not out' && b.out !== 'run out' && <><span className="lbl">Bowler who took the wicket</span><Pick cls="small" value={b.bowler} onChange={v => setB(p.name, { bowler: v })} items={pl(bowls)} /></>}
          {['caught', 'stumped', 'run out'].includes(b.out) && <><span className="lbl">{b.out === 'caught' ? 'Caught by' : b.out === 'stumped' ? 'Stumped by' : 'Run out by (fielder)'}</span><Pick cls="small" value={b.fielder} onChange={v => setB(p.name, { fielder: v })} items={pl(bowls)} /></>}
        </div>}</div> })}</div>

    <div className="card"><h4>C · Bowlers of {O.team.name} <small className="mut">add the bowlers and tap every ball they bowled</small></h4>
      {Object.entries(d.bowl).map(([n, marks]) => { const w = sum?.bowl.find(x => x.name === n); return <div className="prec open" key={n}>
        <div className="phead"><Badge name={n} size={30} /><span className="tn">{n}<small className="mut">{w ? `${ov(w.balls, bpo)} ov · ${w.runs} runs · ${w.wk} wkt` : ''}</small></span><button className="danger-o" onClick={() => dropBowler(n)} aria-label={'Remove ' + n}>✕</button></div>
        <div className="pbody"><BallChips marks={marks} /><BallPad rules={R} disabled={blocked} onBall={t => addMark(n, t)} onWicket={() => addMark(n, 'W')} /><button onClick={() => undoMark(n)} disabled={!marks.length}>⌫ Undo ball</button></div></div> })}
      <span className="lbl">Add a bowler</span><div className="pick small">{bowls.filter(p => !(p.name in d.bowl)).map(p => <button key={p.name} className="pk" onClick={() => setD(x => ({ ...x, bowl: { ...x.bowl, [p.name]: [] } }))}>+ {p.name}</button>)}</div></div>

    <div className="card"><h4>Check</h4>{err && <div className="warn">⚠ {err}</div>}
      {view && <><div className="total"><span>Batters {sum.bat} + extras {sum.extras.total}</span><b>= {sum.runs}/{sum.wickets}</b></div><Reconcile I={view} open /></>}
      {sum && sum.mismatch && <div className="warn">The runs of the batters and the runs given by the bowlers must be equal. Difference: {Math.abs(sum.diff)}. Fix the marks, then save.</div>}
      <button className="p lg" disabled={!sum || sum.mismatch || !!err || busy || (i === 1 && !first)} onClick={save}>{I.closed ? 'Save changes to innings ' + (i + 1) : `Save innings ${i + 1}`}</button></div>
    {wk && <WicketModal striker={h.sl.s} nonStriker={h.sl.n} bowler={hb} bowls={bowls} onClose={() => setWk(false)} onConfirm={w => { ball(w.token, { kind: w.kind, out: w.kind === 'run out' ? w.out : h.sl.s, fielder: w.fielder }); setWk(false) }} />}
    {tie && <Modal title="Match tied: who wins the tie-break?" onClose={() => setTie(false)}><Pick cls="big2" value="" onChange={v => finish(v)} items={m.innings.map(x => ({ v: x.team._id, l: x.team.name }))} /></Modal>}
  </>;
}
