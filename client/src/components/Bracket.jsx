import { Link } from 'react-router-dom';
import { useState } from 'react';

// The knockout draw as a diagram: one column per stage, winners move right.
// Tap a team name to light up every match of that team. Tap a match to open it.
export default function Bracket({ matches }) {
  const [hi, setHi] = useState(null);
  const cols = [...new Set(matches.map(m => m.koRound))].sort((a, b) => a - b);
  if (!matches.length) return null;
  const nextUp = matches.find(m => m.status !== 'done' && m.teamA._id && m.teamB._id);
  return <div className="bracket" role="group" aria-label="Knockout draw">
    {cols.map(c => {
      const ms = matches.filter(m => m.koRound === c);
      return <div className="bcol" key={c}><h4>{ms[0].label}</h4>
        <div className="bcards">{ms.map(m => <div className="bwrap" key={m._id}><MatchBox m={m} hi={hi} setHi={setHi} next={nextUp?._id === m._id} /></div>)}</div></div>;
    })}
  </div>;
}

function MatchBox({ m, hi, setHi, next }) {
  const Side = ({ t }) => {
    const won = m.winner && String(m.winner) === String(t._id), lost = m.status === 'done' && m.winner && !won;
    const I = m.innings?.find(x => String(x.team._id) === String(t._id));
    return <div className={'bside' + (won ? ' won' : '') + (lost ? ' lost' : '') + (hi && hi === t._id ? ' hi' : '')}>
      <button className="lnk" disabled={!t._id} onClick={e => { e.preventDefault(); setHi(hi === t._id ? null : t._id) }} title={t.placeholder || t.name}>{t._id ? t.name : <i>{t.placeholder}</i>}{won && ' 🏆'}</button>
      <b>{I ? `${I.sum.runs}/${I.sum.wickets}` : ''}</b></div>;
  };
  return <Link to={'/match/' + m._id} className={'bmatch ' + m.status + (next ? ' next' : '')}>
    <div className="bhead"><span>#{m.no}</span><span>{m.status === 'live' ? <b className="liveDot">LIVE</b> : m.status === 'done' ? 'Done' : m.date ? `${m.date.slice(5)} ${m.time || ''}` : 'TBA'}</span></div>
    <Side t={m.teamA} /><Side t={m.teamB} />
    {m.status === 'done' && <div className="bres">{m.result}</div>}
    {next && <div className="bnext">▶ Next match</div>}
  </Link>;
}
