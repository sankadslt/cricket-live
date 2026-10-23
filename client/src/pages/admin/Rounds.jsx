import { useState } from 'react';
import { api } from '../../api';
import { useApp } from '../../context/AppContext';
import useGet from '../../lib/useGet';
import Modal from '../../components/Modal';
import { Badge, Chip, Empty, Field, Loading, Pick, Toggle } from '../../components/ui';

const LET = 'ABCDEFGH';
const newRound = () => ({ name: '', format: 'league', overs: 10, ballsPerOver: 6, rules: { wideRuns: 1, noBallRuns: 1, wideBall: false, noBallBall: false, lastBallCounts: false }, points: { win: 2, tie: 1, loss: 0 }, groups: [{ name: 'A', teams: [] }], teams: [] });

export default function Rounds() {
  const { cat, t, act, ask, toast } = useApp(), [rs, load] = useGet('/rounds?category=' + cat), [ts] = useGet('/teams?category=' + cat), [ed, setEd] = useState(null);
  if (!rs || !ts) return <Loading />;
  const open = r => setEd(r ? { ...r, groups: (r.groups || []).map(g => ({ name: g.name, teams: [...g.teams] })), teams: [...(r.teams || [])] } : { ...newRound(), name: 'Round ' + (rs.length + 1) });
  const gen = async r => { const x = await act(() => api(`/rounds/${r._id}/generate`, 'POST'), null); if (x?.created) { toast(`${x.created} matches created. Next: set date, time and pitch in Schedule.`); load() } };
  const clr = async r => { if (await ask({ title: 'Clear fixtures of ' + r.name + '?', text: 'All matches of this round are deleted. You can generate them again.', ok: 'Clear fixtures', danger: true })) { await act(() => api(`/rounds/${r._id}/clear`, 'POST'), 'Fixtures cleared'); load() } };
  const del = async r => { if (await ask({ title: 'Delete ' + r.name + '?', text: 'The round and its matches are deleted.', ok: 'Delete', danger: true })) { await act(() => api('/rounds/' + r._id, 'DELETE'), 'Round deleted'); load() } };
  const name = id => ts.find(x => x._id === id)?.name || '?';
  return <>
    <div className="row"><h2>{t('Rounds')} · {cat === 'boys' ? t('Boys') : t('Girls')}</h2><button className="p" onClick={() => open()}>+ Add round</button></div>
    <p className="mut">Every round has its own rules and is either a <b>League</b> (groups, everyone plays everyone in the group) or a <b>Knockout</b> (lose and you are out).</p>
    {!rs.length && <Empty icon="🏆" text="No rounds yet. Create Round 1 first."><button className="p" onClick={() => open()}>+ Add Round 1</button></Empty>}
    {rs.map(r => { const p = r.progress, pct = p.total ? Math.round(p.done * 100 / p.total) : 0, ru = r.rules; return <div className="card round" key={r._id}>
      <div className="row"><h3>{r.name} <Chip kind={r.format === 'league' ? '' : 'live'}>{r.format === 'league' ? t('League') : t('Knockout')}</Chip></h3>
        <div><button onClick={() => open(r)}>{t('Edit')}</button><button className="danger-o" onClick={() => del(r)} title="Delete">🗑</button></div></div>
      <div className="mut">{r.overs} overs · {r.ballsPerOver} balls/over · wide {ru.wideRuns} run{ru.wideRuns === 1 ? '' : 's'}{ru.wideBall ? ' (counts as ball)' : ' (re-bowl)'} · no ball {ru.noBallRuns}{ru.noBallBall ? ' (counts as ball)' : ' (re-bowl)'}{ru.lastBallCounts ? ' · last ball of 2nd innings counts' : ''}{r.format === 'league' && ` · win ${r.points.win} / tie ${r.points.tie} / loss ${r.points.loss}`}</div>
      <div className="chips">{r.format === 'league' ? r.groups.map(g => <span key={g.name} className="grp"><b>{t('Group')} {g.name}</b> {g.teams.map(name).join(', ') || '—'}</span>) : <span className="grp">{r.teams.map((id, i) => `${i + 1}. ${name(id)}`).join('  ') || 'No teams'}</span>}</div>
      <div className="bar" aria-label={`${pct}% finished`}><i style={{ width: pct + '%' }} /></div>
      <div className="row"><span className="mut">{p.total ? `${p.done}/${p.total} matches finished${p.live ? ` · ${p.live} live` : ''}` : 'No fixtures yet'}</span>
        {p.total === 0 ? <button className="p" onClick={() => gen(r)}>⚡ Generate fixtures</button> : <button onClick={() => clr(r)}>Clear fixtures</button>}</div></div> })}
    {ed && <Editor ed={ed} setEd={setEd} ts={ts} rs={rs} cat={cat} locked={ed._id && rs.find(r => r._id === ed._id)?.progress.total > 0} onSaved={async (r, isNew) => { setEd(null); load();
      const can = r.format === 'league' ? r.groups.some(g => g.teams.length > 1) : r.teams.length > 1;
      if (isNew && can && await ask({ title: 'Generate the matches now?', text: `Create all the fixtures of ${r.name} automatically. You can set the date, time and pitch next.`, ok: 'Generate fixtures' })) gen(r) }} />}
  </>;
}

