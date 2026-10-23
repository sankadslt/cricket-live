import { useState } from 'react';
import Modal from './Modal';
import { Pick } from './ui';
import { OUTS } from '../lib/cricket';

// How was he out, and who was responsible (fielder for catch / stumping / run out; the bowler is automatic).
export default function WicketModal({ striker, nonStriker, bowler, bowls, onClose, onConfirm, busy }) {
  const [W, setW] = useState({ kind: '', out: striker, fielder: '', runs: 0 });
  const needF = ['caught', 'stumped', 'run out'].includes(W.kind), ok = W.kind && W.out && (!needF || W.fielder);
  const pl = bowls.map(p => ({ v: p.name, l: p.name, sub: p.role === 'Keeper' ? 'keeper' : '' }));
  return <Modal title="Wicket" onClose={onClose}>
    <span className="lbl">How was the batter out?</span>
    <Pick value={W.kind} onChange={v => setW({ ...W, kind: v, out: v === 'run out' ? W.out : striker })} items={OUTS.map(([v, l]) => ({ v, l }))} />
    {W.kind === 'run out' && <><span className="lbl">Who is run out?</span><Pick value={W.out} onChange={v => setW({ ...W, out: v })} items={[{ v: striker, l: striker, sub: 'on strike' }, { v: nonStriker, l: nonStriker, sub: 'non-striker' }]} />
      <span className="lbl">Runs completed before the run out</span><Pick value={W.runs} onChange={v => setW({ ...W, runs: v })} cls="small" items={[0, 1, 2, 3].map(n => ({ v: n, l: String(n) }))} /></>}
    {needF && <><span className="lbl">{W.kind === 'caught' ? 'Who took the catch?' : W.kind === 'stumped' ? 'Who did the stumping?' : 'Who ran him out (fielder)?'}</span>
      <Pick value={W.fielder} onChange={v => setW({ ...W, fielder: v })} items={pl} />{W.kind === 'caught' && W.fielder === bowler && <div className="mut small">Caught & bowled</div>}</>}
    {W.kind && W.kind !== 'run out' && <div className="hint">Wicket goes to bowler <b>{bowler}</b>. Out: <b>{striker}</b>{W.fielder && <> · {W.kind === 'stumped' ? 'st' : 'c'} <b>{W.fielder}</b></>}. The ball counts as a ball faced by {striker}.</div>}
    {W.kind === 'run out' && <div className="hint">No wicket for the bowler. {W.out} is run out{W.fielder && <> by <b>{W.fielder}</b></>} after {W.runs} run(s).</div>}
    <div className="actions"><button onClick={onClose}>Cancel</button><button className="danger" disabled={!ok || busy} onClick={() => onConfirm({ ...W, token: W.kind === 'run out' ? String(W.runs) : 'W' })}>Confirm wicket</button></div>
  </Modal>;
}
