import { useState } from 'react';
import { api, session } from '../../api';
import { useApp } from '../../context/AppContext';
import useGet from '../../lib/useGet';
import Modal from '../../components/Modal';
import { Field, Loading, Pick, Chip } from '../../components/ui';

export default function Users() {
  const { t, act, ask } = useApp(), [us, load] = useGet('/users'), [ed, setEd] = useState(null);
  if (!us) return <Loading />;
  const save = async () => {
    const body = { ...ed }; if (ed._id && !body.password) delete body.password;
    const r = await act(() => ed._id ? api('/users/' + ed._id, 'PATCH', body) : api('/users', 'POST', body), 'Saved');
    if (r) { setEd(null); load() }
  };
  const del = async u => { if (await ask({ title: `Delete ${u.name}?`, text: 'This account will not be able to login any more.', ok: 'Delete', danger: true })) { await act(() => api('/users/' + u._id, 'DELETE'), 'Deleted'); load() } };
  return <>
    <div className="row"><h2>{t('Users')}</h2><button className="p" onClick={() => setEd({ role: 'scorer', name: '', username: '', password: '', serviceNo: '' })}>+ Add user</button></div>
    <p className="mut"><b>{t('Super admin')}</b>: can do everything. <b>{t('Scorer')}</b>: can only mark scores.</p>
    {us.map(u => <div className="card tr" key={u._id}><span className="bd">{(u.name || '?')[0]}</span><div className="tn">{u.name}{String(u._id) === session.id && ' (you)'}<div className="mut">@{u.username}{u.serviceNo && ` · ${u.serviceNo}`}</div></div>
      <Chip kind={u.role === 'super' ? 'done' : ''}>{u.role === 'super' ? t('Super admin') : t('Scorer')}</Chip>
      <button onClick={() => setEd({ ...u, password: '' })}>{t('Edit')}</button><button className="danger-o" disabled={String(u._id) === session.id} onClick={() => del(u)}>🗑</button></div>)}
    {ed && <Modal title={ed._id ? 'Edit user' : 'New user'} onClose={() => setEd(null)}>
      <Field l={t('Name')} v={ed.name} on={v => setEd({ ...ed, name: v })} autoFocus />
      <Field l={t('Username')} v={ed.username} on={v => setEd({ ...ed, username: v })} disabled={!!ed._id} />
      <Field l={ed._id ? 'New password (leave empty to keep)' : t('Password')} t="password" v={ed.password} on={v => setEd({ ...ed, password: v })} autoComplete="new-password" />
      <Field l={t('Service no')} v={ed.serviceNo} on={v => setEd({ ...ed, serviceNo: v })} />
      <span className="lbl">Role</span><Pick value={ed.role} onChange={v => setEd({ ...ed, role: v })} items={[{ v: 'scorer', l: t('Scorer'), sub: 'marks scores only' }, { v: 'super', l: t('Super admin'), sub: 'everything' }]} />
      <div className="actions"><button onClick={() => setEd(null)}>{t('Cancel')}</button><button className="p" onClick={save}>{t('Save')}</button></div></Modal>}
  </>;
}
