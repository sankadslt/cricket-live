import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import useGet from '../../lib/useGet';
import { Loading } from '../../components/ui';

// Super admin start page: what to do next, in order, with counts.
export default function Home() {
  const { cat, t } = useApp(), [ts] = useGet('/teams?category=' + cat), [rs] = useGet('/rounds?category=' + cat), [ms] = useGet('/matches?category=' + cat, 15000);
  if (!ts || !rs || !ms) return <Loading />;
  const done = ms.filter(m => m.status === 'done').length, live = ms.filter(m => m.status === 'live'), dated = ms.filter(m => m.date && m.time && m.pitch && m.pitch !== '-').length;
  const gen = rs.filter(r => r.progress.total > 0).length;
  const steps = [
    { to: '/admin/teams', n: '1', h: 'Register teams', d: ts.length ? `${ts.length} teams registered` : 'Add the teams and their players', ok: ts.length >= 2 },
    { to: '/admin/rounds', n: '2', h: 'Create rounds & rules', d: rs.length ? `${rs.length} rounds: ${rs.map(r => r.name).join(', ')}` : 'Round 1, Round 2 … each with its own rules, League or Knockout', ok: rs.length > 0 },
    { to: '/admin/rounds', n: '3', h: 'Generate fixtures', d: rs.length ? `${gen} of ${rs.length} rounds have fixtures (${ms.length} matches)` : 'Create a round first', ok: rs.length > 0 && gen === rs.length },
    { to: '/admin/schedule', n: '4', h: 'Set date, time & pitch', d: ms.length ? `${dated} of ${ms.length} matches scheduled` : 'Generate fixtures first', ok: ms.length > 0 && dated === ms.length },
    { to: '/admin/scoring', n: '5', h: 'Scoring', d: ms.length ? `${done} of ${ms.length} matches finished${live.length ? ` · ${live.length} live now` : ''}` : 'Start after the fixtures are ready', ok: ms.length > 0 && done === ms.length },
  ];
  const cur = steps.findIndex(s => !s.ok);
  return <>
    <h2>Start here</h2><p className="mut">Follow the steps from top to bottom. The highlighted step is what to do next.</p>
    <div className="todo">{steps.map((s, i) => <Link key={s.n} to={s.to} className={'card step-c ' + (s.ok ? 'ok' : i === cur ? 'now' : '')}><b className="num">{s.ok ? '✓' : s.n}</b><div><b>{t(s.h)}</b><div className="mut">{s.d}</div></div><span>›</span></Link>)}</div>
    {live.length > 0 && <><h3 className="sec"><span className="liveDot">LIVE</span> Matches in progress</h3>
      {live.map(m => <Link key={m._id} className="card mcard" to={'/admin/scoring/' + m._id}><b>#{m.no} {m.teamA.name} vs {m.teamB.name}</b><div className="chase">{m.statusText}</div><span className="lnk">Open scoring ›</span></Link>)}</>}
  </>;
}
