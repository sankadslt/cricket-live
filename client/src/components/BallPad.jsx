import { useState } from 'react';
// Tap pad: choose what kind of ball (normal / wide / no ball / bye / leg bye), then tap the runs. OUT opens the wicket pop-up.
// Rules decide what a wide / no ball gives, and the hint tells the scorer.
export default function BallPad({ rules, onBall, onWicket, disabled }) {
  const [ex, setEx] = useState('');
  const EX = [['', 'Normal'], ['Wd', 'Wide'], ['Nb', 'No ball'], ['B', 'Bye'], ['L', 'Leg bye']];
  const tok = n => ex === 'B' || ex === 'L' ? ex + n : ex ? ex + (n || '') : String(n);
  const pl = n => n === 1 ? 'run' : 'runs';
  const hint = {
    Wd: `Wide = ${rules.wideRuns} ${pl(rules.wideRuns)} to the extras${rules.wideBall ? ', counts as a ball' : ', not a ball (re-bowl)'}. Tap extra runs that were run, or "Wd" for none.`,
    Nb: `No ball = ${rules.noBallRuns} ${pl(rules.noBallRuns)} to the extras${rules.noBallBall ? ', counts as a ball' : ', not a ball (re-bowl)'}. Tap runs the batter hit, or "Nb" for none.`,
    B: 'Byes: tap how many were run (they go to extras, not to the batter).', L: 'Leg byes: tap how many were run (extras, not the batter).',
  }[ex];
  const lab = n => ex === 'Wd' || ex === 'Nb' ? (n ? `+${n}` : ex) : n === 0 && !ex ? '•' : n;
  const kind = { '': 'Runs off the bat', Wd: 'Wide', Nb: 'No ball', B: 'Bye', L: 'Leg bye' }[ex];
  return <div className="pad"><div className="pick" role="group" aria-label="Type of ball">{EX.map(([v, l]) => <button type="button" key={v} aria-pressed={ex === v} className={'pk' + (ex === v ? ' on' : '')} onClick={() => setEx(v)}>{l}</button>)}</div>
    {hint ? <div className="hint">{hint}</div> : <div className="mut small">{kind}: tap the runs</div>}
    <div className="runs">{[0, 1, 2, 3, 4, 5, 6].map(n => <button type="button" disabled={disabled} key={n} className={'run r' + n} aria-label={`${kind} ${n}`} onClick={() => { onBall(tok(n)); setEx('') }}>{lab(n)}</button>)}
      {onWicket && <button type="button" disabled={disabled} className="run w" onClick={() => { onWicket(); setEx('') }}>OUT</button>}</div></div>;
}
