import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import useGet from '../../lib/useGet';
import { Avatar, Badge, Empty, Loading } from '../../components/ui';
import { session } from '../../api';

export default function Teams() {
  const { cat, t } = useApp(), [ts] = useGet('/teams?category=' + cat), [open, setOpen] = useState('');
  if (!ts) return <Loading />;
  if (!ts.length) return <Empty icon="👥" text="Teams will be announced soon." />;
  return <><p className="mut">{session.isStaff ? 'Service numbers are visible because you are logged in.' : 'Tap a team to see its players.'}</p>
    <div className="g2">{ts.map(x => <div key={x._id} className="card tcard">
      <button className="tbtn" aria-expanded={open === x._id} onClick={() => setOpen(open === x._id ? '' : x._id)}><Badge name={x.name} size={46} /><div><b>{x.name}</b><div className="mut">{x.players.length} {t('Players')}</div></div><span>{open === x._id ? '▴' : '▾'}</span></button>
      {open === x._id && x.players.map(p => <div className="brow" key={p.name}><Avatar name={p.name} size={34} /><div className="bn"><b>{p.name}</b><div className="mut">{p.role}</div></div>{p.serviceNo && <span className="chip">{t('Service no')}: {p.serviceNo}</span>}</div>)}</div>)}</div></>;
}
