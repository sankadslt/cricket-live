import { ini } from '../lib/cricket';
export const Field = ({ l, v, on, t = 'text', hint, ...p }) => <label className="f"><span>{l}</span><input type={t} value={v ?? ''} onChange={e => on(e.target.value)} {...p} />{hint && <em>{hint}</em>}</label>;
// Tap-to-choose buttons instead of typing or drop-downs. items: [{v,l,sub,off}]
export const Pick = ({ items, value, onChange, cls = '' }) => <div className={'pick ' + cls} role="group">{items.map(i =>
  <button type="button" key={i.v} disabled={i.off} aria-pressed={value === i.v} className={'pk' + (value === i.v ? ' on' : '')} onClick={() => onChange(i.v)}>{i.l}{i.sub && <small>{i.sub}</small>}</button>)}</div>;
export const Toggle = ({ l, sub, v, on }) => <button type="button" role="switch" aria-checked={!!v} className={'tgl' + (v ? ' on' : '')} onClick={() => on(!v)}><i /><span>{l}{sub && <small>{sub}</small>}</span></button>;
export const Chip = ({ kind = '', children }) => <span className={'chip ' + kind}>{children}</span>;
export const Empty = ({ icon = '🏏', text, children }) => <div className="empty"><div>{icon}</div><p>{text}</p>{children}</div>;
export const Loading = () => <div className="loading"><i /><i /><i /></div>;
export const Bad = ({ text }) => <div className="card warn">⚠ {text}</div>;
export const Badge = ({ name, size = 36 }) => <span className="bd" aria-hidden="true" style={{ width: size, height: size, fontSize: size * .34 }}>{ini(name)}</span>;
export function Avatar({ name = '', size = 40 }) {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360, id = 'g' + h + size;
  return <svg className="avatar" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={`hsl(${h},60%,45%)`} /><stop offset="1" stopColor={`hsl(${(h + 60) % 360},60%,32%)`} /></linearGradient></defs>
    <rect width="48" height="48" rx="24" fill={`url(#${id})`} /><circle cx="24" cy="19" r="8" fill="#fff" opacity=".9" /><path d="M8 44c2-10 9-14 16-14s14 4 16 14z" fill="#fff" opacity=".9" /></svg>;
}
export const Steps = ({ items, at }) => <ol className="steps">{items.map((s, i) => <li key={s} className={i < at ? 'done' : i === at ? 'now' : ''}><b>{i < at ? '✓' : i + 1}</b><span>{s}</span></li>)}</ol>;
