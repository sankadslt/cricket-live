import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, session } from '../../api';
import { useApp } from '../../context/AppContext';
import useGet from '../../lib/useGet';
import Modal from '../../components/Modal';
import { Field, Loading, Pick, Steps, Toggle, Bad, Badge } from '../../components/ui';
import Live from './Live';
import Paper from './Paper';
import { Reconcile } from '../../components/Scorecard';

export default function ScoringMatch() {
  const { id } = useParams(), [m, load, err] = useGet('/matches/' + id);
  if (err) return <Bad text={err} />;
  if (!m) return <Loading />;
  const head = <div className="crumbs"><Link to="/admin/scoring">← Scoring</Link><span>Match {m.no} · {m.round?.name} · {m.group ? 'Group ' + m.group : m.label}</span></div>;
  if (!m.teamA._id || !m.teamB._id) return <>{head}<Bad text="The teams of this match are not decided yet. Finish the earlier matches first." /></>;
  if (!m.scoringMode) return <>{head}<Setup m={m} onDone={load} /></>;
  if (m.status === 'done') return <>{head}<Done m={m} /></>;
  return <>{head}{m.scoringMode === 'live' ? <Live m0={m} onDone={load} /> : <Paper m0={m} onDone={load} />}</>;
}

function Done({ m }) {
  return <><div className="card score"><div className="bigstatus won">🏆 {m.result}</div>
    {m.innings.map((I, i) => <div className="tr" key={i}><Badge name={I.team.name} /><span className="tn">{I.team.name}</span><b className="ts">{I.sum.runs}/{I.sum.wickets}</b></div>)}</div>
    {m.next && <div className="card upnext"><b>▶ Next match</b><p><Link to={'/admin/scoring/' + m.next._id}>#{m.next.no} {m.next.label}: <b>{m.next.teamA.name} vs {m.next.teamB.name}</b></Link></p></div>}
    {m.innings.map((I, i) => <Reconcile key={i} I={I} />)}
    <Link className="btn" to={'/match/' + m._id}>Open public scorecard</Link> <Link className="btn p" to="/admin/scoring">Back to the list</Link></>;
}

// 4 steps: who scores -> toss -> live / hand-written -> rules (default of the round or special for this match)
function Setup({ m, onDone }) {
  const { act, t } = useApp(), [users] = useGet('/users'), [st, setSt] = useState(0);
  const [f, setF] = useState({ scorerId: session.id, winner: '', elected: '', mode: '', rulesMode: 'default', rules: { overs: m.overs, ballsPerOver: m.ballsPerOver, wideRuns: m.rules.wideRuns, noBallRuns: m.rules.noBallRuns, wideBall: m.rules.wideBall, noBallBall: m.rules.noBallBall } });
  const [pop, setPop] = useState(false);
  if (!users) return <Loading />;
  const set = o => setF({ ...f, ...o }), R = f.rulesMode === 'special' ? f.rules : { overs: m.overs, ballsPerOver: m.ballsPerOver, ...m.rules };
  const ok = [!!f.scorerId, !!f.winner && !!f.elected, !!f.mode, true][st], teams = [m.teamA, m.teamB];
  const name = id => teams.find(x => x._id === id)?.name;
  const start = async () => {
    const r = await act(() => api(`/matches/${m._id}/setup`, 'POST', { scorerId: f.scorerId, mode: f.mode, rulesMode: f.rulesMode, rules: f.rules, toss: { winner: f.winner, elected: f.elected } }), 'Scoring started');
    if (r) onDone();
  };
  const pl = n => n === 1 ? 'run' : 'runs';
  return <div className="card">
    <h3>{m.teamA.name} vs {m.teamB.name}</h3>
    <Steps items={['Scorer', 'Toss', 'Method', 'Rules']} at={st} />
    {st === 0 && <><h4>Who is scoring this match?</h4><Pick value={f.scorerId} onChange={v => set({ scorerId: v })} items={users.map(u => ({ v: u._id, l: u.name, sub: u.role === 'super' ? t('Super admin') : t('Scorer') }))} /></>}
    {st === 1 && <><h4>Who won the toss?</h4><Pick cls="big2" value={f.winner} onChange={v => set({ winner: v })} items={teams.map(x => ({ v: x._id, l: x.name }))} />
      {f.winner && <><h4>{name(f.winner)} chose to…</h4><Pick cls="big2" value={f.elected} onChange={v => set({ elected: v })} items={[{ v: 'bat', l: '🏏 Bat first' }, { v: 'bowl', l: '⚾ Bowl first' }]} /></>}</>}
    {st === 2 && <><h4>How will you score?</h4><Pick cls="big2" value={f.mode} onChange={v => set({ mode: v })} items={[{ v: 'live', l: '📱 Live scoring', sub: 'ball by ball, as the match is played' }, { v: 'paper', l: '📝 From a hand-written sheet', sub: 'enter the finished scorebook' }]} />
      <p className="hint">This cannot be changed after the match starts.</p></>}
    {st === 3 && <><h4>Match rules</h4>
      <div className="card plain rules"><div className="rrow"><span>Overs</span><b>{R.overs}</b></div><div className="rrow"><span>Balls per over</span><b>{R.ballsPerOver}</b></div>
        <div className="rrow"><span>Wide</span><b>{R.wideRuns} {pl(R.wideRuns)}, {R.wideBall ? 'counts as a ball' : 'ball is re-bowled'}</b></div>
        <div className="rrow"><span>No ball</span><b>{R.noBallRuns} {pl(R.noBallRuns)}, {R.noBallBall ? 'counts as a ball' : 'ball is re-bowled'}</b></div></div>
      <Pick value={f.rulesMode} onChange={v => { set({ rulesMode: v }); if (v === 'special') setPop(true) }} items={[{ v: 'default', l: '✓ Use ' + m.round?.name + ' rules', sub: 'default' }, { v: 'special', l: '⚙ Special rules for this match' }]} />
      {f.rulesMode === 'special' && <button onClick={() => setPop(true)}>Edit special rules</button>}
      <div className="card plain sub"><b>Summary</b><div className="mut">Scorer: {users.find(u => u._id === f.scorerId)?.name} · Toss: {name(f.winner)} chose to {f.elected} · {f.mode === 'live' ? 'Live' : 'Hand-written sheet'}</div></div></>}
    <div className="actions">{st > 0 && <button onClick={() => setSt(st - 1)}>← {t('Back')}</button>}
      {st < 3 ? <button className="p" disabled={!ok} onClick={() => setSt(st + 1)}>{t('Next')} →</button> : <button className="p" onClick={start}>▶ Start match</button>}</div>
    {pop && <Modal title="Special rules (this match only)" onClose={() => { setPop(false) }}>
      <div className="grid"><Field l="Overs" t="number" min="1" v={f.rules.overs} on={v => set({ rules: { ...f.rules, overs: +v } })} /><Field l="Balls per over" t="number" min="1" v={f.rules.ballsPerOver} on={v => set({ rules: { ...f.rules, ballsPerOver: +v } })} /></div>
      <div className="grid"><Field l="Wide gives (runs)" t="number" min="0" v={f.rules.wideRuns} on={v => set({ rules: { ...f.rules, wideRuns: +v } })} /><Field l="No ball gives (runs)" t="number" min="0" v={f.rules.noBallRuns} on={v => set({ rules: { ...f.rules, noBallRuns: +v } })} /></div>
      <Toggle l="Wide counts as a ball" v={f.rules.wideBall} on={v => set({ rules: { ...f.rules, wideBall: v } })} /><Toggle l="No ball counts as a ball" v={f.rules.noBallBall} on={v => set({ rules: { ...f.rules, noBallBall: v } })} />
      <div className="actions"><button onClick={() => { set({ rulesMode: 'default' }); setPop(false) }}>Use default instead</button><button className="p" onClick={() => setPop(false)}>Use these rules</button></div></Modal>}
  </div>;
}
