import { Pick } from './ui';
// The two batters at the crease. Tap to choose. Strike changes by itself after odd runs and at the end of an over.
// An empty place (opening, or after a wicket) is filled by choosing the next batter.
export default function Crease({ sl, setSl, avail, stat, disabled }) {
  const items = (except) => avail.filter(p => p.name !== except).map(p => ({ v: p.name, l: p.name, sub: stat(p.name) }));
  const need = !sl.s || !sl.n;
  return <div className={'crease' + (need ? ' need' : '')}>
    <div className="row"><b>1 · Batters at the crease</b><button disabled={disabled || !sl.s || !sl.n} onClick={() => setSl({ s: sl.n, n: sl.s })} title="Swap strike">⇄ Swap strike</button></div>
    <span className="lbl">★ On strike {!sl.s && <em className="warn">— choose</em>}</span>
    <Pick value={sl.s} onChange={v => setSl({ s: v, n: sl.n === v ? '' : sl.n })} items={items(sl.n)} />
    <span className="lbl">Non-striker {!sl.n && <em className="warn">— choose</em>}</span>
    <Pick value={sl.n} onChange={v => setSl({ n: v, s: sl.s === v ? '' : sl.s })} items={items(sl.s)} />
    {need ? <div className="hint">{!sl.s && !sl.n ? 'Choose the two opening batters.' : 'Choose the next batter.'}</div> : <div className="mut small">Strike changes by itself: odd runs and the end of each over.</div>}
  </div>;
}
