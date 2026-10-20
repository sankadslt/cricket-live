import { useState } from 'react';
import { api } from '../../api';
import { useApp } from '../../context/AppContext';
import useGet from '../../lib/useGet';
import Modal from '../../components/Modal';
import { Badge, Empty, Field, Loading } from '../../components/ui';

const ROLES = ['Batsman', 'Bowler', 'Keeper', 'All-rounder'];
const blank = () => ({ name: '', players: Array.from({ length: 11 }, () => ({ name: '', serviceNo: '', role: 'Batsman' })) });

export default function Teams() {
  const { cat, t, act, ask } = useApp(), [ts, load] = useGet('/teams?category=' + cat), [ed, setEd] = useState(null), [pt, setPt] = useState('');
  if (!ts) return <Loading />;
  const save = async () => {
    const body = { name: ed.name, category: cat, players: ed.players };
    const r = await act(() => ed._id ? api('/teams/' + ed._id, 'PUT', body) : api('/teams', 'POST', body), 'Team saved');
    if (r) { setEd(null); load() }
  };
  const del = async x => { if (await ask({ title: 'Delete ' + x.name + '?', text: 'This cannot be undone.', ok: 'Delete', danger: true })) { await act(() => api('/teams/' + x._id, 'DELETE'), 'Team deleted'); load() } };
  const setP = (i, k, v) => setEd({ ...ed, players: ed.players.map((p, j) => j === i ? { ...p, [k]: v } : p) });
  const paste = txt => {   // "Name, ServiceNo" per line
    const rows = txt.split('\n').map(l => l.trim()).filter(Boolean).map(l => { const [name, serviceNo = ''] = l.split(/[,\t]/).map(s => s.trim()); return { name, serviceNo, role: 'Batsman' } });
    if (rows.length) setEd({ ...ed, players: [...ed.players.filter(p => p.name), ...rows] });
  };
  return <>
    <div className="row"><h2>{t('Teams')} · {cat === 'boys' ? t('Boys') : t('Girls')}</h2><button className="p" onClick={() => setEd(blank())}>+ {t('Add')} team</button></div>
    {!ts.length && <Empty icon="👥" text="No teams yet. Add the first team."><button className="p" onClick={() => setEd(blank())}>+ Add team</button></Empty>}
    <div className="g2">{ts.map(x => <div className="card" key={x._id}><div className="tr"><Badge name={x.name} size={44} /><div className="tn">{x.name}<div className="mut">{x.players.length} {t('Players')}</div></div>
      <button onClick={() => setEd({ ...x, players: x.players.map(p => ({ ...p })) })}>{t('Edit')}</button><button className="danger-o" onClick={() => del(x)}>🗑</button></div>
      <div className="mut small">{x.players.map(p => p.name).join(', ')}</div></div>)}</div>
    {ed && <Modal wide title={ed._id ? 'Edit team' : 'New team'} onClose={() => setEd(null)}>
      <Field l="Team name" v={ed.name} on={v => setEd({ ...ed, name: v })} autoFocus />
      <h4>{t('Players')} ({ed.players.filter(p => p.name.trim()).length})</h4>
      <div className="prow head"><span>{t('Name')}</span><span>{t('Service no')}</span><span>Role</span></div>
      {ed.players.map((p, i) => <div className="prow" key={i}><input aria-label={'Player ' + (i + 1)} placeholder={'Player ' + (i + 1)} value={p.name} onChange={e => setP(i, 'name', e.target.value)} />
        <input aria-label="Service no" placeholder="Service no" value={p.serviceNo || ''} onChange={e => setP(i, 'serviceNo', e.target.value)} />
        <select aria-label="Role" value={p.role} onChange={e => setP(i, 'role', e.target.value)}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></div>)}
      <div className="row"><button onClick={() => setEd({ ...ed, players: [...ed.players, { name: '', serviceNo: '', role: 'Batsman' }] })}>+ Add row</button>
      </div>
      <details className="sub"><summary>📋 Paste a list of players</summary>
        <textarea rows="5" placeholder={'One player per line:\nName, Service no'} value={pt} onChange={e => setPt(e.target.value)} />
        <button onClick={() => { paste(pt); setPt('') }} disabled={!pt.trim()}>Add these players</button></details>
      <div className="actions"><button onClick={() => setEd(null)}>{t('Cancel')}</button><button className="p" onClick={save}>{t('Save')}</button></div></Modal>}
  </>;
}
