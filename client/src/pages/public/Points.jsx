import { useApp } from '../../context/AppContext';
import useGet from '../../lib/useGet';
import { Empty, Loading, Badge } from '../../components/ui';

export function PointsTable({ rows, qual = 2 }) {
  const { t } = useApp();
  return <div className="tw"><table><thead><tr><th>#</th><th>{t('Team')}</th><th>{t('Played')}</th><th>{t('Won')}</th><th>{t('Lost')}</th><th>{t('Tied')}</th><th>{t('Pts')}</th><th>{t('NRR')}</th></tr></thead>
    <tbody>{rows.map((r, i) => <tr key={r.id} className={i < qual ? 'qual' : ''}><td>{i + 1}</td><td><span className="tcell"><Badge name={r.team} size={24} />{r.team}</span></td><td>{r.P}</td><td>{r.W}</td><td>{r.L}</td><td>{r.T}</td><td><b>{r.pts}</b></td><td>{r.nrr > 0 ? '+' : ''}{r.nrr.toFixed ? r.nrr.toFixed(3) : r.nrr}</td></tr>)}</tbody></table>
    <p className="mut small">Ranked by points, then net run rate (NRR). The green bar shows the top {qual} of the group.</p></div>;
}

export default function Points() {
  const { cat, t } = useApp(), [d] = useGet('/stats/points?category=' + cat, 20000);
  if (!d) return <Loading />;
  if (!d.length) return <Empty icon="📊" text="No league round yet. Knockout rounds have no points table; see the Draw." />;
  return <>{d.map(r => <section key={r.round._id}><h3 className="sec">{r.round.name}</h3>
    <div className="g2">{r.groups.map(g => <div className="card" key={g.name}><h4>{t('Group')} {g.name}</h4>{g.rows.length ? <PointsTable rows={g.rows} /> : <p className="mut">No teams.</p>}</div>)}</div></section>)}</>;
}
