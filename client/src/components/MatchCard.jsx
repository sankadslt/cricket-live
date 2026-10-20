import { Link } from 'react-router-dom';
import { ov } from '../lib/cricket';
import { Badge } from './ui';
import { useApp } from '../context/AppContext';

// One match in a list. Shows round, teams, score, and the status line (chase needs / result).
export default function MatchCard({ m, to, children }) {
  const { t } = useApp(), sch = !m.innings?.length;
  const rows = sch ? [{ team: m.teamA }, { team: m.teamB }] : m.innings;
  const label = m.status === 'live' ? 'LIVE' : m.status === 'done' ? 'Completed' : 'Upcoming';
  const body = <>
    <div className="row"><span className="mut">{t('Match')} {m.no} · {m.round?.name} · {m.group ? `${t('Group')} ${m.group}` : m.label}</span><span className={'chip ' + m.status}>{t(label)}</span></div>
    {rows.map((I, i) => <div className={'tr' + (m.winner && String(m.winner) === String(I.team._id) ? ' won' : '')} key={i}>
      <Badge name={I.team.name} /><span className="tn">{I.team.name}{I.team.placeholder && <small className="mut"> · {I.team.placeholder}</small>}{m.winner && String(m.winner) === String(I.team._id) && ' 🏆'}</span>
      <b className="ts">{sch ? '–' : `${I.sum.runs}/${I.sum.wickets}`}{!sch && <small> ({ov(I.sum.balls, m.ballsPerOver)})</small>}</b></div>)}
    <div className="mut">📅 {m.date || 'Date TBA'} {m.time && '· ' + m.time} · {t('Pitch')} {m.pitch || '-'}</div>
    {!sch && m.statusText && <div className={'status ' + (m.status === 'done' ? 'res' : 'chase')}>{m.statusText}</div>}
    {children}</>;
  return to === false ? <div className="card mcard">{body}</div> : <Link to={to || '/match/' + m._id} className="card mcard">{body}</Link>;
}
