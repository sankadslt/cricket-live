import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import useGet from '../../lib/useGet';
import MatchCard from '../../components/MatchCard';
import { Empty, Loading, Pick } from '../../components/ui';
import { dateText } from '../../lib/cricket';

// Public match list. Live matches first, then by date. Refreshes itself.
export default function Fixtures() {
  const { cat, t } = useApp(), [st, setSt] = useState(''), [rd, setRd] = useState('');
  const [ms] = useGet('/matches?category=' + cat, 15000), [rs] = useGet('/rounds?category=' + cat);
  if (!ms || !rs) return <Loading />;
  const list = ms.filter(m => (!st || m.status === st) && (!rd || m.round?._id === rd));
  const live = list.filter(m => m.status === 'live'), rest = list.filter(m => m.status !== 'live');
  const days = [...new Set(rest.map(m => m.date || ''))].sort((a, b) => (a || '9').localeCompare(b || '9'));
  return <>
    <Pick value={st} onChange={setSt} items={[{ v: '', l: t('All') }, { v: 'live', l: '🔴 ' + t('Live') }, { v: 'scheduled', l: t('Upcoming') }, { v: 'done', l: t('Completed') }]} />
    {rs.length > 1 && <Pick value={rd} onChange={setRd} cls="small" items={[{ v: '', l: t('All') + ' ' + t('Rounds') }, ...rs.map(r => ({ v: r._id, l: r.name }))]} />}
    {!list.length && <Empty text={ms.length ? 'No matches for this filter.' : 'Fixtures will be published soon.'} />}
    {live.length > 0 && <><h3 className="sec"><span className="liveDot">LIVE</span> {t('Live')}</h3><div className="g2">{live.map(m => <MatchCard key={m._id} m={m} />)}</div></>}
    {days.map(d => <section key={d}><h3 className="sec">{dateText(d)}</h3><div className="g2">{rest.filter(m => (m.date || '') === d).map(m => <MatchCard key={m._id} m={m} />)}</div></section>)}
  </>;
}
