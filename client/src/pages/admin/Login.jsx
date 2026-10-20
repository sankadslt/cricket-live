import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, session } from '../../api';
import { useApp } from '../../context/AppContext';
import { Field } from '../../components/ui';

export default function Login() {
  const [u, setU] = useState(''), [p, setP] = useState(''), [busy, setBusy] = useState(false), go = useNavigate(), { t, act } = useApp();
  const submit = async e => {
    e.preventDefault(); setBusy(true);
    const r = await act(() => api('/auth/login', 'POST', { username: u, password: p }));
    setBusy(false);
    if (r?.token) { session.set(r); go(r.role === 'super' ? '/admin' : '/admin/scoring') }
  };
  return <form className="card narrow" onSubmit={submit}><h3>🔐 {t('Staff login')}</h3>
    <Field l={t('Username')} v={u} on={setU} autoFocus autoComplete="username" />
    <Field l={t('Password')} t="password" v={p} on={setP} autoComplete="current-password" />
    <button className="p lg" disabled={busy || !u || !p}>{t('Login')}</button>
    <p className="mut small">Super admins manage everything. Scorers can only mark scores.</p></form>;
}
