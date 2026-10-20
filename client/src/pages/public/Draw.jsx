import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import useGet from '../../lib/useGet';
import Bracket from '../../components/Bracket';
import MatchCard from '../../components/MatchCard';
import { Empty, Loading, Chip } from '../../components/ui';
import { PointsTable } from './Points';

// The whole tournament: Round 1 -> Round 2 -> ... Each round shows its groups or its knockout diagram.
// Results update it automatically (the winner moves to the next match).
export default function Draw() {
  const { cat, t } = useApp(), [rounds] = useGet('/stats/draw?category=' + cat, 15000), [sel, setSel] = useState(null);
  useEffect(() => setSel(null), [cat]);
  if (!rounds) return <Loading />;
  if (!rounds.length) return <Empty icon="🗺" text="The draw will be published soon." />;
  const cur = rounds.find(r => r._id === sel) || rounds.find(r => r.status === 'live') || rounds.find(r => r.status === 'upcoming') || rounds[rounds.length - 1];
  const all = rounds.flatMap(r => r.matches), up = all.filter(m => m.status !== 'done' && m.teamA._id && m.teamB._id).sort((a, b) => (a.status === 'live' ? -1 : 0) - (b.status === 'live' ? -1 : 0) || a.no - b.no).slice(0, 3);
  const mark = { done: '✓', live: '●', upcoming: '○', empty: '○' };
  return <>
    <ol className="flow" aria-label="Rounds">{rounds.map((r, i) => <li key={r._id}><button className={(cur._id === r._id ? 'on ' : '') + r.status} onClick={() => setSel(r._id)}>
      <small>{mark[r.status]} {r.format === 'league' ? t('League') : t('Knockout')}</small><b>{r.name}</b></button>{i < rounds.length - 1 && <span className="arr">›</span>}</li>)}</ol>
    {up.length > 0 && <div className="card upnext"><b>▶ {t("What's next")}</b>
      <div className="upl">{up.map(m => <Link key={m._id} to={'/match/' + m._id}><span>#{m.no} {m.round?.name} · {m.group ? t('Group') + ' ' + m.group : m.label}</span><b>{m.teamA.name} vs {m.teamB.name}</b><small>{m.status === 'live' ? '🔴 LIVE' : `${m.date || 'Date TBA'} ${m.time || ''} · ${t('Pitch')} ${m.pitch}`}</small></Link>)}</div></div>}
    <RoundView r={cur} />
  </>;
}

function RoundView({ r }) {
  const { t } = useApp(), ru = r.rules, rule = `${r.overs} overs · ${r.ballsPerOver} balls/over · wide ${ru.wideRuns}${ru.wideBall ? '' : ' (re-bowl)'} · no ball ${ru.noBallRuns}${ru.noBallBall ? '' : ' (re-bowl)'}`;
  return <section>
    <div className="row"><h3>{r.name} <Chip kind={r.status === 'done' ? 'done' : r.status === 'live' ? 'live' : ''}>{r.format === 'league' ? t('League') : t('Knockout')}</Chip></h3><span className="mut">{rule}</span></div>
    {r.status === 'empty' && <Empty icon="⏳" text={r.format === 'knockout' ? `Entrants: ${r.entrants.map(e => e.name).join(', ') || 'to be decided'}. Fixtures will be added soon.` : 'Fixtures will be added soon.'} />}
    {r.format === 'knockout' && r.matches.length > 0 && <div className="card scrollx"><Bracket matches={r.matches} /></div>}
    {r.format === 'league' && r.groups.map(g => <div key={g.name} className="card"><h4>{t('Group')} {g.name}</h4><PointsTable rows={g.rows} />
      <details><summary className="mut">{r.matches.filter(m => m.group === g.name).length} matches</summary><div className="g2">{r.matches.filter(m => m.group === g.name).map(m => <MatchCard key={m._id} m={m} />)}</div></details></div>)}
  </section>;
}
