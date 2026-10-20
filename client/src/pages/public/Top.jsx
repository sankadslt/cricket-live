import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import useGet from '../../lib/useGet';
import BestCard from '../../components/BestCard';
import { Avatar, Empty, Loading, Pick } from '../../components/ui';

const TABS = { runs: ['Runs', 'Most runs', p => p.runs, 'runs'], wickets: ['Wickets', 'Most wickets', p => p.wickets, 'wickets'], sixes: ['Sixes', 'Most sixes', p => p.sixes, 'sixes'], fours: ['Fours', 'Most fours', p => p.fours, 'fours'] };
export default function Top() {
  const { cat, t } = useApp(), [k, setK] = useState('runs'), [d] = useGet('/stats/top?category=' + cat, 30000);
  if (!d) return <Loading />;
  const list = (d[k] || []).slice(0, 10), [title, big, val] = TABS[k];
  return <>
    <Pick value={k} onChange={setK} items={Object.entries(TABS).map(([v, a]) => ({ v, l: t(a[0]) }))} />
    {!list.length ? <Empty icon="🏅" text="Top 10 will appear after the first match." /> : <>
      <BestCard title={'🏆 ' + big} kind={k} p={list[0]} />
      <div className="card">{list.map((p, i) => <div className="brow" key={p.name + i}><span className="rank">{i + 1}</span><Avatar name={p.name} size={36} />
        <div className="bn"><b>{p.name}</b><div className="mut">{p.team}</div></div>
        <div className="bs"><b>{val(p)}</b></div>
        <div className="bm">{k === 'wickets' ? <><span>Econ {p.econ}</span></> : <><span>SR {p.sr}</span><span className="f4">4s {p.fours}</span><span className="s6">6s {p.sixes}</span></>}</div></div>)}</div></>}
  </>;
}
