import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// The whole tournament as a decision tree (one picture): league groups on the left, knockout rounds to the right.
// Winners move along the lines. Tap a team to light it up, tap a match to open it. "Download image" saves a PNG.
const W = 210, MH = 70, GX = 64, GY = 22, PAD = 20, TOP = 46, F = "Arial, 'Noto Sans Sinhala', sans-serif";
const cut = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;

function layout(rounds) {
  const cols = [], pos = {};
  rounds.forEach(r => {
    if (r.format === 'league') {
      if (r.groups.length) cols.push({ title: r.name + ' · League', sub: r.status === 'done' ? 'finished' : r.status, nodes: r.groups.map(g => ({ type: 'group', id: r._id + g.name, g, h: 30 + Math.max(g.rows.length, 1) * 20 })) });
    } else if (r.matches.length) {
      const ks = [...new Set(r.matches.map(m => m.koRound))].sort((a, b) => a - b);
      ks.forEach((k, ki) => cols.push({ title: r.matches.find(m => m.koRound === k).label, sub: r.name, nodes: r.matches.filter(m => m.koRound === k).sort((a, b) => a.no - b.no).map(m => ({ type: 'match', id: m._id, m, h: MH })) }));
    }
  });
  cols.forEach((c, ci) => {
    let y = TOP;
    c.nodes.forEach(n => { n.x = PAD + ci * (W + GX);
      if (n.type === 'match') { const src = [n.m.srcA, n.m.srcB].map(s => pos[s]).filter(Boolean); if (src.length) y = Math.max(y, src.reduce((a, p) => a + p.y + p.h / 2, 0) / src.length - n.h / 2) }
      n.y = y; y += n.h + GY * (ci === 0 || c.nodes[0].type === 'group' ? 1.4 : 1.4); pos[n.id] = n });
  });
  const H = Math.max(...cols.flatMap(c => c.nodes.map(n => n.y + n.h)), 120) + PAD;
  return { cols, pos, w: PAD * 2 + cols.length * W + Math.max(cols.length - 1, 0) * GX, h: H };
}

