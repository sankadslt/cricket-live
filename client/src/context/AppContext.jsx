import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { SI } from '../lib/i18n';
import Modal from '../components/Modal';

const Ctx = createContext();
export const useApp = () => useContext(Ctx);
const ls = (k, d) => { try { return localStorage.getItem(k) || d } catch { return d } };

// Holds: category (boys/girls), language, toast messages, and the "are you sure?" popup
export function AppProvider({ children }) {
  const [cat, setCatS] = useState(ls('cat', 'boys')), [lang, setLangS] = useState(ls('lang', 'en'));
  const [toasts, setToasts] = useState([]), [dlg, setDlg] = useState(null), id = useRef(0);
  const setCat = c => { setCatS(c); try { localStorage.setItem('cat', c) } catch {} };
  const setLang = l => { setLangS(l); try { localStorage.setItem('lang', l) } catch {} document.documentElement.lang = l };
  const t = s => (lang === 'si' && SI[s]) || s;
  const toast = useCallback((msg, kind = 'ok') => {
    const k = ++id.current; setToasts(a => [...a, { k, msg, kind }]); setTimeout(() => setToasts(a => a.filter(x => x.k !== k)), kind === 'err' ? 6000 : 3000);
  }, []);
  // ask({title,text,ok,danger}) -> Promise<boolean>
  const ask = useCallback(o => new Promise(res => setDlg({ ...o, res })), []);
  // act(fn, 'Saved') runs fn, shows the success message or the error, returns the result (undefined on error)
  const act = useCallback(async (fn, okMsg) => { try { const r = await fn(); if (okMsg) toast(okMsg); return r === undefined ? true : r } catch (e) { toast(e.message, 'err') } }, [toast]);
  const close = v => { dlg.res(v); setDlg(null) };
  return <Ctx.Provider value={{ cat, setCat, lang, setLang, t, toast, ask, act }}>
    {children}
    <div className="toasts" role="status" aria-live="polite">{toasts.map(x => <div key={x.k} className={'toast ' + x.kind}>{x.msg}</div>)}</div>
    {dlg && <Modal title={dlg.title || 'Are you sure?'} onClose={() => close(false)}>
      {dlg.text && <p>{dlg.text}</p>}
      <div className="actions"><button onClick={() => close(false)}>{t('Cancel')}</button><button className={dlg.danger ? 'danger' : 'p'} onClick={() => close(true)}>{dlg.ok || 'OK'}</button></div>
    </Modal>}
  </Ctx.Provider>;
}
