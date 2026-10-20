import { useState } from 'react';
import { api } from '../../api';
import { useApp } from '../../context/AppContext';
import useGet from '../../lib/useGet';
import Modal from '../../components/Modal';
import { Empty, Field, Loading, Pick, Chip } from '../../components/ui';

// Match date / time / pitch. Each box saves when you leave it. "Fill automatically" spreads matches over pitches and time slots.
export default function Schedule() {
  const { cat, t, act } = useApp(), [ms, load] = useGet('/matches?category=' + cat), [rs] = useGet('/rounds?category=' + cat), [rd, setRd] = useState(''), [bulk, setBulk] = useState(null), [saved, setSaved] = useState('');
  if (!ms || !rs) return <Loading />;
  const list = ms.filter(m => !rd || m.round?._id === rd);
  const patch = async (m, k, v) => { if ((m[k] || '') === v) return; await act(() => api('/matches/' + m._id, 'PATCH', { [k]: v })); setSaved(`#${m.no} saved`); load() };
  const run = async () => {
    const pitches = bulk.pitches.split(/[,\s]+/).filter(Boolean), [hh, mm] = bulk.time.split(':').map(Number);
    if (!pitches.length || !bulk.date || isNaN(hh)) return act(async () => { throw new Error('Enter the date, start time and at least one pitch') });
    const todo = list.filter(m => !m.scoringMode);
    await act(() => Promise.all(todo.map((m, i) => { const slot = Math.floor(i / pitches.length), mins = hh * 60 + mm + slot * +bulk.gap, time = String(Math.floor(mins / 60) % 24).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
      return api('/matches/' + m._id, 'PATCH', { date: bulk.date, time, pitch: pitches[i % pitches.length] }) })), `${todo.length} matches scheduled`);
    setBulk(null); load();
  };
  return <>
    <div className="row"><h2>{t('Schedule')}</h2><button className="p" onClick={() => setBulk({ date: '2026-10-31', time: '09:00', gap: 90, pitches: '1, 2' })} disabled={!list.length}>⚡ Fill automatically</button></div>
    {rs.length > 0 && <Pick value={rd} onChange={setRd} cls="small" items={[{ v: '', l: t('All') }, ...rs.map(r => ({ v: r._id, l: r.name }))]} />}
    {!list.length && <Empty icon="📅" text="No matches yet. Generate fixtures in Rounds first." />}
    {saved && <div className="saved" aria-live="polite">✓ {saved}</div>}
    <div className="card plain tw"><table className="sched"><thead><tr><th>#</th><th>Match</th><th>Date</th><th>Time</th><th>Pitch</th><th /></tr></thead>
      <tbody>{list.map(m => <tr key={m._id}><td>{m.no}</td><td className="wrapc"><b>{m.teamA.name}</b> v <b>{m.teamB.name}</b><div className="mut small">{m.round?.name} · {m.group ? `${t('Group')} ${m.group}` : m.label}</div></td>
        <td><input type="date" aria-label={`Date of match ${m.no}`} defaultValue={m.date || ''} onBlur={e => patch(m, 'date', e.target.value)} /></td>
        <td><input type="time" aria-label={`Time of match ${m.no}`} defaultValue={m.time || ''} onBlur={e => patch(m, 'time', e.target.value)} /></td>
        <td><input className="short" aria-label={`Pitch of match ${m.no}`} defaultValue={m.pitch === '-' ? '' : m.pitch} placeholder="1" onBlur={e => patch(m, 'pitch', e.target.value || '-')} /></td>
        <td>{m.status !== 'scheduled' && <Chip kind={m.status}>{m.status}</Chip>}</td></tr>)}</tbody></table></div>
    {bulk && <Modal title="Fill the schedule automatically" onClose={() => setBulk(null)}>
      <p className="mut">Matches {rd ? 'of the selected round ' : ''}that have not started are placed one after another on the pitches you list. When all pitches are used, the next time slot starts.</p>
      <Field l="Date" t="date" v={bulk.date} on={v => setBulk({ ...bulk, date: v })} /><Field l="First match time" t="time" v={bulk.time} on={v => setBulk({ ...bulk, time: v })} />
      <Field l="Minutes between slots" t="number" min="10" v={bulk.gap} on={v => setBulk({ ...bulk, gap: v })} /><Field l="Pitches (separate with commas)" v={bulk.pitches} on={v => setBulk({ ...bulk, pitches: v })} hint="Example: 1, 2, 3" />
      <div className="actions"><button onClick={() => setBulk(null)}>{t('Cancel')}</button><button className="p" onClick={run}>Apply to {list.filter(m => !m.scoringMode).length} matches</button></div></Modal>}
  </>;
}
