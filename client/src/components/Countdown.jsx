import { useEffect, useState } from 'react';
// Counts down to 31 Oct 2026 00:00 Sri Lanka time
export default function Countdown({ label }) {
  const T = new Date('2026-10-31T00:00:00+05:30').getTime(), [n, setN] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setN(Date.now()), 1000); return () => clearInterval(i) }, []);
  const s = Math.max(0, Math.floor((T - n) / 1000));
  if (!s) return <div className="cd"><b className="begun">🏏 The games have begun!</b></div>;
  return <div className="cd"><span>{label}</span>{[[Math.floor(s / 86400), 'd'], [Math.floor(s % 86400 / 3600), 'h'], [Math.floor(s % 3600 / 60), 'm'], [s % 60, 's']].map(([v, u]) => <span className="dg" key={u}><b>{v}</b>{u}</span>)}</div>;
}
