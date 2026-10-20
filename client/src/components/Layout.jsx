import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { session } from '../api';
import Countdown from './Countdown';

export default function Layout() {
  const { cat, setCat, lang, setLang, t } = useApp(), go = useNavigate(), loc = useLocation(), staff = session.isStaff;
  const inAdmin = loc.pathname.startsWith('/admin');
  const pub = [['/', 'Fixtures'], ['/draw', 'Draw'], ['/points', 'Points'], ['/top', 'Top players'], ['/teams', 'Teams']];
  const adm = session.isSuper ? [['/admin', 'Home'], ['/admin/teams', 'Teams'], ['/admin/rounds', 'Rounds'], ['/admin/schedule', 'Schedule'], ['/admin/scoring', 'Scoring'], ['/admin/users', 'Users']] : [['/admin/scoring', 'Scoring']];
  const L = ([to, k]) => <NavLink key={to} to={to} end={to === '/' || to === '/admin'} className={({ isActive }) => 'tb' + (isActive ? ' act' : '')}>{t(k)}</NavLink>;
  return <>
    <header className={'hero' + (loc.pathname === '/' ? '' : ' small')}><div className="in">
      <div className="top"><NavLink to="/" className="brand"><b>SLT</b>GAMES 2026 <span>Cricket</span></NavLink>
        <div className="tools">
          <button className="ghost" onClick={() => setLang(lang === 'en' ? 'si' : 'en')} aria-label="Language">{lang === 'en' ? 'සිංහල' : 'English'}</button>
          {staff ? <><button className="ghost" onClick={() => go(inAdmin ? '/' : session.isSuper ? '/admin' : '/admin/scoring')}>{inAdmin ? t('Fixtures') : '⚙ ' + (session.name || 'Admin')}</button>
            <button className="ghost" onClick={() => { session.clear(); go('/') }}>{t('Logout')}</button></>
            : <button className="ghost" onClick={() => go('/admin/login')}>{t('Staff login')}</button>}
        </div></div>
      {loc.pathname === '/' && <Countdown label={t('Cricket starts in')} />}
    </div></header>
    <div className="wrap">
      {!inAdmin && <div className="catbar"><div className="seg2" role="group" aria-label="Category">{['boys', 'girls'].map(c => <button key={c} aria-pressed={cat === c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c === 'boys' ? '👦 ' : '👧 '}{t(c === 'boys' ? 'Boys' : 'Girls')}</button>)}</div></div>}
      {inAdmin && staff && <div className="catbar"><div className="seg2" role="group" aria-label="Category">{['boys', 'girls'].map(c => <button key={c} aria-pressed={cat === c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c === 'boys' ? '👦 ' : '👧 '}{t(c === 'boys' ? 'Boys' : 'Girls')}</button>)}</div>
        <span className="role">{session.isSuper ? t('Super admin') : t('Scorer')}</span></div>}
      <nav className={'tabs' + (inAdmin ? ' adm' : '')}>{(inAdmin && staff ? adm : pub).map(L)}</nav>
      <Outlet />
    </div>
    <footer className="foot">SLT Games 2026 · Cricket</footer>
  </>;
}
