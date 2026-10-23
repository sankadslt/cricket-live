import { useState } from 'react';
import { api } from '../../api';
import { useApp } from '../../context/AppContext';
import useGet from '../../lib/useGet';
import Modal from '../../components/Modal';
import { Empty, Field, Loading, Pick, Chip } from '../../components/ui';

// Match date / time / pitch. Each box saves when you leave it. "Fill automatically" spreads matches over pitches and time slots.
export default function Schedule() {
  const { cat, t, act, toast } = useApp(), [ms, load] = useGet('/matches?category=' + cat), [rs, loadR] = useGet('/rounds?category=' + cat), [ts] = useGet('/teams?category=' + cat), [add, setAdd] = useState(null), [rd, setRd] = useState(''), [bulk, setBulk] = useState(null), [saved, setSaved] = useState('');
  if (!ms || !rs) return <Loading />;
  const list = ms.filter(m => !rd || m.round?._id === rd), rnd = rs.find(r => r._id === rd), none = rs.filter(r => r.progress.total === 0 && (r.format === 'league' ? r.groups.some(g => g.teams.length > 1) : r.teams.length > 1));
  const gen = async r => { const x = await act(() => api(`/rounds/${r._id}/generate`, 'POST'), null); if (x?.created) { toast(`${x.created} matches created for ${r.name}`); load(); loadR() } };
  const nm = id => ts?.find(x => x._id === id)?.name || '?';
  const addMatch = async () => { const r = await act(() => api('/matches', 'POST', { round: rnd._id, group: add.group, teamA: add.a, teamB: add.b }), 'Match added'); if (r) { setAdd(null); load(); loadR() } };
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
    {(rnd ? rnd.progress.total === 0 : none.length > 0) && <div className="card hintcard"><b>{rnd ? `${rnd.name} has no matches yet.` : 'Some rounds have no matches yet.'}</b>
      <div className="row">{(rnd ? [rnd] : none).map(r => <button key={r._id} className="p" onClick={() => gen(r)}>⚡ Generate fixtures for {r.name}</button>)}</div>
      <p className="mut small">League: every team plays the others in its group. Knockout: the draw is created with byes and empty winner places.</p></div>}
    {rnd?.format === 'league' && <button onClick={() => setAdd({ group: rnd.groups[0]?.name || '', a: '', b: '' })}>+ Add one match by hand</button>}
    {!list.length && !(rnd ? rnd.progress.total === 0 : none.length > 0) && <Empty icon="📅" text="No matches yet. Create a round first." />}
    {saved && <div className="saved" aria-live="polite">✓ {saved}</div>}
    <div className="card plain tw"><table className="sched"><thead><tr><th>#</th><th>Match</th><th>Date</th><th>Time</th><th>Pitch</th><th /></tr></thead>
      <tbody>{list.map(m => <tr key={m._id}><td>{m.no}</td><td className="wrapc"><b>{m.teamA.name}</b> v <b>{m.teamB.name}</b><div className="mut small">{m.round?.name} · {m.group ? `${t('Group')} ${m.group}` : m.label}</div></td>
        <td><input type="date" aria-label={`Date of match ${m.no}`} defaultValue={m.date || ''} onBlur={e => patch(m, 'date', e.target.value)} /></td>
        <td><input type="time" aria-label={`Time of match ${m.no}`} defaultValue={m.time || ''} onBlur={e => patch(m, 'time', e.target.value)} /></td>
        <td><input className="short" aria-label={`Pitch of match ${m.no}`} defaultValue={m.pitch === '-' ? '' : m.pitch} placeholder="1" onBlur={e => patch(m, 'pitch', e.target.value || '-')} /></td>
        <td>{m.status !== 'scheduled' && <Chip kind={m.status}>{m.status}</Chip>}</td></tr>)}</tbody></table></div>
    {add && rnd && <Modal title={`Add a match to ${rnd.name}`} onClose={() => setAdd(null)}>
      <span className="lbl">Group</span><Pick value={add.group} onChange={v => setAdd({ group: v, a: '', b: '' })} items={rnd.groups.map(g => ({ v: g.name, l: g.name }))} />
      {(() => { const tm = rnd.groups.find(g => g.name === add.group)?.teams || []; return <><span className="lbl">Team 1</span><Pick value={add.a} onChange={v => setAdd({ ...add, a: v, b: add.b === v ? '' : add.b })} items={tm.map(id => ({ v: id, l: nm(id) }))} />
        <span className="lbl">Team 2</span><Pick value={add.b} onChange={v => setAdd({ ...add, b: v })} items={tm.filter(id => id !== add.a).map(id => ({ v: id, l: nm(id) }))} /></> })()}
      <div className="actions"><button onClick={() => setAdd(null)}>{t('Cancel')}</button><button className="p" disabled={!add.a || !add.b} onClick={addMatch}>Add match</button></div></Modal>}
    {bulk && <Modal title="Fill the schedule automatically" onClose={() => setBulk(null)}>
      <p className="mut">Matches {rd ? 'of the selected round ' : ''}that have not started are placed one after another on the pitches you list. When all pitches are used, the next time slot starts.</p>
      <Field l="Date" t="date" v={bulk.date} on={v => setBulk({ ...bulk, date: v })} /><Field l="First match time" t="time" v={bulk.time} on={v => setBulk({ ...bulk, time: v })} />
      <Field l="Minutes between slots" t="number" min="10" v={bulk.gap} on={v => setBulk({ ...bulk, gap: v })} /><Field l="Pitches (separate with commas)" v={bulk.pitches} on={v => setBulk({ ...bulk, pitches: v })} hint="Example: 1, 2, 3" />
      <div className="actions"><button onClick={() => setBulk(null)}>{t('Cancel')}</button><button className="p" onClick={run}>Apply to {list.filter(m => !m.scoringMode).length} matches</button></div></Modal>}
  </>;
}
