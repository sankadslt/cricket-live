import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useApp } from '../../context/AppContext';
import useGet from '../../lib/useGet';
import BallPad from '../../components/BallPad';
import BallChips from '../../components/BallChips';
import Crease from '../../components/Crease';
import WicketModal from '../../components/WicketModal';
import Modal from '../../components/Modal';
import { Pick, Loading } from '../../components/ui';
import { Reconcile } from '../../components/Scorecard';
import { ov, econ, dismissal, inningsOver, afterBall } from '../../lib/cricket';

const keep = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} };
const load = k => { try { return JSON.parse(localStorage.getItem(k) || 'null') } catch { return null } };

// Ball-by-ball scoring. 1) the two batters  2) the bowler  3) tap the ball  (OUT asks how and who).
// Strike changes by itself (odd runs, end of over). One bowler bowls a whole over. Nothing can be added once the innings / match is decided.
export default function Live({ m0, onDone }) {
  const { act, ask, toast } = useApp(), [m, setM] = useState(m0), [teams] = useGet('/teams?category=' + m0.category);
  const over0 = inningsOver(m, 0), inn = over0 ? 1 : 0, I = m.innings[inn], bpo = m.ballsPerOver, s = I.sum;
  const key = `crease:${m._id}:${inn}`;
  const [sl, setSlS] = useState(() => load(key) || { s: '', n: '' }), [bsel, setBsel] = useState('');
  const [wk, setWk] = useState(false), [tie, setTie] = useState(false), [busy, setBusy] = useState(false);
  const setSl = v => { setSlS(v); keep(key, v) };
  useEffect(() => { setSlS(load(key) || { s: '', n: '' }); setBsel('') }, [inn]);   // eslint-disable-line
  if (!teams) return <Loading />;

  const over1 = over0 && (inningsOver(m, 1) || m.outcome?.over), matchOver = over1, innDone = inningsOver(m, inn);
  const players = id => teams.find(x => x._id === id)?.players || [];
  const bats = players(I.team._id), bowls = players(m.innings[1 - inn].team._id);
  const outNames = I.batters.filter(b => b.out !== 'not out').map(b => b.name), avail = bats.filter(p => !outNames.includes(p.name));
  const bStat = n => { const b = I.batters.find(x => x.name === n); return b ? `${b.runs} (${b.balls})` : 'yet to bat' };
  const wStat = n => s.bowl.find(b => b.name === n);
  const lock = I.over?.bowler || '', bowler = lock || bsel, lastBowler = !lock ? I.over?.last : '';
  const ovNo = Math.floor(s.balls / bpo) + 1, ballNo = I.over?.bowler ? bpo - I.over.left + 1 : 1;
  const bowlerOvers = wStat(bowler)?.overs || [], lastOver = bowlerOvers[bowlerOvers.length - 1];
  const ready = sl.s && sl.n && bowler && !innDone && !matchOver;

  const send = async (token, extra = {}) => {
    if (innDone) return toast(matchOver ? 'The match is decided. No more runs can be added.' : 'This innings is complete', 'err');
    if (!sl.s || !sl.n) return toast('Choose both batters first', 'err');
    if (!bowler) return toast('Choose the bowler first', 'err');
    setBusy(true); const before = s.balls;
    const r = await act(() => api(`/live/${m._id}/ball`, 'POST', { inn, striker: sl.s, bowler, token, ...extra })); setBusy(false);
    if (!r || !r._id) return false;
    setM(r); const ns = r.innings[inn].sum, done = ns.balls > before && ns.balls % bpo === 0, ended = inningsOver(r, inn);
    if (ended) { setSl({ s: '', n: '' }); setBsel('') }
    else {
      setSl(afterBall(sl, token, m.rules, extra.out, done));
      if (done) { setBsel(''); toast('Over complete. Strike changes. Choose the next bowler.') }
    }
    return true;
  };
  const undo = async () => { const r = await act(() => api(`/live/${m._id}/undo`, 'POST')); if (r?._id) setM(r) };
  const finish = async tw => {
    if (!tw && m.outcome?.over && !m.outcome.winner && m.round?.format === 'knockout') return setTie(true);
    if (!tw && !await ask({ title: 'Finish the match?', text: m.outcome?.text, ok: 'Finish match' })) return;
    const r = await act(() => api(`/live/${m._id}/finish`, 'POST', { tieWinner: tw }), 'Match finished'); if (r) { setTie(false); onDone() }
  };
  const confirmWk = async w => { if (await send(w.token, { kind: w.kind, out: w.kind === 'run out' ? w.out : sl.s, fielder: w.fielder })) setWk(false) };
  const crr = s.balls ? (s.runs * bpo / s.balls).toFixed(2) : '0.00';
  const total = m.overs * m.ballsPerOver, target = m.innings[0].sum.runs + 1;

  return <>
    <div className="scorebar" aria-live="polite">
      <div className="row"><span>{I.team.name} · {inn ? '2nd' : '1st'} innings</span><span className="chip live">LIVE</span></div>
      <div className="bigscore">{s.runs}/{s.wickets} <small>({ov(s.balls, bpo)}/{m.overs} ov · RR {crr})</small></div>
      {inn === 1 && !matchOver && <div className="chasebar">Target {target} · <b>{m.outcome?.text}</b>{m.outcome?.left > 0 && <> · RRR {((target - s.runs) * bpo / Math.max(m.outcome.left, 1)).toFixed(2)}</>}</div>}
      {inn === 0 && <div className="mut">{total - s.balls} balls left in this innings</div>}
    </div>

    {matchOver && <div className="card wonbanner"><div className="bigstatus won">🏆 {m.outcome?.text}</div>
      <div className="mut">{m.innings.map(x => `${x.team.name} ${x.sum.runs}/${x.sum.wickets}`).join('  ·  ')}</div>
      <div className="hint">The match is decided. Runs cannot be added to the batters any more.</div>
      <button className="p lg" onClick={() => finish()}>✓ Finish match & publish result</button><button onClick={undo}>↶ Undo last ball</button></div>}
    {over0 && inn === 1 && s.balls === 0 && !matchOver && <div className="card hintcard">1st innings complete: <b>{m.innings[0].team.name} {m.innings[0].sum.runs}/{m.innings[0].sum.wickets}</b>. <b>{I.team.name}</b> need <b>{target}</b> runs to win from {total} balls. Choose the two batters and the bowler.</div>}

    {!matchOver && <>
      <div className="card"><Crease sl={sl} setSl={setSl} avail={avail} stat={bStat} disabled={busy || innDone} />
        <h4>2 · Bowler <small className="mut">· over {ovNo}, ball {Math.min(ballNo, bpo)} of {bpo}</small></h4>
        {lock ? <div className="hint">🔒 <b>{lock}</b> is bowling this over ({I.over.left} ball{I.over.left === 1 ? '' : 's'} left). A new bowler can be chosen when the over is complete.</div> : null}
        <Pick value={bowler} onChange={setBsel} items={bowls.map(p => { const w = wStat(p.name); return { v: p.name, l: p.name, sub: w ? `${ov(w.balls, bpo)}-${w.runs}-${w.wk}` : '', off: !!lock ? p.name !== lock : p.name === lastBowler } })} />
        {lastBowler && <div className="mut small">{lastBowler} bowled the last over and cannot bowl the next one.</div>}
        {lastOver && <div className="thisover"><span className="mut">{bowler}'s over {lastOver.no}:</span> <BallChips marks={lastOver.marks} /></div>}</div>
      <div className="card"><h4>3 · Ball</h4><BallPad rules={m.rules} onBall={send} onWicket={() => ready ? setWk(true) : toast('Choose the batters and the bowler first', 'err')} disabled={busy || innDone} />
        {m.rules.lastBallCounts && inn === 1 && <div className="mut small">Rule: on the last ball of the 2nd innings a wide / no ball counts as a ball (its runs are added).</div>}
        <div className="row"><button onClick={undo} disabled={busy || (s.balls === 0 && !s.bowl.length)}>↶ Undo last ball</button>{innDone && !matchOver && <span className="warn">Innings complete</span>}</div></div></>}

    <div className="card"><h4>Batters <small className="mut">(runs scored by each batter)</small></h4>
      {I.batters.map(b => <div className="brow" key={b.name}><div className="bn"><b>{b.name}{b.name === sl.s && ' ★'}</b><div className="mut">{dismissal(b)}</div></div><div className="bs"><b>{b.runs}</b><small> ({b.balls})</small></div><div className="bm"><span className="f4">4s {b.fours}</span><span className="s6">6s {b.sixes}</span></div></div>)}
      {!I.batters.length && <p className="mut">No balls yet.</p>}
      <div className="extras"><b>Extras {s.extras.total}</b><span> wides {s.extras.wd} · no balls {s.extras.nb} · byes {s.extras.bye} · leg byes {s.extras.lb}</span></div>
      <div className="total"><span>Batters {s.bat} + Extras {s.extras.total}</span><b>= {s.runs}/{s.wickets}</b></div></div>
    <div className="card"><h4>Bowlers <small className="mut">(runs given by each bowler)</small></h4>
      {s.bowl.map(w => <div className="brow" key={w.name}><div className="bn"><b>{w.name}</b><div className="mut">wd {w.wd} · nb {w.nb} · bye {w.bye} · lb {w.lb} · econ {econ(w.runs, w.balls, bpo)}</div></div><div className="bs"><b>{w.wk}/{w.runs}</b><small> ({ov(w.balls, bpo)})</small></div></div>)}
      {!s.bowl.length && <p className="mut">No balls yet.</p>}
      <div className="total"><span>Bowlers {s.bowlRuns} + byes {s.extras.bye} + leg byes {s.extras.lb}</span><b>= {s.bowlRuns + s.extras.bye + s.extras.lb}</b></div></div>
    <Reconcile I={I} />

    {wk && <WicketModal striker={sl.s} nonStriker={sl.n} bowler={bowler} bowls={bowls} busy={busy} onClose={() => setWk(false)} onConfirm={confirmWk} />}
    {tie && <Modal title="Match tied: who wins the tie-break?" onClose={() => setTie(false)}>
      <p className="mut">A knockout match needs a winner (super over, bowl-out or toss). Select the team that won.</p>
      <Pick cls="big2" value="" onChange={v => finish(v)} items={m.innings.map(x => ({ v: x.team._id, l: x.team.name }))} /></Modal>}
  </>;
}
