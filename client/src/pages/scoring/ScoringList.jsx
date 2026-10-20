import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import useGet from '../../lib/useGet';
import { Empty, Loading, Pick, Chip } from '../../components/ui';
import MatchCard from '../../components/MatchCard';

// Pick the match to score. "Ready" = both teams known. Knockout matches wait for the earlier match winners.
export default function ScoringList() {
  const { cat, t } = useApp(), [ms] = useGet('/matches?category=' + cat, 15000), [f, setF] = useState('todo');
  if (!ms) return <Loading />;
  const ready = m => m.teamA._id && m.teamB._id, list = ms.filter(m => f === 'all' || (f === 'done' ? m.status === 'done' : f === 'live' ? m.status === 'live' : m.status !== 'done'));
  return <>
    <h2>{t('Scoring')} · {cat === 'boys' ? t('Boys') : t('Girls')}</h2>
    <Pick value={f} onChange={setF} items={[{ v: 'todo', l: 'To score' }, { v: 'live', l: '🔴 ' + t('Live') }, { v: 'done', l: t('Completed') }, { v: 'all', l: t('All') }]} />
    {!list.length && <Empty icon="🏏" text={ms.length ? 'No matches here.' : 'No fixtures yet. The super admin creates rounds and generates fixtures.'} />}
    <div className="g2">{list.map(m => <MatchCard key={m._id} m={m} to={false}>
      <div className="row cta">
        {!ready(m) ? <Chip>Waiting for earlier matches</Chip>
          : m.status === 'done' ? <Link className="btn" to={'/match/' + m._id}>View scorecard</Link>
          : <Link className="btn p" to={'/admin/scoring/' + m._id}>{m.scoringMode ? '▶ ' + t('Continue scoring') : t('Start scoring')}</Link>}
        {m.scorer && <span className="mut">✍ {m.scorer.name}</span>}</div></MatchCard>)}</div>
  </>;
}
