export const cls = t => /^W$/i.test(t) ? 'w' : /^(Wd|Nb)/i.test(t) ? 'x' : /^[BL]\d/i.test(t) ? 'b' : t === '4' ? 'f' : t === '6' ? 's' : t === '0' ? 'd' : '';
export default function BallChips({ marks }) { return <span className="balls">{marks.map((t, i) => <i key={i} className={'bl ' + cls(t)}>{t === '0' ? '•' : t}</i>)}</span> }