function Editor({ ed, setEd, ts, rs, cat, locked, onSaved }) {
  const { act, t, toast } = useApp(), set = (k, v) => setEd({ ...ed, [k]: v }), rule = (k, v) => setEd({ ...ed, rules: { ...ed.rules, [k]: v } }), pt = (k, v) => setEd({ ...ed, points: { ...ed.points, [k]: v } });
  const num = (k, o = ed) => v => set(k, v === '' ? '' : +v);
  const save = async () => {
    const body = { ...ed, category: cat }; if (ed.format === 'league') body.groups = ed.groups.filter(g => g.teams.length); else body.teams = ed.teams;
    const r = await act(() => ed._id ? api('/rounds/' + ed._id, 'PUT', body) : api('/rounds', 'POST', body), 'Round saved');
    if (r) onSaved(r, !ed._id);
  };
  // ----- league groups -----
  const groupOf = id => ed.groups.findIndex(g => g.teams.includes(id));
  const assign = (id, gi) => setEd({ ...ed, groups: ed.groups.map((g, i) => ({ ...g, teams: g.teams.filter(x => x !== id).concat(i === gi ? [id] : []) })) });
  const setGroups = n => { const gs = Array.from({ length: n }, (_, i) => ed.groups[i] || { name: LET[i], teams: [] }); setEd({ ...ed, groups: gs.map(g => ({ ...g, teams: g.teams.filter(id => ts.some(x => x._id === id)) })) }) };
  const auto = () => { const n = ed.groups.length; setEd({ ...ed, groups: ed.groups.map((g, i) => ({ ...g, teams: ts.filter((_, j) => j % n === i).map(x => x._id) })) }) };
  // ----- knockout order -----
  const move = (i, d) => { const a = [...ed.teams]; [a[i], a[i + d]] = [a[i + d], a[i]]; set('teams', a) };
  const fromPrev = async (top) => {
    if (!ed._id) { act(async () => { throw new Error('Save this round first, then use "Fill from previous round".') }); return }
    const r = await act(() => api(`/rounds/${ed._id}/qualifiers?top=${top}`), null);
    if (r) { set('teams', r.teams); toast(`${r.teams.length} teams from ${r.from.name}${r.complete ? '' : ' (that round is not finished yet: this is the current standing)'}`) }
  };
  const hasLeague = rs.some(r => r.format === 'league' && (!ed._id || r.no < ed.no));
  const [top, setTop] = useState(2);
  return <Modal wide title={ed._id ? 'Edit ' + ed.name : 'New round'} onClose={() => setEd(null)}>
    <Field l="Round name" v={ed.name} on={v => set('name', v)} />
    <span className="lbl">Format</span>
    <Pick value={ed.format} onChange={v => set('format', v)} items={[{ v: 'league', l: '🔁 ' + t('League'), sub: 'groups, all play all', off: !!ed._id }, { v: 'knockout', l: '⚔ ' + t('Knockout'), sub: 'lose and you are out', off: !!ed._id }]} />
    <h4>Rules for this round</h4>
    <div className="grid"><Field l="Overs per innings" t="number" min="1" v={ed.overs} on={num('overs')} /><Field l="Balls per over" t="number" min="1" v={ed.ballsPerOver} on={num('ballsPerOver')} /></div>
    <div className="grid"><Field l="Wide gives (runs)" t="number" min="0" v={ed.rules.wideRuns} on={v => rule('wideRuns', +v)} /><Field l="No ball gives (runs)" t="number" min="0" v={ed.rules.noBallRuns} on={v => rule('noBallRuns', +v)} /></div>
    <div className="grid"><Toggle l="Wide counts as a ball" sub={ed.rules.wideBall ? 'yes: one ball is used' : 'no: ball is re-bowled'} v={ed.rules.wideBall} on={v => rule('wideBall', v)} />
      <Toggle l="No ball counts as a ball" sub={ed.rules.noBallBall ? 'yes: one ball is used' : 'no: ball is re-bowled'} v={ed.rules.noBallBall} on={v => rule('noBallBall', v)} /></div>
    <Toggle l="Last ball of the 2nd innings counts" sub={ed.rules.lastBallCounts ? 'yes: a wide / no ball on the very last ball is NOT re-bowled. It counts as the last ball and its runs are added.' : 'no: a wide / no ball on the last ball is re-bowled (normal rule)'} v={ed.rules.lastBallCounts} on={v => rule('lastBallCounts', v)} />
    {ed.format === 'league' && <><h4>Points</h4><div className="grid"><Field l="Win" t="number" min="0" v={ed.points.win} on={v => pt('win', +v)} /><Field l="Tie" t="number" min="0" v={ed.points.tie} on={v => pt('tie', +v)} /><Field l="Loss" t="number" min="0" v={ed.points.loss} on={v => pt('loss', +v)} /></div></>}
    <h4>{ed.format === 'league' ? 'Groups and teams' : 'Teams in the draw'}</h4>
    {locked && <div className="hint">Fixtures are already generated, so teams and groups are locked. Clear the fixtures to change them. Rules can still be changed (matches that have not started follow them).</div>}
    {ed.format === 'league' ? <fieldset disabled={locked} className="plain">
      <div className="row"><span>Number of groups</span><div className="stepper"><button onClick={() => setGroups(Math.max(1, ed.groups.length - 1))} aria-label="Fewer groups">−</button><b>{ed.groups.length}</b><button onClick={() => setGroups(Math.min(8, ed.groups.length + 1))} aria-label="More groups">+</button></div><button onClick={auto}>⚡ Auto-split teams evenly</button></div>
      <p className="mut small">Tap a group letter for each team. Each group's teams play each other once.</p>
      {ts.map(x => { const gi = groupOf(x._id); return <div className="arow" key={x._id}><Badge name={x.name} size={28} /><span className="tn">{x.name}</span>
        <div className="pick small">{ed.groups.map((g, i) => <button key={g.name} type="button" aria-pressed={gi === i} className={'pk' + (gi === i ? ' on' : '')} onClick={() => assign(x._id, gi === i ? -1 : i)}>{g.name}</button>)}</div></div> })}
      <div className="chips">{ed.groups.map(g => <span className="grp" key={g.name}><b>{g.name}</b>: {g.teams.length} teams{g.teams.length === 1 ? ' (needs at least 2)' : ''}</span>)}</div>
    </fieldset> : <fieldset disabled={locked} className="plain">
      {hasLeague && <div className="sub"><b>Fill from the previous league round</b><div className="row"><span>Top teams of each group:</span><Pick value={top} onChange={setTop} cls="small" items={[1, 2, 3, 4].map(n => ({ v: n, l: String(n) }))} /><button onClick={() => fromPrev(top)}>⬇ Fill teams</button></div>
        <p className="mut small">Teams are placed so that group winners meet runners-up of other groups.</p></div>}
      <p className="mut small">Draw order: neighbours play each other first. If the number of teams is not 2, 4, 8…, the first teams get a bye.</p>
      {ed.teams.map((id, i) => <div className="arow" key={id}><b className="rank">{i + 1}</b><Badge name={name(ts, id)} size={28} /><span className="tn">{name(ts, id)}</span>
        <button disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button><button disabled={i === ed.teams.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button><button onClick={() => set('teams', ed.teams.filter(x => x !== id))} aria-label="Remove">✕</button></div>)}
      <span className="lbl">Tap to add a team</span>
      <div className="pick small">{ts.filter(x => !ed.teams.includes(x._id)).map(x => <button key={x._id} className="pk" onClick={() => set('teams', [...ed.teams, x._id])}>+ {x.name}</button>)}</div>
    </fieldset>}
    <div className="actions"><button onClick={() => setEd(null)}>{t('Cancel')}</button><button className="p" onClick={save}>{t('Save')}</button></div>
  </Modal>;
}
const name = (ts, id) => ts.find(x => x._id === id)?.name || '?';