export default function DrawTree({ rounds, title }) {
  const { t } = useApp(), go = useNavigate(), [hi, setHi] = useState(null), ref = useRef(null);
  const L = layout(rounds), nextId = rounds.flatMap(r => r.matches).filter(m => m.status !== 'done' && m.teamA._id && m.teamB._id).sort((a, b) => (a.status === 'live' ? -1 : 0) - (b.status === 'live' ? -1 : 0) || a.no - b.no)[0]?._id;
  if (!L.cols.length) return <p className="mut">The tree will appear when the groups or fixtures are ready.</p>;
  const hdr = 34;
  const download = () => {
    const svg = ref.current.cloneNode(true); svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' })), img = new Image();
    img.onload = () => { const c = document.createElement('canvas'); c.width = L.w * 2; c.height = (L.h + hdr) * 2; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'slt-games-2026-cricket-draw.png'; a.click(); URL.revokeObjectURL(url) }) };
    img.src = url;
  };
  const Team = ({ n, tm, i }) => {
    const m = n.m, I = m.innings?.find(x => String(x.team._id) === String(tm._id)), won = m.winner && String(m.winner) === String(tm._id), lost = m.status === 'done' && m.winner && !won, y = n.y + 36 + i * 19;
    return <g onClick={e => { e.stopPropagation(); tm._id && setHi(hi === tm._id ? null : tm._id) }} style={{ cursor: tm._id ? 'pointer' : 'default' }}>
      {hi && tm._id === hi && <rect x={n.x + 3} y={y - 13} width={W - 6} height={18} rx="4" fill="#bfdbfe" />}
      {won && <rect x={n.x + 3} y={y - 13} width={W - 6} height={18} rx="4" fill="#dcfce7" />}
      <text x={n.x + 10} y={y} fontSize="13" fontFamily={F} fontWeight={won ? 700 : 500} fill={lost ? '#94a3b8' : tm._id ? '#0b1f2e' : '#94a3b8'} fontStyle={tm._id ? 'normal' : 'italic'}>{cut(tm._id ? tm.name : (tm.placeholder || 'TBD'), 20)}{won ? ' ✓' : ''}</text>
      {I && <text x={n.x + W - 10} y={y} fontSize="13" fontFamily={F} fontWeight="700" textAnchor="end" fill="#0b1f2e">{I.sum.runs}/{I.sum.wickets}</text>}
    </g>;
  };
  const links = [];
  L.cols.forEach(c => c.nodes.forEach(n => { if (n.type === 'match') [n.m.srcA, n.m.srcB].forEach(s => { const p = L.pos[s]; if (p) { const x1 = p.x + W, y1 = p.y + p.h / 2, x2 = n.x, y2 = n.y + n.h / 2, xm = x1 + GX / 2, done = p.m?.status === 'done'; links.push(<path key={n.id + s} d={`M${x1} ${y1} H${xm} V${y2} H${x2}`} fill="none" stroke={done ? '#2e9e4f' : '#94a3b8'} strokeWidth="2" />) } }) }));
  return <div>
    <div className="row"><span className="mut">Tap a team to follow it. Tap a match to open it.</span><button onClick={download}>⬇ Download image</button></div>
    <div className="treewrap"><svg ref={ref} width={L.w} height={L.h + hdr} viewBox={`0 ${-hdr} ${L.w} ${L.h + hdr}`} role="img" aria-label="Match draw tree" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y={-hdr} width={L.w} height={L.h + hdr} fill="#fff" />
      <text x={PAD} y={-12} fontSize="17" fontWeight="800" fontFamily={F} fill="#00508F">{title || 'SLT Games 2026 Cricket · Match draw'}</text>
      {links}
      {L.cols.map((c, ci) => <g key={ci}><text x={PAD + ci * (W + GX) + W / 2} y={18} fontSize="13" fontWeight="700" textAnchor="middle" fontFamily={F} fill="#0072BC">{cut(c.title, 28)}</text>
        <text x={PAD + ci * (W + GX) + W / 2} y={33} fontSize="11" textAnchor="middle" fontFamily={F} fill="#64748b">{cut(c.sub || '', 30)}</text></g>)}
      {L.cols.map(c => c.nodes.map(n => n.type === 'group'
        ? <g key={n.id}><rect x={n.x} y={n.y} width={W} height={n.h} rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
            <text x={n.x + 10} y={n.y + 19} fontSize="12" fontWeight="700" fontFamily={F} fill="#0072BC">{t('Group')} {n.g.name}</text><text x={n.x + W - 10} y={n.y + 19} fontSize="11" fontFamily={F} textAnchor="end" fill="#64748b">Pts</text>
            {n.g.rows.map((r, i) => <g key={r.id} onClick={() => setHi(hi === r.id ? null : r.id)} style={{ cursor: 'pointer' }}>
              {hi === r.id && <rect x={n.x + 3} y={n.y + 25 + i * 20} width={W - 6} height={19} rx="4" fill="#bfdbfe" />}
              {i < 2 && <rect x={n.x} y={n.y + 25 + i * 20} width="4" height="19" fill="#2e9e4f" />}
              <text x={n.x + 12} y={n.y + 39 + i * 20} fontSize="13" fontFamily={F} fill="#0b1f2e">{cut(r.team, 20)}</text><text x={n.x + W - 10} y={n.y + 39 + i * 20} fontSize="13" fontWeight="700" textAnchor="end" fontFamily={F} fill="#0b1f2e">{r.pts}</text></g>)}</g>
        : <g key={n.id}><rect x={n.x} y={n.y} width={W} height={n.h} rx="10" fill="#fff" stroke={n.m.status === 'live' ? '#e5333b' : n.m.status === 'done' ? '#2e9e4f' : n.id === nextId ? '#0072BC' : '#cbd5e1'} strokeWidth={n.id === nextId || n.m.status === 'live' ? 3 : 1.8} />
            <g onClick={() => go('/match/' + n.m._id)} style={{ cursor: 'pointer' }}><text x={n.x + 10} y={n.y + 14} fontSize="10.5" fontFamily={F} fill="#64748b">#{n.m.no}{n.m.status === 'live' ? ' · LIVE' : n.m.date ? ` · ${n.m.date.slice(5)} ${n.m.time || ''}` : ''}{n.id === nextId && n.m.status !== 'live' ? ' · NEXT' : ''}</text>
              <text x={n.x + W - 10} y={n.y + 14} fontSize="10.5" fontFamily={F} textAnchor="end" fill="#0072BC">open ›</text></g>
            <Team n={n} tm={n.m.teamA} i={0} /><Team n={n} tm={n.m.teamB} i={1} /></g>))}
      {L.cols.some(c => c.nodes[0].type === 'group') && L.cols.length > 1 && L.cols[1].nodes[0].type === 'match' && <text x={PAD + W + GX / 2} y={TOP + 8} fontSize="10" textAnchor="middle" fontFamily={F} fill="#2e9e4f">top teams →</text>}
    </svg></div>
  </div>;
}
