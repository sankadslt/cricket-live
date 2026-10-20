import { Avatar } from './ui';
// Featured player card with photo (dummy), strike rate, fours, sixes etc.
export default function BestCard({ title, kind, p }) {
  if (!p) return null;
  const S = {
    runs: [['Runs', p.runs], ['Balls', p.balls], ['Strike rate', p.sr], ['Fours', p.fours], ['Sixes', p.sixes], ['Highest', p.hs]],
    sixes: [['Sixes', p.sixes], ['Runs', p.runs], ['Strike rate', p.sr], ['Fours', p.fours]], fours: [['Fours', p.fours], ['Runs', p.runs], ['Strike rate', p.sr], ['Sixes', p.sixes]],
    wickets: [['Wickets', p.wickets], ['Runs given', p.bRuns], ['Economy', p.econ], ['Balls', p.bBalls]],
    bat: [['Runs', p.runs], ['Balls', p.balls], ['Strike rate', p.sr], ['Fours', p.fours], ['Sixes', p.sixes]],
    bow: [['Wickets', p.wk], ['Runs given', p.runs], ['Economy', p.econ], ['Balls', p.balls]],
  }[kind];
  return <div className="card best"><div className="bt">{title}</div><div className="bh"><Avatar name={p.name} size={72} /><div><div className="bnm">{p.name}</div><div className="mut">{p.team}{p.matches !== undefined && ` · ${p.matches} match${p.matches === 1 ? '' : 'es'}`}</div></div></div>
    <div className="stats">{S.map(([k, v]) => <div key={k}><b>{v ?? 0}</b><span>{k}</span></div>)}</div></div>;
}
