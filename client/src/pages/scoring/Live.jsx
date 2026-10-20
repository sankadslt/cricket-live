import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useApp } from '../../context/AppContext';
import useGet from '../../lib/useGet';
import BallPad from '../../components/BallPad';
import BallChips from '../../components/BallChips';
import Modal from '../../components/Modal';
import { Pick, Loading } from '../../components/ui';
import { Reconcile } from '../../components/Scorecard';
import { ov, econ, dismissal, inningsOver, OUTS } from '../../lib/cricket';

// Ball-by-ball scoring. 1) pick batter + bowler  2) tap the ball  3) OUT asks how and who.
export default function Live({ m0, onDone }) {
  const { act, ask, toast } = useApp(), [m, setM] = useState(m0), [teams] = useGet('/teams?category=' + m0.category);
  const [striker, setStriker] = useState(''), [bowler, setBowler] = useState(''), [wk, setWk] = useState(null), [tie, setTie] = useState(false), [busy, setBusy] = useState(false), [W, setW] = useState({ kind: '', out: '', fielder: '', runs: 0 });
  const over0 = inningsOver(m, 0), inn = over0 ? 1 : 0, over1 = over0 && (inningsOver(m, 1) || m.outcome?.over), I = m.innings[inn], bpo = m.ballsPerOver, s = I.sum;
  const matchOver = over1, innDone = inningsOver(m, inn);
  useEffect(() => { setStriker(''); setBowler('') }, [inn]);
  if (!teams) return <Loading />;
  const players = id => teams.find(x => x._id === id)?.players || [];
  const bats = players(I.team._id), bowls = players(m.innings[1 - inn].team._id);
  const outNames = I.batters.filter(b => b.out !== 'not out').map(b => b.name), avail = bats.filter(p => !outNames.includes(p.name));
  const bStat = n => I.batters.find(b => b.name === n), wStat = n => s.bowl.find(b => b.name === n);
  const bowlerOvers = wStat(bowler)?.overs || [], lastOver = bowlerOvers[bowlerOvers.length - 1];

  const send = async (token, extra = {}) => {
    if (innDone) return toast('This innings is complete', 'err');
    if (!striker) return toast('Select the batter first', 'err');
    if (!bowler) return toast('Select the bowler first', 'err');
    setBusy(true); const before = s.balls;
    const r = await act(() => api(`/live/${m._id}/ball`, 'POST', { inn, striker, bowler, token, ...extra })); setBusy(false);
    if (!r || !r._id) return false;
    setM(r); const ns = r.innings[inn].sum;
    if (extra.kind) { setStriker(extra.out === striker ? '' : striker) }
    if (ns.balls > before && ns.balls % bpo === 0 && !inningsOver(r, inn)) { setBowler(''); toast('Over complete. Choose the next bowler.') }
    if (inningsOver(r, inn)) { setStriker(''); setBowler('') }
    return true;
  };
  const undo = async () => { const r = await act(() => api(`/live/${m._id}/undo`, 'POST')); if (r?._id) setM(r) };
  const finish = async tw => {
    if (!tw && m.outcome?.over && !m.outcome.winner && m.round?.format === 'knockout') return setTie(true);
    if (!tw && !await ask({ title: 'Finish the match?', text: m.outcome?.text, ok: 'Finish match' })) return;
    const r = await act(() => api(`/live/${m._id}/finish`, 'POST', { tieWinner: tw }), 'Match finished'); if (r) { setTie(false); onDone() }
  };

  const openWk = () => { if (!striker || !bowler) return toast('Select the batter and the bowler first', 'err'); setW({ kind: '', out: striker, fielder: '', runs: 0 }); setWk(true) };
  const needF = ['caught', 'stumped', 'run out'].includes(W.kind), wkOk = W.kind && (!needF || W.fielder) && W.out;
  const confirmWk = async () => { const ok = await send(W.kind === 'run out' ? String(W.runs) : 'W', { kind: W.kind, out: W.kind === 'run out' ? W.out : striker, fielder: W.fielder }); if (ok) setWk(null) };
  const crr = s.balls ? (s.runs * bpo / s.balls).toFixed(2) : '0.00';
  const total = m.overs * m.ballsPerOver, target = m.innings[0].sum.runs + 1;
  const pls = ps => ps.map(p => ({ v: p.name, l: p.name, sub: p.role === 'Keeper' ? 'keeper' : '' }));

  return <>
    <div className="scorebar" aria-live="polite">
      <div className="row"><span>{I.team.name} · {inn ? '2nd' : '1st'} innings</span><span className="chip live">LIVE</span></div>
      <div className="bigscore">{s.runs}/{s.wickets} <small>({ov(s.balls, bpo)}/{m.overs} ov · RR {crr})</small></div>
      {inn === 1 && !matchOver && <div className="chasebar">Target {target} · <b>{m.outcome?.text}</b>{m.outcome?.left > 0 && <> · RRR {((target - s.runs) * bpo / Math.max(m.outcome.left, 1)).toFixed(2)}</>}</div>}
      {inn === 0 && <div className="mut">{total - s.balls} balls left in this innings</div>}
    </div>

    {matchOver && <div className="card wonbanner"><div className="bigstatus won">🏆 {m.outcome?.text}</div>
      <div className="mut">{m.innings.map(x => `${x.team.name} ${x.sum.runs}/${x.sum.wickets}`).join('  ·  ')}</div>
      <button className="p lg" onClick={() => finish()}>✓ Finish match & publish result</button><button onClick={undo}>↶ Undo last ball</button></div>}
    {over0 && inn === 1 && s.balls === 0 && !matchOver && <div className="card hintcard">1st innings complete: <b>{m.innings[0].team.name} {m.innings[0].sum.runs}/{m.innings[0].sum.wickets}</b>. <b>{I.team.name}</b> need <b>{target}</b> runs to win from {total} balls. Choose the batter and bowler to start the 2nd innings.</div>}

    {!matchOver && <>
      <div className="card"><h4>1 · Batter on strike <small className="mut">({outNames.length} out)</small></h4>
        <Pick value={striker} onChange={setStriker} items={avail.map(p => { const b = bStat(p.name); return { v: p.name, l: p.name, sub: b ? `${b.runs} (${b.balls})` : 'yet to bat' } })} />
        <h4>2 · Bowler</h4><Pick value={bowler} onChange={setBowler} items={bowls.map(p => { const w = wStat(p.name); return { v: p.name, l: p.name, sub: w ? `${ov(w.balls, bpo)}-${w.runs}-${w.wk}` : '', off: false } })} />
        {lastOver && <div className="thisover"><span className="mut">{bowler}'s over {lastOver.no}:</span> <BallChips marks={lastOver.marks} /></div>}</div>
      <div className="card"><h4>3 · Ball</h4><BallPad rules={m.rules} onBall={send} onWicket={openWk} disabled={busy || innDone} />
        <div className="row"><button onClick={undo} disabled={busy || (s.balls === 0 && !s.bowl.length)}>↶ Undo last ball</button>{innDone && !matchOver && <span className="warn">Innings complete</span>}</div></div></>}

    <div className="card"><h4>Batters <small className="mut">(runs scored by each batter)</small></h4>
      {I.batters.map(b => <div className="brow" key={b.name}><div className="bn"><b>{b.name}</b><div className="mut">{dismissal(b)}</div></div><div className="bs"><b>{b.runs}</b><small> ({b.balls})</small></div><div className="bm"><span className="f4">4s {b.fours}</span><span className="s6">6s {b.sixes}</span></div></div>)}
      {!I.batters.length && <p className="mut">No balls yet.</p>}
      <div className="extras"><b>Extras {s.extras.total}</b><span> wides {s.extras.wd} · no balls {s.extras.nb} · byes {s.extras.bye} · leg byes {s.extras.lb}</span></div>
      <div className="total"><span>Batters {s.bat} + Extras {s.extras.total}</span><b>= {s.runs}/{s.wickets}</b></div></div>
    <div className="card"><h4>Bowlers <small className="mut">(runs given by each bowler)</small></h4>
      {s.bowl.map(w => <div className="brow" key={w.name}><div className="bn"><b>{w.name}</b><div className="mut">wd {w.wd} · nb {w.nb} · bye {w.bye} · lb {w.lb} · econ {econ(w.runs, w.balls, bpo)}</div></div><div className="bs"><b>{w.wk}/{w.runs}</b><small> ({ov(w.balls, bpo)})</small></div></div>)}
      {!s.bowl.length && <p className="mut">No balls yet.</p>}
      <div className="total"><span>Bowlers {s.bowlRuns} + byes {s.extras.bye} + leg byes {s.extras.lb}</span><b>= {s.bowlRuns + s.extras.bye + s.extras.lb}</b></div></div>
    <Reconcile I={I} />

    {wk && <Modal title="Wicket" onClose={() => setWk(null)}>
      <span className="lbl">How was the batter out?</span>
      <Pick value={W.kind} onChange={v => setW({ ...W, kind: v, fielder: v === 'caught' && W.fielder === '' ? '' : W.fielder, out: v === 'run out' ? W.out : striker })} items={OUTS.map(([v, l]) => ({ v, l }))} />
      {W.kind === 'run out' && <><span className="lbl">Who is run out?</span><Pick value={W.out} onChange={v => setW({ ...W, out: v })} items={avail.map(p => ({ v: p.name, l: p.name }))} />
        <span className="lbl">Runs completed before the run out</span><Pick value={W.runs} onChange={v => setW({ ...W, runs: v })} cls="small" items={[0, 1, 2, 3].map(n => ({ v: n, l: String(n) }))} /></>}
      {needF && <><span className="lbl">{W.kind === 'caught' ? 'Who took the catch?' : W.kind === 'stumped' ? 'Who did the stumping?' : 'Who ran him out (fielder)?'}</span>
        <Pick value={W.fielder} onChange={v => setW({ ...W, fielder: v })} items={pls(bowls)} />{W.kind === 'caught' && W.fielder === bowler && <div className="mut small">Caught & bowled</div>}</>}
      {W.kind && W.kind !== 'run out' && <div className="hint">Wicket goes to bowler <b>{bowler}</b>. Out: <b>{striker}</b>{W.fielder && <> · {W.kind === 'stumped' ? 'st' : 'c'} <b>{W.fielder}</b></>}</div>}
      {W.kind === 'run out' && <div className="hint">No wicket for the bowler. {W.out} run out{W.fielder && <> by <b>{W.fielder}</b></>} after {W.runs} run(s).</div>}
      <div className="actions"><button onClick={() => setWk(null)}>Cancel</button><button className="danger" disabled={!wkOk || busy} onClick={confirmWk}>Confirm wicket</button></div></Modal>}
    {tie && <Modal title="Match tied: who wins the tie-break?" onClose={() => setTie(false)}>
      <p className="mut">A knockout match needs a winner (super over, bowl-out or toss). Select the team that won.</p>
      <Pick cls="big2" value="" onChange={v => finish(v)} items={m.innings.map(x => ({ v: x.team._id, l: x.team.name }))} /></Modal>}
  </>;
}
